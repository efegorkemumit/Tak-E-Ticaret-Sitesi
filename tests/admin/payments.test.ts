import "../helpers/mock-admin-cookie"
import { beforeEach, describe, expect, it } from "vitest"
import { testPrisma } from "../helpers/test-prisma"
import { OrderStatus, PaymentStatus, ReservationStatus } from "../../lib/generated/prisma/client"
import { createOrder } from "../../lib/commerce/create-order"
import { getAvailableQuantities } from "../../lib/commerce/availability"
import { confirmOrderPayment, rejectOrderPayment } from "../../lib/admin/payments"
import { AdminAuthRequiredError } from "../../lib/auth"
import {
  buildCheckoutInput,
  createAuthenticatedAdmin,
  createPublishedProductWithVariant,
  resetCommerceTables,
} from "../helpers/factories"
import { setMockAdminCookie, clearMockAdminCookie } from "../helpers/mock-admin-cookie"

beforeEach(async () => {
  await resetCommerceTables()
})

interface OrderFixture {
  orderId: string
  variantId: string
  initialStock: number
  quantity: number
}

/**
 * GERÇEK `createOrder()` ile gerçek bir Order + OrderItem + ACTIVE
 * InventoryReservation zinciri kurar — ödeme onayının test edeceği ön koşul
 * tam olarak budur; elle uydurulmuş bir rezervasyon satırı, rezervasyon
 * yazımındaki bir hatayı gizlerdi (`tests/admin/orders.test.ts`'teki aynı
 * gerekçe).
 */
async function setupOrder(options: { stock?: number; quantity?: number } = {}): Promise<OrderFixture> {
  const initialStock = options.stock ?? 5
  const quantity = options.quantity ?? 2
  const { variantId } = await createPublishedProductWithVariant({ stockQuantity: initialStock, price: 100 })
  const order = await createOrder(buildCheckoutInput({ items: [{ variantId, quantity }] }), testPrisma)
  return { orderId: order.orderId, variantId, initialStock, quantity }
}

async function readStock(variantId: string): Promise<number> {
  const variant = await testPrisma.variant.findUniqueOrThrow({ where: { id: variantId } })
  return variant.stockQuantity
}

async function readAvailable(variantId: string): Promise<number> {
  const map = await getAvailableQuantities(testPrisma, [variantId])
  return map.get(variantId)!
}

describe("Ödeme onayı/reddi — yetki sınırı (D033)", () => {
  it("oturumsuz confirmOrderPayment/rejectOrderPayment reddedilir", async () => {
    clearMockAdminCookie()
    const { orderId, variantId, initialStock } = await setupOrder()

    await expect(confirmOrderPayment({ orderId }, testPrisma)).rejects.toBeInstanceOf(AdminAuthRequiredError)
    await expect(rejectOrderPayment({ orderId }, testPrisma)).rejects.toBeInstanceOf(AdminAuthRequiredError)

    // Reddedilen çağrılar HİÇBİR yan etki bırakmamalı.
    expect(await readStock(variantId)).toBe(initialStock)
    const order = await testPrisma.order.findUniqueOrThrow({ where: { id: orderId } })
    expect(order.paymentStatus).toBe(PaymentStatus.PENDING)
    expect(order.orderStatus).toBe(OrderStatus.PAYMENT_PENDING)
  })

  it("geçersiz girdi INVALID_INPUT döner (throw etmez)", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)

    const result = await confirmOrderPayment({}, testPrisma)
    expect(result.success).toBe(false)
    if (result.success) throw new Error("beklenmedik başarı")
    expect(result.error.code).toBe("INVALID_INPUT")
  })

  it("var olmayan sipariş ORDER_NOT_FOUND döner", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)

    const result = await confirmOrderPayment({ orderId: "00000000-0000-4000-8000-000000000000" }, testPrisma)
    expect(result.success).toBe(false)
    if (result.success) throw new Error("beklenmedik başarı")
    expect(result.error.code).toBe("ORDER_NOT_FOUND")
  })
})

describe("confirmOrderPayment — rezervasyonu gerçek satışa çevirir (D033)", () => {
  it("PENDING → CONFIRMED, rezervasyon CONSUMED, fiziksel stok satılan adet kadar DÜŞER", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)
    const { orderId, variantId, initialStock, quantity } = await setupOrder({ stock: 5, quantity: 2 })

    const result = await confirmOrderPayment({ orderId }, testPrisma)

    expect(result.success).toBe(true)
    if (!result.success) throw new Error("beklenmedik hata")
    expect(result.alreadyApplied).toBe(false)
    expect(result.order.paymentStatus).toBe(PaymentStatus.CONFIRMED)

    const order = await testPrisma.order.findUniqueOrThrow({ where: { id: orderId } })
    expect(order.paymentStatus).toBe(PaymentStatus.CONFIRMED)

    const reservations = await testPrisma.inventoryReservation.findMany({ where: { orderId } })
    expect(reservations).toHaveLength(1)
    expect(reservations[0].status).toBe(ReservationStatus.CONSUMED)

    expect(await readStock(variantId)).toBe(initialStock - quantity)
  })

  it("KRİTİK DEĞİŞMEZ — onay availableQuantity'yi DEĞİŞTİRMEZ", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)
    const { orderId, variantId } = await setupOrder({ stock: 5, quantity: 2 })

    // Onay öncesi: stok 5, ACTIVE rezervasyon 2 → available 3.
    const availableBefore = await readAvailable(variantId)
    expect(availableBefore).toBe(3)

    const result = await confirmOrderPayment({ orderId }, testPrisma)
    expect(result.success).toBe(true)

    // Onay sonrası: stok 3, ACTIVE rezervasyon 0 → available yine 3.
    // Bu, D033'ün "ödeme onayı satılabilir stoğu ne artırır ne azaltır"
    // değişmezidir; iki adımın aynı transaction'da olmasının tek gözlemlenebilir
    // kanıtıdır.
    expect(await readAvailable(variantId)).toBe(availableBefore)
    expect(await readStock(variantId)).toBe(3)
  })

  it("çift onay (D017) — ikinci çağrı alreadyApplied döner ve stok İKİNCİ KEZ DÜŞMEZ", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)
    const { orderId, variantId, initialStock, quantity } = await setupOrder({ stock: 5, quantity: 2 })

    const first = await confirmOrderPayment({ orderId }, testPrisma)
    expect(first.success).toBe(true)
    if (!first.success) throw new Error("beklenmedik hata")
    expect(first.alreadyApplied).toBe(false)
    const stockAfterFirst = await readStock(variantId)
    expect(stockAfterFirst).toBe(initialStock - quantity)

    const second = await confirmOrderPayment({ orderId }, testPrisma)
    expect(second.success).toBe(true)
    if (!second.success) throw new Error("beklenmedik hata")
    expect(second.alreadyApplied).toBe(true)

    // ASIL İDDİA: stok ikinci onaydan ETKİLENMEDİ.
    expect(await readStock(variantId)).toBe(stockAfterFirst)
    expect(await readAvailable(variantId)).toBe(3)
  })

  it("onay orderStatus'ü OTOMATİK PREPARING YAPMAZ (D033 ek kuralı)", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)
    const { orderId } = await setupOrder()

    const result = await confirmOrderPayment({ orderId }, testPrisma)
    expect(result.success).toBe(true)
    if (!result.success) throw new Error("beklenmedik hata")

    expect(result.order.orderStatus).toBe(OrderStatus.PAYMENT_PENDING)
    const order = await testPrisma.order.findUniqueOrThrow({ where: { id: orderId } })
    expect(order.orderStatus).toBe(OrderStatus.PAYMENT_PENDING)
  })

  it("REDDEDİLMİŞ bir ödemeyi onaylamak INVALID_PAYMENT_STATE döner", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)
    const { orderId, variantId, initialStock } = await setupOrder()

    await rejectOrderPayment({ orderId }, testPrisma)
    const result = await confirmOrderPayment({ orderId }, testPrisma)

    expect(result.success).toBe(false)
    if (result.success) throw new Error("beklenmedik başarı")
    expect(result.error.code).toBe("INVALID_PAYMENT_STATE")
    // Reddedilen onay denemesi stoğa dokunmamış olmalı.
    expect(await readStock(variantId)).toBe(initialStock)
  })
})

describe("rejectOrderPayment — rezervasyonu serbest bırakır (D033)", () => {
  it("PENDING → FAILED, orderStatus CANCELLED, rezervasyon RELEASED, fiziksel stok DEĞİŞMEZ", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)
    const { orderId, variantId, initialStock } = await setupOrder({ stock: 5, quantity: 2 })

    const result = await rejectOrderPayment({ orderId }, testPrisma)

    expect(result.success).toBe(true)
    if (!result.success) throw new Error("beklenmedik hata")
    expect(result.alreadyApplied).toBe(false)

    const order = await testPrisma.order.findUniqueOrThrow({ where: { id: orderId } })
    expect(order.paymentStatus).toBe(PaymentStatus.FAILED)
    expect(order.orderStatus).toBe(OrderStatus.CANCELLED)

    const reservations = await testPrisma.inventoryReservation.findMany({ where: { orderId } })
    expect(reservations).toHaveLength(1)
    expect(reservations[0].status).toBe(ReservationStatus.RELEASED)
    expect(reservations[0].releasedAt).not.toBeNull()

    // Rezervasyon `stockQuantity`'yi hiç azaltmamıştı; burada stoğa bir şey
    // eklemek/çıkarmak ÇİFT SAYIM olurdu.
    expect(await readStock(variantId)).toBe(initialStock)
    // Serbest bırakılan adet yeniden satılabilir hâle gelir.
    expect(await readAvailable(variantId)).toBe(initialStock)
  })

  it("çift reddetme (D017) — ikinci çağrı güvenli no-op, releasedAt DEĞİŞMEZ", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)
    const { orderId, variantId, initialStock } = await setupOrder()

    const first = await rejectOrderPayment({ orderId }, testPrisma)
    expect(first.success).toBe(true)
    if (!first.success) throw new Error("beklenmedik hata")
    expect(first.alreadyApplied).toBe(false)

    const afterFirst = await testPrisma.inventoryReservation.findFirstOrThrow({ where: { orderId } })
    const releasedAtAfterFirst = afterFirst.releasedAt

    const second = await rejectOrderPayment({ orderId }, testPrisma)
    expect(second.success).toBe(true)
    if (!second.success) throw new Error("beklenmedik hata")
    expect(second.alreadyApplied).toBe(true)

    const afterSecond = await testPrisma.inventoryReservation.findFirstOrThrow({ where: { orderId } })
    expect(afterSecond.status).toBe(ReservationStatus.RELEASED)
    // ASIL İDDİA: ilk reddetmenin damgası korunuyor, üzerine yazılmıyor.
    expect(afterSecond.releasedAt?.toISOString()).toBe(releasedAtAfterFirst?.toISOString())
    expect(await readStock(variantId)).toBe(initialStock)
  })

  it("ONAYLANMIŞ bir ödemeyi reddetmek INVALID_PAYMENT_STATE döner", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)
    const { orderId, variantId, initialStock, quantity } = await setupOrder()

    await confirmOrderPayment({ orderId }, testPrisma)
    const result = await rejectOrderPayment({ orderId }, testPrisma)

    expect(result.success).toBe(false)
    if (result.success) throw new Error("beklenmedik başarı")
    expect(result.error.code).toBe("INVALID_PAYMENT_STATE")

    // Onaylanmış siparişin durumu ve stoğu değişmemiş olmalı.
    const order = await testPrisma.order.findUniqueOrThrow({ where: { id: orderId } })
    expect(order.paymentStatus).toBe(PaymentStatus.CONFIRMED)
    expect(order.orderStatus).toBe(OrderStatus.PAYMENT_PENDING)
    expect(await readStock(variantId)).toBe(initialStock - quantity)
  })
})

describe("Ödeme onayı — stok yarış koşulu (R1/D017)", () => {
  it("aynı sipariş EŞZAMANLI iki kez onaylanırsa stok YALNIZCA BİR KEZ düşer", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)
    const { orderId, variantId, initialStock, quantity } = await setupOrder({ stock: 5, quantity: 2 })

    // `create-order.concurrency.test.ts` ile aynı desen: gerçek bir
    // PostgreSQL'e karşı GERÇEKTEN eşzamanlı iki istek. `SELECT ... FOR UPDATE`
    // satır kilidi olmadan bu test mock bir DB'de "geçer" ama hiçbir şey
    // kanıtlamaz.
    const outcomes = await Promise.allSettled([
      confirmOrderPayment({ orderId }, testPrisma),
      confirmOrderPayment({ orderId }, testPrisma),
    ])

    // Her iki çağrı da HATA DÖNDÜRMEMELİ (çift tıklama bir hata değildir);
    // ama yalnızca biri gerçekten uygulamalı.
    const succeeded = outcomes.filter(
      (outcome) => outcome.status === "fulfilled" && outcome.value.success
    ) as Array<PromiseFulfilledResult<{ success: true; alreadyApplied: boolean }>>
    expect(succeeded).toHaveLength(2)
    expect(succeeded.filter((outcome) => !outcome.value.alreadyApplied)).toHaveLength(1)

    // ASIL KANIT: DB'deki stok tam olarak BİR KEZ düşmüş.
    expect(await readStock(variantId)).toBe(initialStock - quantity)
    expect(await readAvailable(variantId)).toBe(initialStock - quantity)

    const reservations = await testPrisma.inventoryReservation.findMany({ where: { orderId } })
    expect(reservations.every((reservation) => reservation.status === ReservationStatus.CONSUMED)).toBe(true)

    const order = await testPrisma.order.findUniqueOrThrow({ where: { id: orderId } })
    expect(order.paymentStatus).toBe(PaymentStatus.CONFIRMED)
  })

  it("aynı sipariş EŞZAMANLI onaylanıp reddedilirse yalnızca biri uygulanır, stok tutarlı kalır", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)
    const { orderId, variantId, initialStock, quantity } = await setupOrder({ stock: 5, quantity: 2 })

    await Promise.allSettled([
      confirmOrderPayment({ orderId }, testPrisma),
      rejectOrderPayment({ orderId }, testPrisma),
    ])

    const order = await testPrisma.order.findUniqueOrThrow({ where: { id: orderId } })
    const stock = await readStock(variantId)

    // İki meşru son durum var; hangisinin kazandığı zamanlamaya bağlıdır.
    // DEĞİŞMEZ olan şey, ödeme durumu ile stoğun BİRBİRİYLE TUTARLI olmasıdır.
    if (order.paymentStatus === PaymentStatus.CONFIRMED) {
      expect(stock).toBe(initialStock - quantity)
      expect(order.orderStatus).toBe(OrderStatus.PAYMENT_PENDING)
    } else {
      expect(order.paymentStatus).toBe(PaymentStatus.FAILED)
      expect(order.orderStatus).toBe(OrderStatus.CANCELLED)
      expect(stock).toBe(initialStock)
    }

    // Hiçbir senaryoda ACTIVE rezervasyon kalmamalı (ya CONSUMED ya RELEASED).
    const activeCount = await testPrisma.inventoryReservation.count({
      where: { orderId, status: ReservationStatus.ACTIVE },
    })
    expect(activeCount).toBe(0)
  })
})
