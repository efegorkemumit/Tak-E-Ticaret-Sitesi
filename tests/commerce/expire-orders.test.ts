import "../helpers/mock-admin-cookie"
import { beforeEach, describe, expect, it } from "vitest"
import { testPrisma } from "../helpers/test-prisma"
import { OrderStatus, PaymentStatus, ReservationStatus } from "../../lib/generated/prisma/client"
import { createOrder } from "../../lib/commerce/create-order"
import { expireOverdueBankTransferOrders } from "../../lib/commerce/expire-orders"
import { getAvailableQuantities } from "../../lib/commerce/availability"
import { confirmOrderPayment } from "../../lib/admin/payments"
import { updateOrderStatus } from "../../lib/admin/orders"
import { RESERVATION_WINDOW_HOURS } from "../../lib/commerce/constants"
import {
  buildCheckoutInput,
  createAuthenticatedAdmin,
  createPublishedProductWithVariant,
  createSiteSettings,
  resetCommerceTables,
} from "../helpers/factories"
import { setMockAdminCookie, clearMockAdminCookie } from "../helpers/mock-admin-cookie"

beforeEach(async () => {
  await resetCommerceTables()
  clearMockAdminCookie()
})

const HOUR_MS = 60 * 60 * 1000

/**
 * Zaman, GERÇEKTEN beklenmez: `expireOverdueBankTransferOrders` `now`
 * parametresini dependency injection ile aldığı için testler "24 saat sonra"yı
 * saatin ilerlemesini beklemeden simüle eder.
 */
function hoursFromNow(hours: number): Date {
  return new Date(Date.now() + hours * HOUR_MS)
}

async function setupOrder(options: { stock?: number; quantity?: number } = {}) {
  const stock = options.stock ?? 5
  const quantity = options.quantity ?? 2
  const { variantId } = await createPublishedProductWithVariant({ stockQuantity: stock, price: 100 })
  const order = await createOrder(buildCheckoutInput({ items: [{ variantId, quantity }] }), testPrisma)
  return { orderId: order.orderId, variantId, stock, quantity }
}

async function readStock(variantId: string): Promise<number> {
  return (await testPrisma.variant.findUniqueOrThrow({ where: { id: variantId } })).stockQuantity
}

describe("expireOverdueBankTransferOrders — süresi dolan havale siparişleri (D018)", () => {
  it("süresi DOLMUŞ PENDING havale siparişi CANCELLED olur, rezervasyon RELEASED olur, fiziksel stok DÜŞMEZ", async () => {
    const { orderId, variantId, stock } = await setupOrder({ stock: 5, quantity: 2 })

    const result = await expireOverdueBankTransferOrders({
      now: hoursFromNow(RESERVATION_WINDOW_HOURS + 1),
      client: testPrisma,
    })

    expect(result.cancelledOrderIds).toEqual([orderId])
    expect(result.releasedReservationCount).toBe(1)

    const order = await testPrisma.order.findUniqueOrThrow({ where: { id: orderId } })
    expect(order.orderStatus).toBe(OrderStatus.CANCELLED)
    // `paymentStatus` BİLİNÇLİ OLARAK PENDING kalır: müşteri havaleyi hiç
    // yapmamıştır, REDDEDİLEN bir ödeme yoktur (FAILED admin'in açık reddi
    // içindir).
    expect(order.paymentStatus).toBe(PaymentStatus.PENDING)

    const reservations = await testPrisma.inventoryReservation.findMany({ where: { orderId } })
    expect(reservations).toHaveLength(1)
    expect(reservations[0].status).toBe(ReservationStatus.RELEASED)
    expect(reservations[0].releasedAt).not.toBeNull()

    // Rezervasyon `stockQuantity`'yi hiç azaltmamıştı — burada stoğa bir şey
    // eklemek/çıkarmak ÇİFT SAYIM olurdu.
    expect(await readStock(variantId)).toBe(stock)
    // Serbest bırakılan adet yeniden satılabilir.
    const available = await getAvailableQuantities(testPrisma, [variantId])
    expect(available.get(variantId)).toBe(stock)
  })

  it("süresi DOLMAMIŞ sipariş etkilenmez", async () => {
    const { orderId, variantId, stock, quantity } = await setupOrder()

    const result = await expireOverdueBankTransferOrders({
      now: hoursFromNow(RESERVATION_WINDOW_HOURS - 1),
      client: testPrisma,
    })

    expect(result.scannedOrderCount).toBe(0)
    expect(result.cancelledOrderIds).toEqual([])

    const order = await testPrisma.order.findUniqueOrThrow({ where: { id: orderId } })
    expect(order.orderStatus).toBe(OrderStatus.PAYMENT_PENDING)

    const reservation = await testPrisma.inventoryReservation.findFirstOrThrow({ where: { orderId } })
    expect(reservation.status).toBe(ReservationStatus.ACTIVE)

    const available = await getAvailableQuantities(testPrisma, [variantId])
    expect(available.get(variantId)).toBe(stock - quantity)
  })

  it("ödemesi CONFIRMED olan sipariş, süresi geçmiş olsa bile etkilenmez", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)
    const { orderId, variantId, stock, quantity } = await setupOrder({ stock: 5, quantity: 2 })

    const confirmed = await confirmOrderPayment({ orderId }, testPrisma)
    expect(confirmed.success).toBe(true)

    const result = await expireOverdueBankTransferOrders({
      now: hoursFromNow(RESERVATION_WINDOW_HOURS + 1),
      client: testPrisma,
    })

    expect(result.cancelledOrderIds).toEqual([])

    const order = await testPrisma.order.findUniqueOrThrow({ where: { id: orderId } })
    expect(order.paymentStatus).toBe(PaymentStatus.CONFIRMED)
    expect(order.orderStatus).toBe(OrderStatus.PAYMENT_PENDING)

    // Onaylanmış siparişin satılmış stoğu geri gelmemeli.
    expect(await readStock(variantId)).toBe(stock - quantity)
    const reservation = await testPrisma.inventoryReservation.findFirstOrThrow({ where: { orderId } })
    expect(reservation.status).toBe(ReservationStatus.CONSUMED)
  })

  it("zaten CANCELLED olan sipariş etkilenmez", async () => {
    const { orderId } = await setupOrder()
    const now = hoursFromNow(RESERVATION_WINDOW_HOURS + 1)

    await expireOverdueBankTransferOrders({ now, client: testPrisma })
    const releasedAtAfterFirst = (
      await testPrisma.inventoryReservation.findFirstOrThrow({ where: { orderId } })
    ).releasedAt

    // İkinci turda aynı sipariş artık aday BİLE olmamalı.
    const second = await expireOverdueBankTransferOrders({ now: hoursFromNow(48), client: testPrisma })
    expect(second.scannedOrderCount).toBe(0)

    const reservation = await testPrisma.inventoryReservation.findFirstOrThrow({ where: { orderId } })
    expect(reservation.releasedAt?.toISOString()).toBe(releasedAtAfterFirst?.toISOString())
  })

  it("IDEMPOTENT — ikinci çalıştırma boş sonuç döner ve hiçbir satırı değiştirmez", async () => {
    const { orderId, variantId, stock } = await setupOrder()
    const now = hoursFromNow(RESERVATION_WINDOW_HOURS + 1)

    const first = await expireOverdueBankTransferOrders({ now, client: testPrisma })
    expect(first.cancelledOrderIds).toEqual([orderId])

    const snapshotOrder = await testPrisma.order.findUniqueOrThrow({ where: { id: orderId } })
    const snapshotReservation = await testPrisma.inventoryReservation.findFirstOrThrow({ where: { orderId } })

    const second = await expireOverdueBankTransferOrders({ now, client: testPrisma })

    expect(second.cancelledOrderIds).toEqual([])
    expect(second.scannedOrderCount).toBe(0)
    expect(second.releasedReservationCount).toBe(0)

    const afterOrder = await testPrisma.order.findUniqueOrThrow({ where: { id: orderId } })
    const afterReservation = await testPrisma.inventoryReservation.findFirstOrThrow({ where: { orderId } })
    expect(afterOrder.updatedAt.toISOString()).toBe(snapshotOrder.updatedAt.toISOString())
    expect(afterReservation.releasedAt?.toISOString()).toBe(snapshotReservation.releasedAt?.toISOString())
    expect(await readStock(variantId)).toBe(stock)
  })

  it("aynı turda yalnızca süresi dolan sipariş iptal edilir, diğeri dokunulmadan kalır", async () => {
    const { variantId } = await createPublishedProductWithVariant({ stockQuantity: 10, price: 100 })

    // Süresi dolacak sipariş: varsayılan 24 saatlik pencere.
    const expiring = await createOrder(buildCheckoutInput({ items: [{ variantId, quantity: 1 }] }), testPrisma)

    // İkinci sipariş, ayar 720 saate çekildikten SONRA oluşturuluyor — aynı
    // `now` değerinde henüz süresi dolmamış olur.
    await createSiteSettings({ reservationWindowHours: 720 })
    const surviving = await createOrder(buildCheckoutInput({ items: [{ variantId, quantity: 1 }] }), testPrisma)

    const result = await expireOverdueBankTransferOrders({
      now: hoursFromNow(RESERVATION_WINDOW_HOURS + 1),
      client: testPrisma,
    })

    expect(result.cancelledOrderIds).toEqual([expiring.orderId])

    const survivingOrder = await testPrisma.order.findUniqueOrThrow({ where: { id: surviving.orderId } })
    expect(survivingOrder.orderStatus).toBe(OrderStatus.PAYMENT_PENDING)
    const survivingReservation = await testPrisma.inventoryReservation.findFirstOrThrow({
      where: { orderId: surviving.orderId },
    })
    expect(survivingReservation.status).toBe(ReservationStatus.ACTIVE)
  })
})

/**
 * REGRESYON KİLİDİ — tarayıcı testinde GERÇEK veride yakalanan bir hata.
 *
 * Job'ın eski hâli `[CANCELLED, RETURNED]` dışındaki HER sipariş durumunu
 * iptal edilebilir sayıyordu. Dev veritabanında `paymentStatus = PENDING`
 * kalmış ama admin'in çoktan ilerlettiği bir sipariş vardı — job onu sessizce
 * CANCELLED yapacaktı, yani fiilen hazırlanmış/kargolanmış/teslim edilmiş bir
 * sipariş otomatik iptal olacaktı.
 *
 * Yeni kural TEK bir beyaz listedir: yalnızca `orderStatus = PAYMENT_PENDING`
 * süresi dolmuş sayılır. Admin siparişi bunun ötesine taşıdıysa bilinçli bir
 * işletme kararı vermiştir ve otomatik bir zaman aşımı job'ı bunu geri alamaz.
 */
describe("expireOverdueBankTransferOrders — yalnızca PAYMENT_PENDING iptal edilir", () => {
  /** Siparişi GERÇEK admin akışıyla (`updateOrderStatus`) hedef duruma taşır — elle DB güncellemesi DEĞİL, çünkü asıl senaryo tam olarak "admin siparişi ilerletmişti"dir. */
  async function advanceOrderStatus(orderId: string, target: OrderStatus): Promise<void> {
    // `PAYMENT_PENDING → PREPARING → SHIPPED → DELIVERED` geçiş tablosunun
    // (`lib/admin/order-status.ts`) izin verdiği yol; SHIPPED kargo bilgisi ister.
    const path: Array<{ targetStatus: OrderStatus; shippingCarrier?: string; trackingNumber?: string }> = [
      { targetStatus: OrderStatus.PREPARING },
      { targetStatus: OrderStatus.SHIPPED, shippingCarrier: "Test Kargo", trackingNumber: "TK123456789" },
      { targetStatus: OrderStatus.DELIVERED },
    ]

    for (const step of path) {
      const result = await updateOrderStatus({ orderId, ...step }, testPrisma)
      if (!result.success) throw new Error(`durum ilerletilemedi: ${step.targetStatus} — ${result.error.code}`)
      if (step.targetStatus === target) return
    }
    throw new Error(`hedef durum bu yolda yok: ${target}`)
  }

  const advancedStatuses: OrderStatus[] = [OrderStatus.PREPARING, OrderStatus.SHIPPED, OrderStatus.DELIVERED]

  it.each(advancedStatuses)(
    "süresi dolmuş ama orderStatus %s olan sipariş ETKİLENMEZ (ne durumu ne rezervasyonu değişir)",
    async (status) => {
      const { token } = await createAuthenticatedAdmin()
      setMockAdminCookie(token)
      const { orderId, variantId, stock, quantity } = await setupOrder({ stock: 5, quantity: 2 })

      // Admin siparişi ilerletti; ödeme HÂLÂ PENDING (havale gelmemiş olsa bile
      // `updateOrderStatus` bilinçli olarak `paymentStatus`'a dokunmaz — D026).
      await advanceOrderStatus(orderId, status)
      const beforeOrder = await testPrisma.order.findUniqueOrThrow({ where: { id: orderId } })
      expect(beforeOrder.paymentStatus).toBe(PaymentStatus.PENDING)
      expect(beforeOrder.orderStatus).toBe(status)

      const result = await expireOverdueBankTransferOrders({
        now: hoursFromNow(RESERVATION_WINDOW_HOURS + 1),
        client: testPrisma,
      })

      // Aday BİLE olmamalı — eleme kilitsiz tarama filtresinde yapılır.
      expect(result.scannedOrderCount).toBe(0)
      expect(result.cancelledOrderIds).toEqual([])
      expect(result.releasedReservationCount).toBe(0)

      const afterOrder = await testPrisma.order.findUniqueOrThrow({ where: { id: orderId } })
      expect(afterOrder.orderStatus).toBe(status)
      expect(afterOrder.paymentStatus).toBe(PaymentStatus.PENDING)

      // Rezervasyon HÂLÂ ACTIVE: bu bilinçli takasın görünür sonucudur —
      // rezervasyon ancak admin ödemeyi onaylayınca/reddedince ya da siparişi
      // iptal edince serbest kalır.
      const reservation = await testPrisma.inventoryReservation.findFirstOrThrow({ where: { orderId } })
      expect(reservation.status).toBe(ReservationStatus.ACTIVE)
      expect(reservation.releasedAt).toBeNull()

      expect(await readStock(variantId)).toBe(stock)
      const available = await getAvailableQuantities(testPrisma, [variantId])
      expect(available.get(variantId)).toBe(stock - quantity)
    }
  )

  it("aynı turda PAYMENT_PENDING sipariş iptal edilirken PREPARING sipariş korunur", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)
    const { variantId } = await createPublishedProductWithVariant({ stockQuantity: 10, price: 100 })

    const expiring = await createOrder(buildCheckoutInput({ items: [{ variantId, quantity: 1 }] }), testPrisma)
    const advanced = await createOrder(buildCheckoutInput({ items: [{ variantId, quantity: 1 }] }), testPrisma)
    await advanceOrderStatus(advanced.orderId, OrderStatus.PREPARING)

    const result = await expireOverdueBankTransferOrders({
      now: hoursFromNow(RESERVATION_WINDOW_HOURS + 1),
      client: testPrisma,
    })

    expect(result.cancelledOrderIds).toEqual([expiring.orderId])

    const advancedOrder = await testPrisma.order.findUniqueOrThrow({ where: { id: advanced.orderId } })
    expect(advancedOrder.orderStatus).toBe(OrderStatus.PREPARING)
    const advancedReservation = await testPrisma.inventoryReservation.findFirstOrThrow({
      where: { orderId: advanced.orderId },
    })
    expect(advancedReservation.status).toBe(ReservationStatus.ACTIVE)
  })

  it("RETURNED sipariş de etkilenmez (beyaz listede yok)", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)
    const { orderId } = await setupOrder()

    await advanceOrderStatus(orderId, OrderStatus.DELIVERED)
    const returned = await updateOrderStatus({ orderId, targetStatus: OrderStatus.RETURNED }, testPrisma)
    expect(returned.success).toBe(true)

    const result = await expireOverdueBankTransferOrders({
      now: hoursFromNow(RESERVATION_WINDOW_HOURS + 1),
      client: testPrisma,
    })

    expect(result.cancelledOrderIds).toEqual([])
    const order = await testPrisma.order.findUniqueOrThrow({ where: { id: orderId } })
    expect(order.orderStatus).toBe(OrderStatus.RETURNED)
  })
})

describe("createOrder — rezervasyon penceresi SiteSettings'ten okunur (D018/D032)", () => {
  it("ayar YOKKEN varsayılan 24 saatlik pencere kullanılır", async () => {
    expect(await testPrisma.siteSettings.count()).toBe(0)
    const before = Date.now()

    const { variantId } = await createPublishedProductWithVariant({ stockQuantity: 5, price: 100 })
    const order = await createOrder(buildCheckoutInput({ items: [{ variantId, quantity: 1 }] }), testPrisma)

    const reservation = await testPrisma.inventoryReservation.findFirstOrThrow({ where: { orderId: order.orderId } })
    const expectedAt = before + RESERVATION_WINDOW_HOURS * HOUR_MS
    // Tolerans: DB yazımı ile `before` arasındaki gerçek gecikme (birkaç yüz ms).
    expect(Math.abs(reservation.expiresAt.getTime() - expectedAt)).toBeLessThan(60_000)
  })

  it("ayar 1 saate çekilirse rezervasyon ~1 saat sonra dolar", async () => {
    await createSiteSettings({ reservationWindowHours: 1 })
    const before = Date.now()

    const { variantId } = await createPublishedProductWithVariant({ stockQuantity: 5, price: 100 })
    const order = await createOrder(buildCheckoutInput({ items: [{ variantId, quantity: 1 }] }), testPrisma)

    const reservation = await testPrisma.inventoryReservation.findFirstOrThrow({ where: { orderId: order.orderId } })
    expect(Math.abs(reservation.expiresAt.getTime() - (before + HOUR_MS))).toBeLessThan(60_000)

    // Ve gerçekten 1 saat sonra süresi dolmuş sayılır (24 saati beklemeden).
    const result = await expireOverdueBankTransferOrders({ now: hoursFromNow(1.5), client: testPrisma })
    expect(result.cancelledOrderIds).toEqual([order.orderId])
  })
})
