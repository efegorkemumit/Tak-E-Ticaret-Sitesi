/**
 * Public (kimliksiz) sipariş sorgulama — D004 gereği üyelik yoktur, müşteri
 * siparişini yalnızca bu form üzerinden görebilir.
 *
 * DOĞRULAMA KURALI (D015 → D031): sipariş numarası TEK BAŞINA yeterli
 * DEĞİLDİR; sipariş numarası + siparişteki e-posta birlikte eşleşmelidir.
 * D015 "ek bir doğrulama alanı kullanılacak" ilkesini koymuş, alanın kendisi
 * `docs/OPEN_QUESTIONS.md` #12'de açık kalmıştı — VIDEO 09'da e-posta olarak
 * kesinleşti (D031).
 *
 * SUNUCU-TARAFI: `../prisma` (dolayısıyla `pg`) ve `node:crypto` içe
 * aktarılır. CLIENT COMPONENT'TEN İMPORT ETMEYİN — form doğrulaması için
 * `./order-lookup-schema.ts` doğrudan import edilmelidir.
 *
 * -------------------------------------------------------------------------
 * GÜVENLİK KURALLARI (bu dosyanın var oluş nedeni — bkz.
 * `docs/ARCHITECTURE.md` §5.2 ve §5.5):
 *
 * 1. HESAP/SİPARİŞ SAYIMI (enumeration) YOK. "Böyle bir sipariş numarası
 *    yok" ile "sipariş var ama e-posta eşleşmiyor" AYNI `NOT_FOUND` kodunu ve
 *    AYNI Türkçe mesajı döndürür. Aksi hâlde saldırgan, mesajın farkına
 *    bakarak hangi sipariş numaralarının GERÇEKTEN var olduğunu (ve dolaylı
 *    olarak işletmenin sipariş hacmini) öğrenebilirdi.
 *
 * 2. PII SIZDIRILMAZ. `PublicOrderDto` bilinçli olarak ad, adres, telefon,
 *    e-posta ve sipariş satırı (OrderItem) detayı TAŞIMAZ. Sorgulayan kişi
 *    kimliksizdir ve doğru e-postayı bilmesi, o kişinin gerçekten müşteri
 *    OLDUĞUNU kanıtlamaz (e-posta adresleri sızdırılabilir/tahmin
 *    edilebilir). Bu yüzden yalnızca "siparişim ne durumda + parayı nereye
 *    göndereceğim" sorusunu cevaplamaya yetecek asgari alan döner. Admin
 *    tarafı (`lib/admin/orders.ts`) tam detayı görür — orada kimlik
 *    doğrulanmıştır.
 *
 * 3. E-posta karşılaştırması SABİT ZAMANLIDIR (aşağıdaki `emailsMatch`).
 *
 * 4. Brute-force koruması `lib/auth/rate-limit.ts` ile paylaşılır (aşağıdaki
 *    `rateLimitKey` notuna bkz.) — ikinci bir rate limiter YAZILMADI.
 * -------------------------------------------------------------------------
 */
import { createHash, timingSafeEqual } from "node:crypto"
import { PaymentMethod } from "../generated/prisma/client"
import type { PrismaClient } from "../generated/prisma/client"
import { prisma } from "../prisma"
import { isRateLimited, recordFailedAttempt, clearRateLimit } from "../auth/rate-limit"
import { getSiteSettings } from "../settings/service"
import { renderTransferDescription } from "../settings/transfer-description"
import { orderLookupSchema } from "./order-lookup-schema"

export interface PublicOrderDto {
  orderNumber: string
  orderStatus: string
  paymentStatus: string
  paymentMethod: string
  /** Decimal'ı string olarak taşır — float'a çevirip hassasiyet kaybetmemek için. */
  total: string
  currency: string
  /** ISO 8601. */
  createdAt: string
  /**
   * Yalnızca BANK_TRANSFER siparişlerinde ve `SiteSettings` kuruluysa dolu;
   * aksi hâlde `null`. Kart (Shopier) kanalında havale bilgisinin hiçbir
   * anlamı yoktur ve gösterilmesi müşteriyi yanıltır.
   */
  bankTransfer: { bankName: string; accountHolder: string; ibanFormatted: string; description: string } | null
}

export type OrderLookupErrorCode = "INVALID_INPUT" | "NOT_FOUND" | "RATE_LIMITED" | "UNKNOWN_ERROR"

export type OrderLookupResult =
  | { success: true; order: PublicOrderDto }
  | { success: false; error: { code: OrderLookupErrorCode; message: string } }

/**
 * IP BAZLI hız sınırı mesajı — YALNIZCA Server Action katmanı tarafından
 * kullanılır (bkz. `app/(storefront)/siparis-sorgula/actions.ts`).
 *
 * NEDEN BU KOD, sipariş-numarası bazlı limitteki gibi jenerik "bulunamadı"
 * DEĞİL: aşağıdaki `isRateLimited(rateLimitKey(orderNumber))` dalı bilinçli
 * olarak `notFound()` döner, çünkü "bu numara için çok denediniz" demek,
 * saldırgana o numaranın DENENMEYE DEĞER (yani var) olduğunu söyleyen bir yan
 * kanaldır. IP bazlı sınır ise yalnızca İSTEĞİ YAPANIN kendi istek hacmi
 * hakkında bilgi verir — hiçbir siparişin varlığını sızdırmaz — bu yüzden
 * orada net ve dürüst bir mesaj göstermek hem güvenli hem de meşru müşteri
 * için çok daha anlaşılırdır.
 */
export const RATE_LIMITED_MESSAGE =
  "Çok fazla sorgulama denemesi yapıldı. Lütfen birkaç dakika sonra tekrar deneyin."

/**
 * Tek ve DEĞİŞMEZ "bulunamadı" mesajı. Hangi alanın yanlış olduğu (sipariş
 * numarası mı, e-posta mı) ASLA belirtilmez — bkz. yukarıdaki 1. kural.
 */
const NOT_FOUND_MESSAGE = "Bu sipariş numarası ve e-posta adresiyle eşleşen bir sipariş bulunamadı."

function notFound(): OrderLookupResult {
  return { success: false, error: { code: "NOT_FOUND", message: NOT_FOUND_MESSAGE } }
}

/**
 * RATE LIMIT KARARI: `lib/auth/rate-limit.ts` admin login için yazılmıştı ama
 * anahtarı serbest bir string olduğu için OLDUĞU GİBİ yeniden kullanılabilir
 * durumda — bu yüzden ikinci bir limiter YAZILMADI. Anahtar bir ad alanıyla
 * (`order-lookup:`) öneklenir, böylece admin login sayaçlarıyla aynı Map
 * içinde çakışmaz.
 *
 * BİLİNEN SINIR (team lead'e raporlandı): anahtar yalnızca sipariş
 * numarasıdır, IP DEĞİLDİR — bu servis fonksiyonu bilinçli olarak bir istek
 * nesnesi görmez (saf, DI-dostu ve Vitest'ten çağrılabilir kalması için).
 * Yani "tek bir sipariş numarasına karşı e-posta deneme" saldırısı durdurulur,
 * ama "her seferinde farklı bir sipariş numarası deneyen" bir saldırgan bu
 * katmanda sınırlanmaz.
 * TAMAMLANDI (VIDEO 09, security incelemesi N1): IP bazlı sınırlama, isteği
 * gerçekten gören katmana —
 * `app/(storefront)/siparis-sorgula/actions.ts` içindeki `lookupOrderAction`
 * — eklendi ve aynı `lib/auth/rate-limit.ts` fonksiyonlarını
 * `order-lookup-ip:` ad alanıyla kullanıyor. Bu çekirdek fonksiyon bilinçli
 * olarak bir istek nesnesi GÖRMEMEYE devam ediyor (saf/DI-dostu kalması
 * için); iki sınır birbirini tamamlar: buradaki anahtar TEK bir siparişe
 * karşı e-posta denemesini, oradaki anahtar ise farklı sipariş numaralarıyla
 * yapılan taramayı durdurur.
 */
function rateLimitKey(orderNumber: string): string {
  return `order-lookup:${orderNumber}`
}

/**
 * E-posta karşılaştırması. İKİ ayrı koruma birden:
 *
 * - CASE-INSENSITIVE: her iki taraf da trim + `toLowerCase()` edilir.
 *   Karşılaştırma UYGULAMA KATMANINDA yapılır, sorguda `mode: "insensitive"`
 *   KULLANILMAZ — DB'ye "bu e-postayla eşleşen sipariş var mı" diye
 *   sordurmak, sorgunun kendisini bir e-posta arama aracına çevirir ve
 *   ileride yanlışlıkla e-posta üzerinden listeleme yapılmasının kapısını
 *   aralar. Biz her zaman sipariş numarasıyla TEK kayıt çekip e-postayı
 *   bellekte doğruluyoruz.
 *
 * - SABİT ZAMANLI: sıradan `===` karşılaştırması ilk farklı karakterde
 *   durur; teorik olarak bir saldırgan yanıt süresine bakarak doğru
 *   e-postanın baştaki karakterlerini tek tek öğrenebilir. Bunu engellemek
 *   için `timingSafeEqual` kullanılır. `timingSafeEqual` farklı UZUNLUKTAKİ
 *   tamponlarda hata fırlattığı (ve uzunluk farkının kendisi de bir sızıntı
 *   olduğu) için önce her iki değerin SHA-256 özeti alınır — böylece her iki
 *   taraf da her zaman tam 32 bayttır ve girdi uzunluğu hakkında hiçbir bilgi
 *   sızmaz.
 */
function emailsMatch(candidate: string, actual: string): boolean {
  const candidateDigest = createHash("sha256").update(candidate.trim().toLowerCase(), "utf8").digest()
  const actualDigest = createHash("sha256").update(actual.trim().toLowerCase(), "utf8").digest()
  return timingSafeEqual(candidateDigest, actualDigest)
}

/**
 * Sipariş numarası + e-posta ile tek bir siparişin PUBLIC özetini döndürür.
 *
 * `client` parametresi `create-order.ts`/`catalog.ts` ile aynı dependency
 * injection desenini izler (varsayılan: üretim singleton'ı) — testler ayrı
 * bir test veritabanına bağlı kendi `PrismaClient`'ını geçebilir.
 */
export async function lookupOrder(rawInput: unknown, client: PrismaClient = prisma): Promise<OrderLookupResult> {
  const parsed = orderLookupSchema.safeParse(rawInput)
  if (!parsed.success) {
    return {
      success: false,
      error: { code: "INVALID_INPUT", message: parsed.error.issues[0]?.message ?? "Geçersiz girdi." },
    }
  }

  // Sipariş numaraları her zaman BÜYÜK harfle üretilir (bkz.
  // `./order-number.ts`); müşterinin küçük harfle yazması meşru bir
  // sorgulamayı engellememeli. Bu bir güvenlik gevşetmesi değildir — asıl
  // doğrulama e-posta eşleşmesidir.
  const orderNumber = parsed.data.orderNumber.toUpperCase()
  const key = rateLimitKey(orderNumber)

  // Limite takılan istek de AYNI jenerik "bulunamadı" sonucunu alır: ayrı bir
  // "çok fazla deneme" kodu döndürmek, saldırgana hangi sipariş numarasının
  // denenmeye değer olduğunu (yani var olduğunu) söyleyen bir yan kanal
  // olurdu.
  if (isRateLimited(key)) {
    return notFound()
  }

  let order: Awaited<ReturnType<typeof client.order.findUnique>>
  try {
    order = await client.order.findUnique({ where: { orderNumber } })
  } catch {
    // Ham Prisma/DB hatası (bağlantı kopması vb.) ASLA çağırana sızmaz.
    return { success: false, error: { code: "UNKNOWN_ERROR", message: "Sipariş bilgileri şu anda getirilemedi. Lütfen daha sonra tekrar deneyin." } }
  }

  // Sipariş hiç yoksa bile bir karşılaştırma yapılır (sonucu kullanılmaz):
  // "sipariş yok" dalının belirgin şekilde daha hızlı dönmesi, 1. kuralla
  // engellediğimiz sızıntının zamanlama üzerinden geri gelmesi demek olurdu.
  const emailMatches = emailsMatch(parsed.data.email, order?.contactEmail ?? "")

  if (!order || !emailMatches) {
    recordFailedAttempt(key)
    return notFound()
  }

  // Başarılı sorgulamada sayaç sıfırlanır — meşru müşteri, birkaç yanlış
  // denemeden sonra doğru bilgiyi girdiğinde cezalandırılmaz.
  clearRateLimit(key)

  try {
    return { success: true, order: await mapOrderToPublicDto(order, client) }
  } catch {
    // `mapOrderToPublicDto` `getSiteSettings` üzerinden ikinci bir DB sorgusu
    // yapar; oradan gelecek ham bir Prisma hatası bu fonksiyondan DIŞARI
    // ÇIKMAMALIDIR. Next production'da bunu zaten bir digest'e indirger, ama
    // projenin TÜM servis fonksiyonları hatayı `{ success: false, error }`
    // şekline çevirir (bkz. `checkout-action.ts`, `lib/admin/*`) — burada da
    // aynı sözleşme korunur, çağıran taraf `throw` beklemek zorunda kalmaz.
    return { success: false, error: { code: "UNKNOWN_ERROR", message: "Sipariş bilgileri şu anda getirilemedi. Lütfen daha sonra tekrar deneyin." } }
  }
}

/**
 * Yalnızca PUBLIC alanlar. Ham `Order` modelinin tamamını almak yerine
 * ihtiyaç duyulan alanları yapısal olarak tarif eden dar bir tip kullanılır —
 * böylece ileride biri yanlışlıkla `contactFullName`/`deliveryAddressLine`
 * gibi bir PII alanını DTO'ya eklemeye çalıştığında derleyici bunu bu tipe
 * eklemeye zorlar, yani değişiklik gözden kaçmaz (2. kural).
 */
type PublicOrderRow = {
  orderNumber: string
  orderStatus: string
  paymentStatus: string
  paymentMethod: string
  total: { toFixed(digits: number): string }
  currency: string
  createdAt: Date
}

async function mapOrderToPublicDto(order: PublicOrderRow, client: PrismaClient): Promise<PublicOrderDto> {
  return {
    orderNumber: order.orderNumber,
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    // `.toFixed(2)` — Prisma Decimal'ın `.toString()`'i tam sayılarda
    // ondalıkları kırpar (500.00 → "500"); para her zaman 2 basamak.
    total: order.total.toFixed(2),
    currency: order.currency,
    createdAt: order.createdAt.toISOString(),
    bankTransfer: await buildBankTransferInfo(order, client),
  }
}

/**
 * Havale bilgisi YALNIZCA iki koşul birden sağlanırsa döner: (1) sipariş
 * gerçekten BANK_TRANSFER, (2) `SiteSettings` kurulmuş. Ayar yoksa uydurma
 * bir varsayılan IBAN üretmiyoruz — yanlış bir hesap numarası göstermek, hiç
 * göstermemekten çok daha zararlıdır (bkz. `lib/settings/service.ts`).
 */
async function buildBankTransferInfo(
  order: PublicOrderRow,
  client: PrismaClient
): Promise<PublicOrderDto["bankTransfer"]> {
  if (order.paymentMethod !== PaymentMethod.BANK_TRANSFER) return null

  const settings = await getSiteSettings(client)
  if (!settings) return null

  return {
    bankName: settings.bankName,
    accountHolder: settings.accountHolder,
    ibanFormatted: settings.ibanFormatted,
    description: renderTransferDescription(settings.transferDescriptionTemplate, order.orderNumber),
  }
}
