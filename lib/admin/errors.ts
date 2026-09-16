/**
 * Admin domain servislerinin dahili hata tipleri. `lib/commerce/errors.ts`
 * deseniyle tutarlı: bu sınıflar yalnızca lib/admin/*.ts fonksiyonlarının
 * kendi içinde try/catch ile YAKALAYIP tanımlı bir sonuç koduna çevirmesi
 * içindir — hiçbiri çağırana (Server Action/route) ham olarak sızmaz. Her
 * mutasyon fonksiyonu bir `{ success: true, ... } | { success: false, error:
 * { code, message } }` sonucu döner (bkz. `checkout-action.ts` deseni) —
 * `lib/admin` bu turda kendi Server Action katmanını yazmadığı için (yalnızca
 * `app/admin-uploads/**` istisnası hariç) GÜVENLİ olmak servis fonksiyonunun
 * kendi sorumluluğudur.
 */
import { Prisma } from "../generated/prisma/client"

/** P2003 — geçersiz bir foreign key (ör. var olmayan `categoryId`/`collectionId`/`attributeValueId`). */
export function isForeignKeyViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003"
}

/** P2025 — `update`/`delete` hedef kaydı bulunamadı. */
export function isRecordNotFoundError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025"
}

export class AdminServiceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = new.target.name
  }
}

export class ProductNotFoundError extends AdminServiceError {}
export class CategoryNotFoundError extends AdminServiceError {}
export class CollectionNotFoundError extends AdminServiceError {}
export class AttributeDefinitionNotFoundError extends AdminServiceError {}
export class AttributeValueNotFoundError extends AdminServiceError {}
export class VariantNotFoundError extends AdminServiceError {}
export class OrderNotFoundError extends AdminServiceError {}
export class ProductImageNotFoundError extends AdminServiceError {}

/**
 * Ödeme onayı/reddi, siparişin MEVCUT ödeme/sipariş durumuyla bağdaşmıyor
 * (ör. iptal edilmiş bir siparişin ödemesini onaylamaya, ya da onaylanmış bir
 * ödemeyi reddetmeye çalışmak). Aynı işlemin ZARARSIZ TEKRARI (idempotent
 * no-op) bu hata DEĞİLDİR — o durumda `alreadyApplied: true` döner, bkz.
 * `lib/admin/payments.ts`.
 *
 * `message` doğrudan admin'e gösterilebilecek Türkçe bir metindir (D002);
 * hiçbir iç detay/ham Prisma hatası taşımaz.
 */
export class InvalidPaymentStateError extends AdminServiceError {}

/**
 * Ödeme onaylanırken fiziksel stok, rezerve edilmiş miktarı karşılamıyor
 * (`Variant.stockQuantity < rezervasyon quantity`). Bu, normal akışta ASLA
 * oluşmaması gereken bir veri tutarsızlığıdır — ancak admin stok alanını elle
 * düşürmüşse ortaya çıkabilir. Fırlatıldığında transaction rollback olur:
 * stok da rezervasyon da ödeme durumu da DEĞİŞMEZ, yani veri negatif stoğa
 * kaymak yerine olduğu gibi kalır ve admin durumu düzeltebilir.
 */
export class StockInconsistencyError extends AdminServiceError {}

export class InvalidOrderStatusTransitionError extends AdminServiceError {
  constructor(
    public readonly from: string,
    public readonly to: string
  ) {
    super(`Sipariş durumu "${from}" iken "${to}" durumuna geçiş yapılamaz.`)
  }
}

/** Her mutasyon fonksiyonunun catch-all fallback'i — ham hatayı ASLA client'a taşımaz. */
export function genericAdminError(): { code: "UNKNOWN_ERROR"; message: string } {
  return { code: "UNKNOWN_ERROR", message: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin." }
}
