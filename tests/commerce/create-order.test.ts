import { beforeEach, describe, expect, it } from "vitest"
import { testPrisma } from "../helpers/test-prisma"
import { ProductStatus, ReservationStatus } from "../../lib/generated/prisma/client"
import { createOrder } from "../../lib/commerce/create-order"
import {
  IdempotencyKeyConflictError,
  InsufficientStockError,
  ProductNotPurchasableError,
  VariantNotFoundError,
} from "../../lib/commerce/errors"
import { RESERVATION_WINDOW_HOURS } from "../../lib/commerce/constants"
import { buildCheckoutInput, createPublishedProductWithVariant, resetCommerceTables } from "../helpers/factories"

beforeEach(async () => {
  await resetCommerceTables()
})

describe("createOrder — happy path", () => {
  it("(A) geçerli girdiyle bir sipariş oluşturur", async () => {
    const { variantId, price } = await createPublishedProductWithVariant({ stockQuantity: 5, price: 250 })

    const result = await createOrder(buildCheckoutInput({ items: [{ variantId, quantity: 2 }] }), testPrisma)

    expect(result.orderId).toBeTruthy()
    expect(result.orderNumber).toMatch(/^ORD-\d{8}-[A-Z0-9]{6}$/)
    expect(result.currency).toBe("TRY")
    expect(result.paymentStatus).toBe("PENDING")
    expect(result.orderStatus).toBe("PAYMENT_PENDING")
    expect(result.total).toBe((price * 2).toFixed(2))
  })

  it("(J) toplamı sunucu tarafında fiyat×adet olarak hesaplar (client'tan gelen bir total alanı yok)", async () => {
    const a = await createPublishedProductWithVariant({ stockQuantity: 5, price: 100 })
    const b = await createPublishedProductWithVariant({ stockQuantity: 5, price: 60 })

    const result = await createOrder(
      buildCheckoutInput({
        items: [
          { variantId: a.variantId, quantity: 2 },
          { variantId: b.variantId, quantity: 3 },
        ],
      }),
      testPrisma
    )

    // 2*100 + 3*60 = 380
    expect(result.total).toBe("380.00")
  })

  it("(K) OrderItem snapshot'ını (sku/ürün adı/birim fiyat/adet/satır toplamı) doğru yazar", async () => {
    const { variantId, sku, price } = await createPublishedProductWithVariant({ stockQuantity: 5, price: 175 })

    const result = await createOrder(buildCheckoutInput({ items: [{ variantId, quantity: 3 }] }), testPrisma)

    const items = await testPrisma.orderItem.findMany({ where: { orderId: result.orderId } })
    expect(items).toHaveLength(1)
    expect(items[0].skuSnapshot).toBe(sku)
    expect(items[0].quantity).toBe(3)
    expect(items[0].unitPriceSnapshot.toFixed(2)).toBe(price.toFixed(2))
    expect(items[0].lineTotal.toFixed(2)).toBe((price * 3).toFixed(2))
  })

  it("(L) InventoryReservation'ı ACTIVE ve ~+24 saat expiresAt ile oluşturur", async () => {
    const { variantId } = await createPublishedProductWithVariant({ stockQuantity: 5, price: 100 })
    const before = Date.now()

    const result = await createOrder(buildCheckoutInput({ items: [{ variantId, quantity: 1 }] }), testPrisma)

    const reservations = await testPrisma.inventoryReservation.findMany({ where: { orderId: result.orderId } })
    expect(reservations).toHaveLength(1)
    expect(reservations[0].status).toBe(ReservationStatus.ACTIVE)
    expect(reservations[0].quantity).toBe(1)

    const expectedExpiry = before + RESERVATION_WINDOW_HOURS * 60 * 60 * 1000
    const actualExpiry = reservations[0].expiresAt.getTime()
    // Test yürütme süresine tolerans (birkaç saniye) tanı.
    expect(Math.abs(actualExpiry - expectedExpiry)).toBeLessThan(10_000)
  })

  it("(I) aynı variantId iki kez gelirse miktarları birleştirir, tek bir OrderItem oluşturur", async () => {
    const { variantId } = await createPublishedProductWithVariant({ stockQuantity: 10, price: 50 })

    const result = await createOrder(
      buildCheckoutInput({
        items: [
          { variantId, quantity: 2 },
          { variantId, quantity: 3 },
        ],
      }),
      testPrisma
    )

    const items = await testPrisma.orderItem.findMany({ where: { orderId: result.orderId } })
    expect(items).toHaveLength(1)
    expect(items[0].quantity).toBe(5)
    expect(result.total).toBe("250.00")
  })
})

describe("createOrder — idempotency", () => {
  it("(B) aynı orderIdempotencyKey ile ikinci çağrı, ikinci bir sipariş oluşturmadan aynı siparişi döndürür", async () => {
    const { variantId } = await createPublishedProductWithVariant({ stockQuantity: 5, price: 100 })
    const input = buildCheckoutInput({ items: [{ variantId, quantity: 1 }] })

    const first = await createOrder(input, testPrisma)
    const second = await createOrder(input, testPrisma)

    expect(second.orderId).toBe(first.orderId)
    expect(second.orderNumber).toBe(first.orderNumber)

    const orderCount = await testPrisma.order.count({ where: { orderIdempotencyKey: input.orderIdempotencyKey } })
    expect(orderCount).toBe(1)
  })

  it("(C) aynı key farklı payload ile gelirse IdempotencyKeyConflictError fırlatır, sessizce eski siparişi döndürmez", async () => {
    const { variantId } = await createPublishedProductWithVariant({ stockQuantity: 5, price: 100 })
    const key = "shared-idempotency-key-conflict-test"

    await createOrder(buildCheckoutInput({ orderIdempotencyKey: key, items: [{ variantId, quantity: 1 }] }), testPrisma)

    await expect(
      createOrder(buildCheckoutInput({ orderIdempotencyKey: key, items: [{ variantId, quantity: 2 }] }), testPrisma)
    ).rejects.toThrow(IdempotencyKeyConflictError)
  })
})

describe("createOrder — doğrulama/hata durumları", () => {
  it("(D) yetersiz stokta InsufficientStockError fırlatır ve sipariş oluşturmaz", async () => {
    const { variantId } = await createPublishedProductWithVariant({ stockQuantity: 2, price: 100 })

    await expect(
      createOrder(buildCheckoutInput({ items: [{ variantId, quantity: 5 }] }), testPrisma)
    ).rejects.toThrow(InsufficientStockError)

    const orderCount = await testPrisma.order.count()
    expect(orderCount).toBe(0)
  })

  it("(E) var olmayan bir variantId için VariantNotFoundError fırlatır", async () => {
    await expect(
      createOrder(buildCheckoutInput({ items: [{ variantId: "does-not-exist", quantity: 1 }] }), testPrisma)
    ).rejects.toThrow(VariantNotFoundError)
  })

  it("(F) DRAFT bir ürünün varyantı satın alınamaz (ProductNotPurchasableError)", async () => {
    const { variantId } = await createPublishedProductWithVariant({
      stockQuantity: 5,
      price: 100,
      status: ProductStatus.DRAFT,
    })

    await expect(
      createOrder(buildCheckoutInput({ items: [{ variantId, quantity: 1 }] }), testPrisma)
    ).rejects.toThrow(ProductNotPurchasableError)
  })

  it("(G) ARCHIVED bir ürünün varyantı satın alınamaz (ProductNotPurchasableError)", async () => {
    const { variantId } = await createPublishedProductWithVariant({
      stockQuantity: 5,
      price: 100,
      status: ProductStatus.ARCHIVED,
    })

    await expect(
      createOrder(buildCheckoutInput({ items: [{ variantId, quantity: 1 }] }), testPrisma)
    ).rejects.toThrow(ProductNotPurchasableError)
  })

  it("(H) quantity <= 0 girdi doğrulamasında reddedilir", async () => {
    const { variantId } = await createPublishedProductWithVariant({ stockQuantity: 5, price: 100 })

    await expect(createOrder(buildCheckoutInput({ items: [{ variantId, quantity: 0 }] }), testPrisma)).rejects.toThrow()
    await expect(createOrder(buildCheckoutInput({ items: [{ variantId, quantity: -1 }] }), testPrisma)).rejects.toThrow()
  })
})

describe("createOrder — snapshot değişmezliği (VIDEO 06 final review, Section 8)", () => {
  it("ürün adı/fiyatı sipariş SONRASI değişirse mevcut OrderItem snapshot'ı BOZULMAZ", async () => {
    const { variantId, sku, price } = await createPublishedProductWithVariant({
      stockQuantity: 5,
      price: 300,
    })

    const result = await createOrder(buildCheckoutInput({ items: [{ variantId, quantity: 2 }] }), testPrisma)

    // Katalogda ürünü/varyantı DEĞİŞTİR — sipariş oluşturulduktan SONRA.
    const variantBefore = await testPrisma.variant.findUniqueOrThrow({ where: { id: variantId } })
    await testPrisma.product.update({
      where: { id: variantBefore.productId },
      data: { name: "Değiştirilmiş Ürün Adı" },
    })
    await testPrisma.variant.update({
      where: { id: variantId },
      data: { price: 999.99, sku: `${sku}-CHANGED` },
    })

    const items = await testPrisma.orderItem.findMany({ where: { orderId: result.orderId } })
    expect(items).toHaveLength(1)
    // Snapshot alanları DEĞİŞMEMİŞ olmalı — Variant/Product'taki güncel
    // değerleri değil, sipariş anındaki değerleri yansıtmaya devam etmeli.
    expect(items[0].skuSnapshot).toBe(sku)
    expect(items[0].unitPriceSnapshot.toFixed(2)).toBe(price.toFixed(2))
    expect(items[0].lineTotal.toFixed(2)).toBe((price * 2).toFixed(2))
    expect(items[0].productNameSnapshot).not.toBe("Değiştirilmiş Ürün Adı")

    // Sipariş toplamı da (Order.total) hâlâ ORİJİNAL fiyata dayanmalı.
    const order = await testPrisma.order.findUniqueOrThrow({ where: { id: result.orderId } })
    expect(order.total.toFixed(2)).toBe((price * 2).toFixed(2))
  })
})
