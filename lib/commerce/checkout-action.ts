"use server"

/**
 * Checkout SUNUCU SINIRI — Next.js Server Action.
 *
 * Bu dosya, sipariş oluşturma iş mantığını YENİDEN YAZMAZ — yalnızca (1)
 * girdiyi doğrular, (2) mevcut `createOrder` servisini (Step 3, değişmeden)
 * çağırır, (3) sonucu/hatayı storefront'un güvenle render edebileceği bir
 * şekle (discriminated union) çevirir. Tek doğruluk kaynağı hâlâ
 * `create-order.ts`'tir.
 *
 * İSİM/ŞEKİL: Fonksiyon adı (`submitCheckoutOrder`) ve dönüş şekli
 * (`{ success, order }`), storefront'un bu Server Action'ı beklerken zaten
 * inşa ettiği checkout formuyla (kendi geçici stub'ı üzerinden geliştirdiği)
 * birebir eşleşecek şekilde seçildi — onların tarafında tek satırlık bir
 * import değişikliği yeterli olsun diye.
 *
 * GÜVENLİ HATA HARİTALAMA: Hiçbir ham Prisma hatası, SQL parçası, stack
 * trace veya internal ID client'a sızmaz. Başarı durumunda bile `orderId`
 * (internal, sistemsel eşleştirme anahtarı — bkz. `docs/ARCHITECTURE.md`
 * §5) BİLİNÇLİ OLARAK client'a DÖNMEZ; müşteriye yalnızca insana dönük
 * `orderNumber` gösterilir, gelecekteki bir sipariş sorgulama akışı da zaten
 * `orderNumber` + doğrulama alanı üzerinden çalışacak (D015), `orderId`'ye
 * hiçbir zaman ihtiyaç duymayacak.
 *
 * HATA KODU GRANÜLERLİĞİ (bilinçli tasarım tercihi): `VariantNotFoundError`
 * ve `ProductNotPurchasableError` AYNI `PRODUCT_UNAVAILABLE` koduna
 * eşleniyor — "varyant hiç yok" ile "ürün DRAFT/ARCHIVED" arasındaki farkı
 * client'a sızdırmamak için kasıtlı bir birleştirme (biri var olan bir
 * ürünün iç durumunu, diğeri geçersiz bir ID'yi ayırt eder — ikisi de
 * müşteriye faydalı bir bilgi değil, yalnızca saldırı yüzeyi/keşif riski
 * taşır). Storefront şu an yalnızca `error.message`'ı gösterdiği için bu
 * granülerlik farkı UI'ı etkilemiyor.
 *
 * ÖDEME SINIRI (VIDEO 09 / D030 sonrası güncellendi): `paymentMethod` artık
 * yalnızca `BANK_TRANSFER` olabilir — `checkoutInputSchema` başka bir değeri
 * kabul etmez, dolayısıyla bu Server Action bir SHOPIER siparişi ASLA
 * oluşturamaz. Shopier bu akışın içinde bir adım DEĞİLDİR; ayrı bir satış
 * kanalıdır ve ürün detayındaki kendi CTA'sı üzerinden çalışır. Burada sahte
 * bir redirect/URL ÜRETİLMEZ ve havale için sahte bir onay YAPILMAZ:
 * `paymentStatus` her zaman `PENDING` döner (bu, `createOrder`'ın zaten sahip
 * olduğu davranıştır — burada değiştirilmez/taklit edilmez). Ödemeyi
 * onaylayan/reddeden tek yer admin panelidir (D033).
 *
 * NEDEN LOG YOK: Bu dosyada bilinçli olarak hiçbir `console.*` çağrısı
 * bulunmuyor — `checkoutInputSchema`'nın doğrulama hataları (ZodError) ham
 * girdiyi (ör. e-posta/telefon/adres — PII) issue nesnesinde taşıyabilir;
 * bunu loglamak security'nin daha önce vurguladığı "aşırı PII loglama"
 * riskini doğurur. Gözlemlenebilirlik (ör. yapılandırılmış/redakte edilmiş
 * hata loglaması) ayrı bir karar/altyapı gerektirir, bu turun kapsamında
 * değildir.
 */
import { ZodError } from "zod"
import type { PrismaClient } from "../generated/prisma/client"
import { prisma } from "../prisma"
import { createOrder } from "./create-order"
import { checkoutInputSchema } from "./checkout-schema"
import {
  VariantNotFoundError,
  ProductNotPurchasableError,
  InsufficientStockError,
  IdempotencyKeyConflictError,
} from "./errors"

export type CheckoutErrorCode =
  | "INVALID_INPUT"
  | "STOCK_UNAVAILABLE"
  | "PRODUCT_UNAVAILABLE"
  | "CHECKOUT_CONFLICT"
  | "UNKNOWN_ERROR"

/** Client'a dönen sipariş özeti — `orderId` BİLİNÇLİ OLARAK yok (bkz. dosya başı notu). */
export interface CheckoutOrderSummary {
  orderNumber: string
  total: string
  currency: string
  paymentMethod: string
  paymentStatus: string
  orderStatus: string
}

export interface CheckoutSuccessResult {
  success: true
  order: CheckoutOrderSummary
}

export interface CheckoutErrorResult {
  success: false
  error: {
    code: CheckoutErrorCode
    /** Kullanıcıya doğrudan gösterilebilir, güvenli Türkçe mesaj. */
    message: string
  }
}

export type CheckoutSubmitResult = CheckoutSuccessResult | CheckoutErrorResult

const SAFE_ERROR_MESSAGES: Record<CheckoutErrorCode, string> = {
  INVALID_INPUT: "Girdiğiniz bilgilerde bir sorun var. Lütfen formu kontrol edip tekrar deneyin.",
  STOCK_UNAVAILABLE: "Sepetinizdeki bazı ürünlerin stoğu değişti. Lütfen sepetinizi kontrol edin.",
  PRODUCT_UNAVAILABLE: "Sepetinizdeki bazı ürünler artık mevcut değil. Lütfen sepetinizi güncelleyip tekrar deneyin.",
  CHECKOUT_CONFLICT: "Bu işlemle ilgili bir tutarsızlık tespit edildi. Lütfen sayfayı yenileyip siparişinizi tekrar oluşturun.",
  UNKNOWN_ERROR: "Bir şeyler ters gitti. Lütfen daha sonra tekrar deneyin.",
}

function errorResult(code: CheckoutErrorCode): CheckoutErrorResult {
  return { success: false, error: { code, message: SAFE_ERROR_MESSAGES[code] } }
}

/**
 * Checkout girdisinden bir sipariş oluşturur.
 *
 * `rawInput` bilinçli olarak `unknown`'dır — Server Action sınırı ağ
 * sınırına eşdeğerdir (D022: "client'tan gelen hiçbir şey güvenilir
 * değildir"), bu yüzden storefront'un TypeScript tarafında doğru tip
 * göndermesi bir GARANTİ değildir; gerçek doğrulama her zaman burada,
 * çalışma zamanında yapılır.
 *
 * `client` parametresi `create-order.ts` ile AYNI dependency injection
 * desenini izler (varsayılan: üretim singleton'ı). Tarayıcıdan yapılan gerçek
 * bir Server Action çağrısı yalnızca `rawInput`'u gönderebilir (bir
 * `PrismaClient` örneği ağ üzerinden serialize edilemez) — bu yüzden üretimde
 * ikinci parametre her zaman varsayılanını kullanır. Bu parametre yalnızca
 * testlerin (Step 3'teki desenle) ayrı bir `testPrisma` geçerek üretim
 * `DATABASE_URL`'ine hiç dokunmadan bu Server Action'ı da test edebilmesi
 * içindir.
 */
export async function submitCheckoutOrder(
  rawInput: unknown,
  client: PrismaClient = prisma
): Promise<CheckoutSubmitResult> {
  const parsed = checkoutInputSchema.safeParse(rawInput)
  if (!parsed.success) {
    return errorResult("INVALID_INPUT")
  }

  try {
    const result = await createOrder(parsed.data, client)
    return {
      success: true,
      order: {
        orderNumber: result.orderNumber,
        total: result.total,
        currency: result.currency,
        paymentMethod: result.paymentMethod,
        paymentStatus: result.paymentStatus,
        orderStatus: result.orderStatus,
      },
    }
  } catch (error) {
    return mapErrorToResult(error)
  }
}

function mapErrorToResult(error: unknown): CheckoutErrorResult {
  if (error instanceof InsufficientStockError) {
    return errorResult("STOCK_UNAVAILABLE")
  }
  if (error instanceof VariantNotFoundError || error instanceof ProductNotPurchasableError) {
    return errorResult("PRODUCT_UNAVAILABLE")
  }
  if (error instanceof IdempotencyKeyConflictError) {
    return errorResult("CHECKOUT_CONFLICT")
  }
  // `ZodError` normalde yukarıdaki `safeParse` tarafından yakalanır ve asla
  // buraya kadar gelmez — `createOrder`'ın kendi iç `.parse()` çağrısı için
  // yalnızca savunma amaçlı (defense-in-depth) bir ikinci katman.
  if (error instanceof ZodError) {
    return errorResult("INVALID_INPUT")
  }
  // Tanınmayan her şey (ham Prisma/DB hatası dahil) — asla `error.message`/
  // `error.stack` client'a sızdırılmaz, jenerik mesaja indirgenir.
  return errorResult("UNKNOWN_ERROR")
}
