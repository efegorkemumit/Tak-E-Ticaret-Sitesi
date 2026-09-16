import { beforeEach, describe, expect, it } from "vitest"
import { testPrisma } from "../helpers/test-prisma"
import { createOrder } from "../../lib/commerce/create-order"
import { lookupOrder, RATE_LIMITED_MESSAGE } from "../../lib/commerce/order-lookup"
import type { PrismaClient } from "../../lib/generated/prisma/client"
import { renderTransferDescription } from "../../lib/settings/transfer-description"
import { ORDER_NUMBER_PLACEHOLDER } from "../../lib/settings/constants"
import {
  VALID_TEST_IBAN,
  buildCheckoutInput,
  createPublishedProductWithVariant,
  createSiteSettings,
  resetCommerceTables,
} from "../helpers/factories"

beforeEach(async () => {
  await resetCommerceTables()
})

/** GERÇEK `createOrder()` ile bilinen bir e-postaya sahip bir havale siparişi kurar. */
async function setupOrder(email = "musteri@example.com"): Promise<{ orderNumber: string; total: string }> {
  const { variantId } = await createPublishedProductWithVariant({ stockQuantity: 5, price: 250 })
  const order = await createOrder(
    buildCheckoutInput({
      items: [{ variantId, quantity: 2 }],
      contact: { fullName: "Test Müşteri", phone: "+905550000000", email },
    }),
    testPrisma
  )
  return { orderNumber: order.orderNumber, total: order.total }
}

describe("lookupOrder — doğrulama (D015 + D031)", () => {
  it("doğru sipariş numarası + doğru e-posta ile sipariş döner", async () => {
    const { orderNumber, total } = await setupOrder()

    const result = await lookupOrder({ orderNumber, email: "musteri@example.com" }, testPrisma)

    expect(result.success).toBe(true)
    if (!result.success) throw new Error("beklenmedik hata")
    expect(result.order.orderNumber).toBe(orderNumber)
    expect(result.order.total).toBe(total)
    expect(result.order.paymentStatus).toBe("PENDING")
    expect(result.order.orderStatus).toBe("PAYMENT_PENDING")
  })

  it("e-posta BÜYÜK/küçük harf farkıyla da eşleşir", async () => {
    const { orderNumber } = await setupOrder("Musteri@Example.COM")

    const result = await lookupOrder({ orderNumber, email: "musteri@example.com" }, testPrisma)

    expect(result.success).toBe(true)
  })

  it("sipariş numarası küçük harfle yazılsa da eşleşir (numara her zaman BÜYÜK üretilir)", async () => {
    const { orderNumber } = await setupOrder()

    const result = await lookupOrder({ orderNumber: orderNumber.toLowerCase(), email: "musteri@example.com" }, testPrisma)

    expect(result.success).toBe(true)
  })

  it("geçersiz girdi (e-posta biçimi bozuk) INVALID_INPUT döner", async () => {
    const { orderNumber } = await setupOrder()

    const result = await lookupOrder({ orderNumber, email: "e-posta-degil" }, testPrisma)

    expect(result.success).toBe(false)
    if (result.success) throw new Error("beklenmedik başarı")
    expect(result.error.code).toBe("INVALID_INPUT")
  })
})

describe("lookupOrder — hesap/sipariş sayımı (enumeration) koruması", () => {
  it("YANLIŞ e-posta ile VAR OLMAYAN sipariş numarası BİREBİR AYNI hatayı döndürür", async () => {
    const { orderNumber } = await setupOrder("musteri@example.com")

    // (1) Sipariş GERÇEKTEN var, ama e-posta yanlış.
    const wrongEmail = await lookupOrder({ orderNumber, email: "baskasi@example.com" }, testPrisma)
    // (2) Sipariş numarası hiç YOK.
    const missingOrder = await lookupOrder(
      { orderNumber: "ORD-20990101-ZZZZZZ", email: "musteri@example.com" },
      testPrisma
    )

    expect(wrongEmail.success).toBe(false)
    expect(missingOrder.success).toBe(false)
    if (wrongEmail.success || missingOrder.success) throw new Error("beklenmedik başarı")

    // ASIL İDDİA: hangi alanın yanlış olduğu (hatta siparişin var olup
    // olmadığı) mesajdan ANLAŞILAMAMALI — iki yanıt birebir aynı olmalı.
    expect(wrongEmail.error.code).toBe("NOT_FOUND")
    expect(missingOrder.error.code).toBe("NOT_FOUND")
    expect(wrongEmail.error.message).toBe(missingOrder.error.message)
  })
})

describe("lookupOrder — çekirdek hız sınırı yan kanal ÜRETMEZ", () => {
  /**
   * Çekirdeğin hız sınırı anahtarı SİPARİŞ NUMARASIDIR ve limite takıldığında
   * bilinçli olarak jenerik `NOT_FOUND` döner — "bu numara için çok denediniz"
   * demek, saldırgana o numaranın DENENMEYE DEĞER (yani var) olduğunu söyleyen
   * bir yan kanaldır.
   *
   * `RATE_LIMITED` kodu, yalnızca IP bazlı sınırı uygulayan Server Action
   * katmanına aittir (`app/(storefront)/siparis-sorgula/actions.ts`); o katman
   * `next/headers` gerektirdiği için buradan çağrılamaz. Bu testin işi, o
   * kodun ÇEKİRDEĞE SIZMADIĞINI kilitlemektir — `OrderLookupErrorCode`
   * birliğine `RATE_LIMITED` eklendiği için bu ayrımın kazara bozulması artık
   * tip hatası vermez, yalnızca test yakalar.
   */
  it("limite takılan sorgu, DOĞRU e-posta ile bile jenerik NOT_FOUND döner (RATE_LIMITED SIZMAZ)", async () => {
    const { orderNumber } = await setupOrder("musteri@example.com")

    // `lib/auth/rate-limit.ts` penceresi 10 başarısız denemedir; 11. istek
    // artık limitlidir.
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const failed = await lookupOrder({ orderNumber, email: "saldirgan@example.com" }, testPrisma)
      expect(failed.success).toBe(false)
    }

    // Artık DOĞRU bilgiyle bile sorgu geçmez — ve dönen sonuç, var olmayan bir
    // siparişin sonucundan AYIRT EDİLEMEZ olmalıdır.
    const limited = await lookupOrder({ orderNumber, email: "musteri@example.com" }, testPrisma)
    const missingOrder = await lookupOrder(
      { orderNumber: "ORD-20990101-YYYYYY", email: "musteri@example.com" },
      testPrisma
    )

    expect(limited.success).toBe(false)
    if (limited.success || missingOrder.success) throw new Error("beklenmedik başarı")
    expect(limited.error.code).toBe("NOT_FOUND")
    expect(limited.error.code).not.toBe("RATE_LIMITED")
    expect(limited.error.message).toBe(missingOrder.error.message)
    // IP katmanının dürüst mesajı çekirdekten ASLA çıkmamalı.
    expect(limited.error.message).not.toBe(RATE_LIMITED_MESSAGE)
  })

  it("başarılı sorgulama sayacı sıfırlar — meşru müşteri birkaç yanlış denemeden sonra cezalandırılmaz", async () => {
    const { orderNumber } = await setupOrder("musteri@example.com")

    for (let attempt = 0; attempt < 9; attempt += 1) {
      await lookupOrder({ orderNumber, email: "yanlis@example.com" }, testPrisma)
    }

    // 10. istek DOĞRU bilgiyle: hem başarılı olmalı hem sayacı sıfırlamalı.
    const success = await lookupOrder({ orderNumber, email: "musteri@example.com" }, testPrisma)
    expect(success.success).toBe(true)

    // Sayaç sıfırlandığı için sonraki yanlış denemeler yeniden baştan sayılır
    // ve doğru bilgi hâlâ çalışır.
    await lookupOrder({ orderNumber, email: "yanlis@example.com" }, testPrisma)
    const stillWorks = await lookupOrder({ orderNumber, email: "musteri@example.com" }, testPrisma)
    expect(stillWorks.success).toBe(true)
  })
})

describe("lookupOrder — ham DB hatası sızmaz (UNKNOWN_ERROR)", () => {
  /**
   * Bu iki test, gerçek DB'nin ÜRETEMEYECEĞİ (bağlantı kopması gibi) bir
   * durumu simüle ettiği için bilinçli olarak sahte bir client kullanır —
   * paketin geri kalanı gerçek PostgreSQL'e karşı çalışmaya devam eder.
   * Amaç davranışı değil, HATA EŞLEMESİNİ doğrulamaktır: `lookupOrder`
   * hiçbir koşulda `throw` etmemeli ve ham hata metnini dışarı vermemelidir.
   */
  const RAW_ERROR_TEXT = "connect ECONNREFUSED 127.0.0.1:5432 — ham sürücü hatası"

  it("order.findUnique fırlatırsa UNKNOWN_ERROR döner, throw ETMEZ", async () => {
    const failingClient = {
      order: {
        findUnique: async () => {
          throw new Error(RAW_ERROR_TEXT)
        },
      },
    } as unknown as PrismaClient

    const result = await lookupOrder({ orderNumber: "ORD-20260916-ABC123", email: "musteri@example.com" }, failingClient)

    expect(result.success).toBe(false)
    if (result.success) throw new Error("beklenmedik başarı")
    expect(result.error.code).toBe("UNKNOWN_ERROR")
    expect(result.error.message).not.toContain("ECONNREFUSED")
    expect(result.error.message).not.toContain("5432")
  })

  it("SiteSettings okuması fırlatırsa da UNKNOWN_ERROR döner (ikinci sorgu yolu)", async () => {
    const { orderNumber } = await setupOrder("musteri@example.com")

    // Sipariş GERÇEK DB'den okunur; yalnızca `siteSettings` erişimi
    // fırlatacak şekilde sarmalanır — `mapOrderToPublicDto` içindeki ikinci
    // sorgu yolunu izole etmenin tek yolu budur.
    const client = new Proxy(testPrisma, {
      get(target, property, receiver) {
        if (property === "siteSettings") {
          return {
            findUnique: async () => {
              throw new Error(RAW_ERROR_TEXT)
            },
          }
        }
        const value = Reflect.get(target, property, receiver)
        return typeof value === "function" ? value.bind(target) : value
      },
    }) as PrismaClient

    const result = await lookupOrder({ orderNumber, email: "musteri@example.com" }, client)

    expect(result.success).toBe(false)
    if (result.success) throw new Error("beklenmedik başarı")
    expect(result.error.code).toBe("UNKNOWN_ERROR")
    expect(result.error.message).not.toContain("ECONNREFUSED")
  })
})

describe("lookupOrder — PII sızıntısı koruması (D031)", () => {
  it("dönen DTO'da ad/adres/telefon/e-posta/sipariş kalemi ALANI YOKTUR", async () => {
    const { orderNumber } = await setupOrder()

    const result = await lookupOrder({ orderNumber, email: "musteri@example.com" }, testPrisma)
    expect(result.success).toBe(true)
    if (!result.success) throw new Error("beklenmedik hata")

    // Anahtar kümesini TAM olarak sabitliyoruz: yeni bir alan eklenirse bu
    // test düşer ve ekleyen kişi bunun PII olup olmadığını düşünmek zorunda
    // kalır (2. kural — `lib/commerce/order-lookup.ts`).
    expect(Object.keys(result.order).sort()).toEqual([
      "bankTransfer",
      "createdAt",
      "currency",
      "orderNumber",
      "orderStatus",
      "paymentMethod",
      "paymentStatus",
      "total",
    ])

    for (const forbiddenKey of [
      "contact",
      "contactFullName",
      "contactPhone",
      "contactEmail",
      "deliveryAddress",
      "deliveryAddressLine",
      "items",
      "id",
    ]) {
      expect(result.order).not.toHaveProperty(forbiddenKey)
    }
  })

  it("serileştirilmiş yanıtın hiçbir yerinde müşterinin adı/adresi/telefonu geçmez", async () => {
    const { orderNumber } = await setupOrder()
    await createSiteSettings()

    const result = await lookupOrder({ orderNumber, email: "musteri@example.com" }, testPrisma)
    if (!result.success) throw new Error("beklenmedik hata")

    const serialized = JSON.stringify(result.order)
    expect(serialized).not.toContain("Test Müşteri")
    expect(serialized).not.toContain("+905550000000")
    expect(serialized).not.toContain("Test Mahallesi")
    expect(serialized).not.toContain("musteri@example.com")
  })
})

describe("lookupOrder — havale bilgisi (D032)", () => {
  it("BANK_TRANSFER siparişinde bankTransfer GERÇEK SiteSettings'ten üretilir", async () => {
    await createSiteSettings({
      bankName: "Test Bankası",
      accountHolder: "Test Hesap Sahibi",
      iban: VALID_TEST_IBAN,
      transferDescriptionTemplate: `Sipariş ${ORDER_NUMBER_PLACEHOLDER}`,
    })
    const { orderNumber } = await setupOrder()

    const result = await lookupOrder({ orderNumber, email: "musteri@example.com" }, testPrisma)
    if (!result.success) throw new Error("beklenmedik hata")

    expect(result.order.paymentMethod).toBe("BANK_TRANSFER")
    expect(result.order.bankTransfer).not.toBeNull()
    expect(result.order.bankTransfer!.bankName).toBe("Test Bankası")
    expect(result.order.bankTransfer!.accountHolder).toBe("Test Hesap Sahibi")
    expect(result.order.bankTransfer!.ibanFormatted).toBe("TR33 0006 1005 1978 6457 8413 26")

    // Açıklama şablondan üretilmiş ve sipariş numarasını İÇERİYOR olmalı —
    // havale eşleştirmesi (D007) tam olarak buna dayanır.
    expect(result.order.bankTransfer!.description).toBe(
      renderTransferDescription(`Sipariş ${ORDER_NUMBER_PLACEHOLDER}`, orderNumber)
    )
    expect(result.order.bankTransfer!.description).toContain(orderNumber)
  })

  it("admin'in girdiği ÖZEL şablon kullanılır (sabit bir metin uydurulmaz)", async () => {
    await createSiteSettings({ transferDescriptionTemplate: `Taki-${ORDER_NUMBER_PLACEHOLDER}-odeme` })
    const { orderNumber } = await setupOrder()

    const result = await lookupOrder({ orderNumber, email: "musteri@example.com" }, testPrisma)
    if (!result.success) throw new Error("beklenmedik hata")

    expect(result.order.bankTransfer!.description).toBe(`Taki-${orderNumber}-odeme`)
  })

  it("SiteSettings HİÇ YOKKEN bankTransfer null döner (uydurma IBAN gösterilmez)", async () => {
    const { orderNumber } = await setupOrder()
    expect(await testPrisma.siteSettings.count()).toBe(0)

    const result = await lookupOrder({ orderNumber, email: "musteri@example.com" }, testPrisma)
    if (!result.success) throw new Error("beklenmedik hata")

    expect(result.order.bankTransfer).toBeNull()
  })
})
