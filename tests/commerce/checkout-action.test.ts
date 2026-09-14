import { beforeEach, describe, expect, it } from "vitest"
import { testPrisma } from "../helpers/test-prisma"
import { ProductStatus } from "../../lib/generated/prisma/client"
import { submitCheckoutOrder } from "../../lib/commerce/checkout-action"
import { buildCheckoutInput, createPublishedProductWithVariant, resetCommerceTables } from "../helpers/factories"

beforeEach(async () => {
  await resetCommerceTables()
})

describe("submitCheckoutOrder — Server Action sınırı", () => {
  it("geçerli girdiyle başarılı sonuç döner (orderId İÇERMEZ, yalnızca insana dönük alanlar)", async () => {
    const { variantId, price } = await createPublishedProductWithVariant({ stockQuantity: 5, price: 250 })

    const result = await submitCheckoutOrder(
      buildCheckoutInput({ items: [{ variantId, quantity: 2 }] }),
      testPrisma
    )

    expect(result.success).toBe(true)
    if (!result.success) throw new Error("beklenmedik hata")
    expect(result.order.orderNumber).toMatch(/^ORD-\d{8}-[A-Z0-9]{6}$/)
    expect(result.order.total).toBe((price * 2).toFixed(2))
    expect(result.order.paymentStatus).toBe("PENDING")
    expect(result.order.orderStatus).toBe("PAYMENT_PENDING")
    expect(result.order).not.toHaveProperty("orderId")
  })

  it("geçersiz girdide (schema doğrulaması başarısız) throw ETMEZ, INVALID_INPUT döner", async () => {
    const result = await submitCheckoutOrder({ items: [] }, testPrisma)

    expect(result.success).toBe(false)
    if (result.success) throw new Error("beklenmedik başarı")
    expect(result.error.code).toBe("INVALID_INPUT")
    expect(result.error.message).toBeTruthy()
  })

  it("yetersiz stokta throw ETMEZ, STOCK_UNAVAILABLE ve güvenli mesaj döner", async () => {
    const { variantId } = await createPublishedProductWithVariant({ stockQuantity: 2 })

    const result = await submitCheckoutOrder(
      buildCheckoutInput({ items: [{ variantId, quantity: 5 }] }),
      testPrisma
    )

    expect(result.success).toBe(false)
    if (result.success) throw new Error("beklenmedik başarı")
    expect(result.error.code).toBe("STOCK_UNAVAILABLE")
    expect(result.error.message).toBe("Sepetinizdeki bazı ürünlerin stoğu değişti. Lütfen sepetinizi kontrol edin.")

    const orderCount = await testPrisma.order.count()
    expect(orderCount).toBe(0)
  })

  it("DRAFT bir ürünün varyantı denendiğinde PRODUCT_UNAVAILABLE döner (detay sızdırmaz)", async () => {
    const { variantId } = await createPublishedProductWithVariant({
      stockQuantity: 5,
      status: ProductStatus.DRAFT,
    })

    const result = await submitCheckoutOrder(
      buildCheckoutInput({ items: [{ variantId, quantity: 1 }] }),
      testPrisma
    )

    expect(result.success).toBe(false)
    if (result.success) throw new Error("beklenmedik başarı")
    expect(result.error.code).toBe("PRODUCT_UNAVAILABLE")
    // Hata mesajı "DRAFT" gibi internal bir durum adı İÇERMEMELİ.
    expect(result.error.message.toLowerCase()).not.toContain("draft")
  })

  it("ARCHIVED bir ürünün varyantı denendiğinde PRODUCT_UNAVAILABLE döner", async () => {
    const { variantId } = await createPublishedProductWithVariant({
      stockQuantity: 5,
      status: ProductStatus.ARCHIVED,
    })

    const result = await submitCheckoutOrder(
      buildCheckoutInput({ items: [{ variantId, quantity: 1 }] }),
      testPrisma
    )

    expect(result.success).toBe(false)
    if (result.success) throw new Error("beklenmedik başarı")
    expect(result.error.code).toBe("PRODUCT_UNAVAILABLE")
  })

  it("var olmayan bir variantId'de PRODUCT_UNAVAILABLE döner (variantId sızdırmaz)", async () => {
    const result = await submitCheckoutOrder(
      buildCheckoutInput({ items: [{ variantId: "does-not-exist-12345", quantity: 1 }] }),
      testPrisma
    )

    expect(result.success).toBe(false)
    if (result.success) throw new Error("beklenmedik başarı")
    expect(result.error.code).toBe("PRODUCT_UNAVAILABLE")
    expect(result.error.message).not.toContain("does-not-exist-12345")
  })

  it("aynı orderIdempotencyKey ile ikinci çağrı throw ETMEZ, aynı başarı sonucunu döner (tek Order)", async () => {
    const { variantId } = await createPublishedProductWithVariant({ stockQuantity: 5 })
    const input = buildCheckoutInput({ items: [{ variantId, quantity: 1 }] })

    const first = await submitCheckoutOrder(input, testPrisma)
    const second = await submitCheckoutOrder(input, testPrisma)

    expect(first.success).toBe(true)
    expect(second.success).toBe(true)
    if (!first.success || !second.success) throw new Error("beklenmedik hata")
    expect(second.order.orderNumber).toBe(first.order.orderNumber)

    const orderCount = await testPrisma.order.count({
      where: { orderIdempotencyKey: input.orderIdempotencyKey },
    })
    expect(orderCount).toBe(1)
  })
})
