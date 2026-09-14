import { beforeEach, describe, expect, it } from "vitest"
import { testPrisma } from "../helpers/test-prisma"
import { createOrder } from "../../lib/commerce/create-order"
import { buildCheckoutInput, createPublishedProductWithVariant, resetCommerceTables } from "../helpers/factories"

/**
 * REGRESYON — Wave B'de commerce'in bulup düzelttiği dormant bir Video 06
 * bug'ının kalıcı testi.
 *
 * KÖK NEDEN: `@prisma/adapter-pg` + Prisma 7.10 ile P2002 hatasının
 * `error.meta.target` alanı ARTIK DOLMUYOR (kısıt adı bunun yerine
 * `error.meta.driverAdapterError.cause.constraint.index` altında geliyor,
 * bkz. `lib/commerce/errors.ts` → `isUniqueConstraintViolation`). Eski
 * `create-order.ts` dosyasının SONUNDA, `errors.ts`'ten hiç import edilmeyen
 * ayrı ve bayat bir `isUniqueConstraintViolation` kopyası vardı ve yalnızca
 * eski `meta.target` şeklini biliyordu — bu yüzden AYNI `orderIdempotencyKey`
 * ile GERÇEKTEN eşzamanlı iki `createOrder` çağrısında, P2002 çakışmasını
 * yakalayan `catch` bloğü çakışmayı hiç TANIMAZDI ve ham
 * `PrismaClientKnownRequestError`'ı olduğu gibi fırlatırdı — yani D017'nin
 * "asıl garanti" dediği DB-seviyesi idempotency BOZUKTU.
 *
 * NEDEN ÖNCEKİ TESTLER BUNU YAKALAMADI: `create-order.test.ts`'teki (B)/(C)
 * idempotency testleri SIRALI çalışır — ikisi de "önce findUnique" hızlı
 * yoluna denk gelir, P2002 catch bloğuna HİÇ girmez. `create-order.concurrency.test.ts`
 * ise FARKLI `orderIdempotencyKey`'lerle stok/oversell yarışını test eder,
 * AYNI idempotency key çakışmasını değil. Bu dosya, ikisinin de kapsamadığı
 * tam o boşluğu (gerçek eşzamanlı + AYNI key) hedefler.
 *
 * Bu test yalnızca GERÇEK bir PostgreSQL'e karşı anlamlıdır (Video 06
 * dersi) — bkz. `create-order.concurrency.test.ts` başlık yorumu.
 */
beforeEach(async () => {
  await resetCommerceTables()
})

describe("createOrder — eşzamanlılık (idempotency key çakışması regresyonu)", () => {
  it("aynı orderIdempotencyKey ile GERÇEKTEN eşzamanlı iki çağrı, ikisi de AYNI orderId'ye çözülür ve DB'de tek Order kalır", async () => {
    const { variantId } = await createPublishedProductWithVariant({ stockQuantity: 10, price: 100 })
    const sharedKey = "shared-concurrent-idempotency-key"

    const [resultA, resultB] = await Promise.all([
      createOrder(buildCheckoutInput({ orderIdempotencyKey: sharedKey, items: [{ variantId, quantity: 1 }] }), testPrisma),
      createOrder(buildCheckoutInput({ orderIdempotencyKey: sharedKey, items: [{ variantId, quantity: 1 }] }), testPrisma),
    ])

    // Asıl regresyon kanıtı: eski bug'da bu satıra hiç ulaşılamazdı, ikinci
    // çağrı ham PrismaClientKnownRequestError ile REJECT olurdu (Promise.all
    // de tüm işlemi reddederdi) — burada ikisinin de FULFILLED olması ve aynı
    // orderId'yi dönmesi gerekiyor.
    expect(resultA.orderId).toBe(resultB.orderId)
    expect(resultA.orderNumber).toBe(resultB.orderNumber)

    // DB-seviyesi doğrulama (Promise sonuçlarının kendisine değil, gerçek
    // veriye güven — Video 06 dersi): yalnızca 1 Order satırı oluşmuş olmalı.
    const orderCount = await testPrisma.order.count({ where: { orderIdempotencyKey: sharedKey } })
    expect(orderCount).toBe(1)

    // Stok da yalnızca BİR kez rezerve edilmiş olmalı (çift rezervasyon YOK).
    const totalReserved = await testPrisma.inventoryReservation.aggregate({
      where: { variantId },
      _sum: { quantity: true },
    })
    expect(totalReserved._sum.quantity).toBe(1)
  })
})
