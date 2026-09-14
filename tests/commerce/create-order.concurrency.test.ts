import { randomUUID } from "node:crypto"
import { beforeEach, describe, expect, it } from "vitest"
import { testPrisma } from "../helpers/test-prisma"
import { ReservationStatus } from "../../lib/generated/prisma/client"
import { createOrder } from "../../lib/commerce/create-order"
import { InsufficientStockError } from "../../lib/commerce/errors"
import { buildCheckoutInput, createPublishedProductWithVariant, resetCommerceTables } from "../helpers/factories"

/**
 * (M) — Risk R1'in doğrudan testi: aynı varyantın SON adedine eşzamanlı iki
 * sipariş geldiğinde oversell (fazla satış) OLMAMALI.
 *
 * Bu test yalnızca GERÇEK bir PostgreSQL'e karşı anlamlıdır — `SELECT ... FOR
 * UPDATE` satır kilidinin gerçekten iki eşzamanlı transaction'ı serileştirdiğini
 * doğrular. Bir mock/sahte DB ile bu test "geçti" gösterilse bile hiçbir şey
 * kanıtlamaz (mock'ta zaten paralel bağlantı/kilit kavramı yoktur) — bu
 * yüzden bu dosya `tests/setup.ts`'in zorladığı gerçek, izole `TEST_DATABASE_URL`'e
 * bağımlıdır.
 */
beforeEach(async () => {
  await resetCommerceTables()
})

describe("createOrder — eşzamanlılık (oversell koruması)", () => {
  it("(M) aynı varyantın son 1 adedine eşzamanlı 2 sipariş gelirse yalnızca biri başarılı olur", async () => {
    const { variantId } = await createPublishedProductWithVariant({ stockQuantity: 1, price: 100 })

    const [resultA, resultB] = await Promise.allSettled([
      createOrder(
        buildCheckoutInput({ orderIdempotencyKey: randomUUID(), items: [{ variantId, quantity: 1 }] }),
        testPrisma
      ),
      createOrder(
        buildCheckoutInput({ orderIdempotencyKey: randomUUID(), items: [{ variantId, quantity: 1 }] }),
        testPrisma
      ),
    ])

    const outcomes = [resultA, resultB]
    const fulfilled = outcomes.filter((o) => o.status === "fulfilled")
    const rejected = outcomes.filter((o) => o.status === "rejected")

    // Tam olarak biri başarılı, biri de InsufficientStockError ile reddedilmeli.
    expect(fulfilled).toHaveLength(1)
    expect(rejected).toHaveLength(1)
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(InsufficientStockError)

    // Veritabanı düzeyinde de doğrula: yalnızca 1 sipariş, yalnızca 1 aktif
    // rezervasyon (toplam miktar 1) oluşmuş olmalı — asıl "oversell olmadı"
    // kanıtı budur, Promise sonuçlarının kendisi değil.
    const orderCount = await testPrisma.order.count()
    expect(orderCount).toBe(1)

    const activeReservations = await testPrisma.inventoryReservation.findMany({
      where: { variantId, status: ReservationStatus.ACTIVE },
    })
    const totalReserved = activeReservations.reduce((sum, r) => sum + r.quantity, 0)
    expect(totalReserved).toBe(1)
  })

  it("(M ek) aynı varyantın 3 adedine eşzamanlı 5 sipariş (1'er adet) gelirse yalnızca 3'ü başarılı olur", async () => {
    const { variantId } = await createPublishedProductWithVariant({ stockQuantity: 3, price: 100 })

    const attempts = Array.from({ length: 5 }, () =>
      createOrder(
        buildCheckoutInput({ orderIdempotencyKey: randomUUID(), items: [{ variantId, quantity: 1 }] }),
        testPrisma
      )
    )
    const outcomes = await Promise.allSettled(attempts)

    const fulfilled = outcomes.filter((o) => o.status === "fulfilled")
    const rejected = outcomes.filter((o) => o.status === "rejected")

    expect(fulfilled).toHaveLength(3)
    expect(rejected).toHaveLength(2)
    for (const failure of rejected as PromiseRejectedResult[]) {
      expect(failure.reason).toBeInstanceOf(InsufficientStockError)
    }

    const totalReserved = await testPrisma.inventoryReservation.aggregate({
      where: { variantId, status: ReservationStatus.ACTIVE },
      _sum: { quantity: true },
    })
    expect(totalReserved._sum.quantity).toBe(3)
  })
})
