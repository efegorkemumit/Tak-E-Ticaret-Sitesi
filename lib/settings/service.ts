/**
 * Site ayarlarının (havale banka bilgisi + D018 rezervasyon penceresi)
 * okuma/yazma servisi.
 *
 * SUNUCU-TARAFI (CLIENT COMPONENT'TEN İMPORT ETMEYİN): bu dosya `../prisma`
 * (dolayısıyla `pg`'nin Node-only bağımlılıklarını) içe aktarır. Saf
 * yardımcılar (`./iban.ts`, `./schemas.ts`, `./transfer-description.ts`,
 * `./constants.ts`) BİLİNÇLİ OLARAK ayrı dosyalardadır ve client
 * component'lerden doğrudan import edilebilir — `lib/commerce/catalog.ts` ile
 * `catalog-display.ts` arasındaki aynı ayrım.
 *
 * `client` parametresi her fonksiyonda dependency injection ile verilir
 * (varsayılan: üretim singleton'ı). NEDEN: testler ayrı bir
 * `TEST_DATABASE_URL`'e bağlı KENDİ `PrismaClient`'ını geçebilsin diye
 * (bkz. `lib/commerce/create-order.ts`'teki aynı gerekçe).
 */
import type { Prisma, PrismaClient } from "../generated/prisma/client"
import { prisma } from "../prisma"
import { requireAdmin } from "../auth"
import { genericAdminError } from "../admin/errors"
import { SITE_SETTINGS_ID, DEFAULT_RESERVATION_WINDOW_HOURS } from "./constants"
import { formatIbanForDisplay } from "./iban"
import { updateSiteSettingsSchema } from "./schemas"

export interface SiteSettingsDto {
  bankName: string
  accountHolder: string
  /** Kanonik/normalize edilmiş IBAN (boşluksuz, büyük harf). */
  iban: string
  /** Gösterim için 4'lü gruplanmış hâl. */
  ibanFormatted: string
  transferDescriptionTemplate: string
  reservationWindowHours: number
}

type SiteSettingsRow = {
  bankName: string
  accountHolder: string
  iban: string
  transferDescriptionTemplate: string
  reservationWindowHours: number
}

/** Tek eşleme noktası — okuma ve yazma yollarının farklı DTO üretmesini önler. */
function mapSettingsToDto(settings: SiteSettingsRow): SiteSettingsDto {
  return {
    bankName: settings.bankName,
    accountHolder: settings.accountHolder,
    iban: settings.iban,
    ibanFormatted: formatIbanForDisplay(settings.iban),
    transferDescriptionTemplate: settings.transferDescriptionTemplate,
    reservationWindowHours: settings.reservationWindowHours,
  }
}

/**
 * Ayarları okur. **AUTH YOK** — burada bilinçli bir karar var: havale banka
 * bilgisi zaten müşteriye gösterilen PUBLIC bir bilgidir (sipariş başarı
 * ekranı + sipariş sorgulama). Kimlik doğrulaması istemek, müşterinin parayı
 * nereye göndereceğini görmesini imkânsız kılardı. Buna karşılık YAZMA
 * (`updateSiteSettings`) mutlaka admin ister.
 *
 * Ayar HİÇ kurulmadıysa `null` döner — çağıran taraf bunu "havale bilgisi
 * henüz girilmemiş" olarak ele almalıdır (uydurma bir varsayılan IBAN
 * ÜRETMİYORUZ; yanlış bir hesap numarası göstermek, hiç göstermemekten çok
 * daha zararlıdır).
 */
export async function getSiteSettings(client: PrismaClient = prisma): Promise<SiteSettingsDto | null> {
  const settings = await client.siteSettings.findUnique({ where: { id: SITE_SETTINGS_ID } })
  if (!settings) return null
  return mapSettingsToDto(settings)
}

/**
 * D018 — stok rezervasyonunun kaç saat tutulacağı. Ayar satırı yoksa
 * `DEFAULT_RESERVATION_WINDOW_HOURS`'a düşer, yani sipariş oluşturma ayar
 * girilmemiş bir sistemde de çalışmaya devam eder.
 *
 * Parametre tipi bilinçli olarak `Prisma.TransactionClient`'tır: bu fonksiyon
 * `createOrder`'ın AÇIK `$transaction`'ı İÇİNDEN, aynı `tx` ile çağrılır —
 * böylece sipariş yazımıyla aynı anlık görüntüyü (snapshot) okur ve
 * transaction dışından ikinci bir bağlantı açmaz. `PrismaClient` de bu tipe
 * uyar, yani transaction dışından da çağrılabilir.
 */
export async function getReservationWindowHours(db: Prisma.TransactionClient): Promise<number> {
  const settings = await db.siteSettings.findUnique({
    where: { id: SITE_SETTINGS_ID },
    select: { reservationWindowHours: true },
  })
  return settings?.reservationWindowHours ?? DEFAULT_RESERVATION_WINDOW_HOURS
}

export type UpdateSiteSettingsResult =
  | { success: true; settings: SiteSettingsDto }
  | { success: false; error: { code: "INVALID_INPUT" | "UNKNOWN_ERROR"; message: string } }

/**
 * Ayarları oluşturur veya günceller (`upsert`) — `id` her zaman sabit
 * `SITE_SETTINGS_ID` olduğu için işlem doğal olarak IDEMPOTENT'tir: aynı
 * istek iki kez gelse bile ikinci bir ayar satırı oluşmaz (D017'nin ruhu).
 *
 * `requireAdmin` İLK İŞ olarak çağrılır — IBAN, sistemdeki en kritik ödeme
 * bilgisidir; buraya yazma yetkisi elde eden biri müşterilerin parasını kendi
 * hesabına yönlendirebilir. Bu yüzden doğrulama, Zod parse'ından bile ÖNCE
 * yapılır (kimliksiz bir istek, girdisinin geçerli olup olmadığını öğrenecek
 * kadar bile ilerlememelidir).
 */
export async function updateSiteSettings(
  rawInput: unknown,
  client: PrismaClient = prisma
): Promise<UpdateSiteSettingsResult> {
  await requireAdmin(client)

  const parsed = updateSiteSettingsSchema.safeParse(rawInput)
  if (!parsed.success) {
    // Zod'un ilk issue mesajı doğrudan kullanıcıya gösterilir — GÜVENLİ,
    // çünkü bu şemadaki tüm mesajlar bizim yazdığımız Türkçe sabitlerdir,
    // girdiden türetilmiş/yankılanmış bir içerik taşımazlar (bkz.
    // `lib/admin/products.ts`'teki aynı desen).
    return { success: false, error: { code: "INVALID_INPUT", message: parsed.error.issues[0]?.message ?? "Geçersiz girdi." } }
  }
  const input = parsed.data

  try {
    const settings = await client.siteSettings.upsert({
      where: { id: SITE_SETTINGS_ID },
      create: { id: SITE_SETTINGS_ID, ...input },
      update: { ...input },
    })

    return { success: true, settings: mapSettingsToDto(settings) }
  } catch {
    // Ham Prisma hatası ASLA dışarı sızmaz (bağlantı string'i/sürücü mesajı
    // içerebilir) — `lib/admin/errors.ts`'teki ortak fallback kullanılır.
    return { success: false, error: genericAdminError() }
  }
}
