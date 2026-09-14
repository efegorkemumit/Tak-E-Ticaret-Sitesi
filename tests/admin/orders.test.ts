import "../helpers/mock-admin-cookie"
import { beforeEach, describe, expect, it } from "vitest"
import { testPrisma } from "../helpers/test-prisma"
import { ReservationStatus, OrderStatus } from "../../lib/generated/prisma/client"
import { createOrder } from "../../lib/commerce/create-order"
import { getAvailableQuantities } from "../../lib/commerce"
import { listOrdersForAdmin, getOrderDetailById, getOrderDetailByOrderNumber, updateOrderStatus } from "../../lib/admin/orders"
import { AdminAuthRequiredError } from "../../lib/auth"
import { buildCheckoutInput, createAuthenticatedAdmin, createPublishedProductWithVariant, resetCommerceTables } from "../helpers/factories"
import { setMockAdminCookie, clearMockAdminCookie } from "../helpers/mock-admin-cookie"

beforeEach(async () => {
  await resetCommerceTables()
})

/** GERÇEK `createOrder()` (commerce) ile, gerçek bir Order+OrderItem+InventoryReservation zinciri kurar — bypass fixture DEĞİL, X)'in tam gerçekçi olması için. */
async function setupRealOrder(stockQuantity = 5): Promise<{ orderId: string; variantId: string; stockQuantity: number }> {
  const { variantId } = await createPublishedProductWithVariant({ stockQuantity, price: 100 })
  const order = await createOrder(buildCheckoutInput({ items: [{ variantId, quantity: 2 }] }), testPrisma)
  return { orderId: order.orderId, variantId, stockQuantity }
}

describe("Admin sipariş yönetimi (V/W/X/Y/Z — D026)", () => {
  it("oturumsuz çağrı reddedilir", async () => {
    clearMockAdminCookie()
    await expect(listOrdersForAdmin({}, testPrisma)).rejects.toBeInstanceOf(AdminAuthRequiredError)
    await expect(updateOrderStatus({ orderId: "x", targetStatus: "PREPARING" }, testPrisma)).rejects.toBeInstanceOf(
      AdminAuthRequiredError
    )
  })

  it("(V) listOrdersForAdmin ve getOrderDetailById/ByOrderNumber PII dahil doğru veriyi döner", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)
    const { orderId } = await setupRealOrder()

    const list = await listOrdersForAdmin({}, testPrisma)
    expect(list.map((o) => o.id)).toContain(orderId)

    const byId = await getOrderDetailById(orderId, testPrisma)
    expect(byId?.contact.email).toBe("test@example.com")
    expect(byId?.items).toHaveLength(1)

    const byNumber = await getOrderDetailByOrderNumber(byId!.orderNumber, testPrisma)
    expect(byNumber?.id).toBe(orderId)
  })

  it("(V) listOrdersForAdmin orderStatus/paymentMethod filtresini uygular", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)
    await setupRealOrder()

    const filteredMatch = await listOrdersForAdmin({ orderStatus: OrderStatus.PAYMENT_PENDING }, testPrisma)
    expect(filteredMatch.length).toBeGreaterThan(0)

    const filteredNoMatch = await listOrdersForAdmin({ orderStatus: OrderStatus.DELIVERED }, testPrisma)
    expect(filteredNoMatch).toHaveLength(0)
  })

  it("(W) PAYMENT_PENDING → PREPARING geçişi ORDER_STATUS_TRANSITIONS tablosuna uyar, DB'de yazılır", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)
    const { orderId } = await setupRealOrder()

    const result = await updateOrderStatus({ orderId, targetStatus: OrderStatus.PREPARING }, testPrisma)

    expect(result.success).toBe(true)
    if (!result.success) throw new Error("beklenmedik hata")
    expect(result.order.orderStatus).toBe(OrderStatus.PREPARING)

    const row = await testPrisma.order.findUniqueOrThrow({ where: { id: orderId } })
    expect(row.orderStatus).toBe(OrderStatus.PREPARING)
  })

  it("(W) geçersiz bir geçiş (PAYMENT_PENDING → DELIVERED, tabloda YOK) sunucuda REDDEDİLİR", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)
    const { orderId } = await setupRealOrder()

    const result = await updateOrderStatus({ orderId, targetStatus: OrderStatus.DELIVERED }, testPrisma)

    expect(result.success).toBe(false)
    if (result.success) throw new Error("beklenmedik başarı")
    expect(result.error.code).toBe("INVALID_TRANSITION")

    // DB'de durum DEĞİŞMEMİŞ olmalı.
    const row = await testPrisma.order.findUniqueOrThrow({ where: { id: orderId } })
    expect(row.orderStatus).toBe(OrderStatus.PAYMENT_PENDING)
  })

  it("(Y) SHIPPED geçişinde shippingCarrier/trackingNumber/shippedAt yazılır", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)
    const { orderId } = await setupRealOrder()
    await updateOrderStatus({ orderId, targetStatus: OrderStatus.PREPARING }, testPrisma)

    const result = await updateOrderStatus(
      { orderId, targetStatus: OrderStatus.SHIPPED, shippingCarrier: "Yurtiçi Kargo", trackingNumber: "YK123456789" },
      testPrisma
    )

    expect(result.success).toBe(true)
    if (!result.success) throw new Error("beklenmedik hata")
    expect(result.order.shippingCarrier).toBe("Yurtiçi Kargo")
    expect(result.order.trackingNumber).toBe("YK123456789")
    expect(result.order.shippedAt).not.toBeNull()

    const row = await testPrisma.order.findUniqueOrThrow({ where: { id: orderId } })
    expect(row.shippingCarrier).toBe("Yurtiçi Kargo")
    expect(row.trackingNumber).toBe("YK123456789")
    expect(row.shippedAt).not.toBeNull()
  })

  it("(W, C-2 netleştirmesi) DELIVERED → RETURNED geçişine izin var, RETURNED nihai durumdur ve rezervasyonu SERBEST BIRAKMAZ (D018 release tetikleyicileri yalnızca süre dolması/iptal — iade kuralları OPEN #13)", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)
    const { orderId, variantId, stockQuantity } = await setupRealOrder(5)
    await updateOrderStatus({ orderId, targetStatus: OrderStatus.PREPARING }, testPrisma)
    await updateOrderStatus({ orderId, targetStatus: OrderStatus.SHIPPED }, testPrisma)
    await updateOrderStatus({ orderId, targetStatus: OrderStatus.DELIVERED }, testPrisma)

    const result = await updateOrderStatus({ orderId, targetStatus: OrderStatus.RETURNED }, testPrisma)
    expect(result.success).toBe(true)
    if (!result.success) throw new Error("beklenmedik hata")
    expect(result.order.orderStatus).toBe(OrderStatus.RETURNED)

    // RETURNED'ten başka HİÇBİR hedefe geçiş yok (nihai durum).
    const furtherAttempt = await updateOrderStatus({ orderId, targetStatus: OrderStatus.CANCELLED }, testPrisma)
    expect(furtherAttempt.success).toBe(false)

    // BİLİNÇLİ davranış (bug DEĞİL): rezervasyon hâlâ ACTIVE, released DEĞİL —
    // stok "geri gelmedi". `getAvailableQuantities`'in TEK formülü üzerinden doğrula.
    const reservation = await testPrisma.inventoryReservation.findFirstOrThrow({ where: { orderId } })
    expect(reservation.status).toBe(ReservationStatus.ACTIVE)
    expect(reservation.releasedAt).toBeNull()
    const availability = await getAvailableQuantities(testPrisma, [variantId])
    expect(availability.get(variantId)).toBe(stockQuantity - 2)
  })

  describe("(X) CANCELLED → rezervasyon RELEASE (D018)", () => {
    it("CANCELLED'e geçiş, orderStatus'u değiştirmenin ÖTESİNDE InventoryReservation'ı RELEASED yapar, releasedAt yazar ve available stok ARTAR", async () => {
      const { token } = await createAuthenticatedAdmin()
      setMockAdminCookie(token)
      const { orderId, variantId, stockQuantity } = await setupRealOrder(5)

      // İptalden ÖNCE: 2 adet rezerve edilmiş, kullanılabilir stok 3.
      const beforeCancel = await getAvailableQuantities(testPrisma, [variantId])
      expect(beforeCancel.get(variantId)).toBe(stockQuantity - 2)

      const result = await updateOrderStatus({ orderId, targetStatus: OrderStatus.CANCELLED }, testPrisma)
      expect(result.success).toBe(true)

      // 1) orderStatus değişti.
      const orderRow = await testPrisma.order.findUniqueOrThrow({ where: { id: orderId } })
      expect(orderRow.orderStatus).toBe(OrderStatus.CANCELLED)

      // 2) InventoryReservation GERÇEKTEN RELEASED, releasedAt yazılmış.
      const reservation = await testPrisma.inventoryReservation.findFirstOrThrow({ where: { orderId } })
      expect(reservation.status).toBe(ReservationStatus.RELEASED)
      expect(reservation.releasedAt).not.toBeNull()

      // 3) TEK paylaşılan D018 formülü (getAvailableQuantities, YENİDEN
      // YAZILMADI) üzerinden kullanılabilir stoğun GERÇEKTEN arttığını doğrula.
      const afterCancel = await getAvailableQuantities(testPrisma, [variantId])
      expect(afterCancel.get(variantId)).toBe(stockQuantity)
    })

    it("AYNI siparişi İKİNCİ kez iptal etmeye çalışmak yeni bir release YAPMAZ, releasedAt DEĞİŞMEZ (idempotent, FOR UPDATE + koşullu updateMany)", async () => {
      const { token } = await createAuthenticatedAdmin()
      setMockAdminCookie(token)
      const { orderId } = await setupRealOrder(5)

      await updateOrderStatus({ orderId, targetStatus: OrderStatus.CANCELLED }, testPrisma)
      const reservationAfterFirst = await testPrisma.inventoryReservation.findFirstOrThrow({ where: { orderId } })
      const releasedAtFirst = reservationAfterFirst.releasedAt

      // CANCELLED'ten CANCELLED'e ikinci bir geçiş denemesi — geçiş tablosunda
      // CANCELLED'in hiçbir hedefi yok (`ORDER_STATUS_TRANSITIONS[CANCELLED] = []`),
      // bu yüzden sunucu bunu zaten INVALID_TRANSITION ile reddetmeli — asıl
      // kanıt budur: `updateMany`'nin `WHERE status = 'ACTIVE'` koşulu sayesinde,
      // bu reddediş OLMASA bile release yan etkisi tekrarlanamazdı.
      const secondAttempt = await updateOrderStatus({ orderId, targetStatus: OrderStatus.CANCELLED }, testPrisma)
      expect(secondAttempt.success).toBe(false)

      const reservationAfterSecond = await testPrisma.inventoryReservation.findFirstOrThrow({ where: { orderId } })
      expect(reservationAfterSecond.releasedAt?.getTime()).toBe(releasedAtFirst?.getTime())
      expect(reservationAfterSecond.status).toBe(ReservationStatus.RELEASED)
    })

    it("EŞZAMANLI iki iptal isteği de yalnızca BİR release'e yol açar (FOR UPDATE satır kilidi)", async () => {
      const { token } = await createAuthenticatedAdmin()
      setMockAdminCookie(token)
      const { orderId, variantId, stockQuantity } = await setupRealOrder(5)

      const [resultA, resultB] = await Promise.all([
        updateOrderStatus({ orderId, targetStatus: OrderStatus.CANCELLED }, testPrisma),
        updateOrderStatus({ orderId, targetStatus: OrderStatus.CANCELLED }, testPrisma),
      ])

      const outcomes = [resultA, resultB]
      const succeeded = outcomes.filter((r) => r.success)
      // FOR UPDATE kilidi ikinci isteği ilkinin commit'ini bekletir; ikinci
      // istek GÜNCEL (artık CANCELLED) durumu görüp INVALID_TRANSITION ile
      // reddedilir — tam olarak biri başarılı olmalı.
      expect(succeeded).toHaveLength(1)

      const reservation = await testPrisma.inventoryReservation.findFirstOrThrow({ where: { orderId } })
      expect(reservation.status).toBe(ReservationStatus.RELEASED)

      const availability = await getAvailableQuantities(testPrisma, [variantId])
      expect(availability.get(variantId)).toBe(stockQuantity)
    })
  })

  describe("(Z) paymentStatus admin tarafından değiştirilemiyor (D026 sert sınır)", () => {
    it("updateOrderStatus'a paymentStatus İÇEREN bir payload geçirilse bile DB'deki paymentStatus DEĞİŞMEZ", async () => {
      const { token } = await createAuthenticatedAdmin()
      setMockAdminCookie(token)
      const { orderId } = await setupRealOrder()

      const before = await testPrisma.order.findUniqueOrThrow({ where: { id: orderId } })
      expect(before.paymentStatus).toBe("PENDING")

      // `updateOrderStatusSchema`'da `paymentStatus` alanı YOK — client'ın
      // fazladan gönderdiği bir alan olarak simüle etmek için `rawInput`'u
      // bilinçli olarak `unknown` bir obje gibi (TypeScript'in engelleyeceği
      // türden bir payload) geçiyoruz; Zod STRIP davranışının (passthrough
      // KULLANILMADI) çalışma zamanında da koruduğunu kanıtlamak içindir.
      const maliciousPayload: unknown = {
        orderId,
        targetStatus: "PREPARING",
        paymentStatus: "CONFIRMED",
      }
      const result = await updateOrderStatus(maliciousPayload, testPrisma)
      expect(result.success).toBe(true)

      const after = await testPrisma.order.findUniqueOrThrow({ where: { id: orderId } })
      expect(after.paymentStatus).toBe("PENDING")
      expect(after.orderStatus).toBe(OrderStatus.PREPARING)
    })

    it("(Z, kod-seviyesi kanıt) UpdateOrderStatusInput tipinde paymentStatus alanı YOKTUR", async () => {
      const schemasModule = await import("../../lib/admin/schemas")
      const parsed = schemasModule.updateOrderStatusSchema.parse({ orderId: "x", targetStatus: "PREPARING" })
      expect(parsed).not.toHaveProperty("paymentStatus")
      // Şemanın shape'i genişletilebilir/passthrough DEĞİL — fazladan alan
      // gönderilse bile `.parse()` çıktısında hiçbir zaman görünmeyecek.
      const parsedWithExtra = schemasModule.updateOrderStatusSchema.parse({
        orderId: "x",
        targetStatus: "PREPARING",
        paymentStatus: "CONFIRMED",
      } as unknown as { orderId: string; targetStatus: string })
      expect(parsedWithExtra).not.toHaveProperty("paymentStatus")
    })
  })
})
