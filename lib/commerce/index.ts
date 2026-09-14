/**
 * `lib/commerce/` — gerçek veritabanı üzerinde çalışan, yetkili commerce
 * servis katmanı. `lib/catalog.ts` (storefront'un mock/fixture display
 * katmanı) İLE KARIŞTIRILMAMALIDIR, bkz. `create-order.ts` başındaki not.
 *
 * Bu barrel dosyası SUNUCU-TARAFI kod içindir — `../prisma` (dolayısıyla
 * `pg`) zincirini içe aktarır. CLIENT COMPONENT'LERDEN İMPORT ETMEYİN.
 *
 * Saf/görüntüleme yardımcıları (`getPriceSummary`, `isProductOutOfStock`,
 * `getAttributeOptions`, `resolveVariant`, `getAvailabilityLabel` vb.)
 * BİLİNÇLİ OLARAK bu barrel'da YOKTUR — client component'ler bunları
 * doğrudan `lib/commerce/catalog-display.ts`'ten import etmelidir (o dosya
 * hiçbir DB/Prisma importu içermez, tarayıcı paketine güvenle girebilir).
 * Bu ayrım, storefront'un bir client component'te bu saf fonksiyonlardan
 * birini bu barrel/`catalog.ts` üzerinden import ettiğinde bundler'ın `pg`'yi
 * tarayıcı paketine dahil etmeye çalışıp build'i kırdığını bulmasının
 * ardından yapıldı — aynı sorunun barrel dosyası üzerinden tekrarlanmaması
 * için buraya da eklenmedi.
 *
 * Henüz hiçbir API route/server action bunu tüketmiyor (bu turun bilinçli
 * sınırı).
 */
export { createOrder } from "./create-order"
export type { CreateOrderResult } from "./create-order"
export { checkoutInputSchema } from "./checkout-schema"
export type { CheckoutInput, CheckoutItemInput } from "./checkout-schema"
export {
  CommerceError,
  InvalidCheckoutInputError,
  VariantNotFoundError,
  ProductNotPurchasableError,
  InsufficientStockError,
  IdempotencyKeyConflictError,
} from "./errors"

// Katalog read layer (VIDEO 06 STEP 4) — yalnızca DB sorgulayan fonksiyonlar.
// Saf yardımcılar için `lib/commerce/catalog-display.ts`'e bakın (dosya başı
// notuna bkz.).
export {
  getPublishedProducts,
  getProductBySlug,
  getProductsByCategorySlug,
  getProductsByCollectionSlug,
  getCategories,
  getCategoryBySlug,
  getCollections,
  getCollectionBySlug,
} from "./catalog"
export type {
  CatalogAttributeDto,
  CatalogVariantDto,
  CatalogImageDto,
  CatalogProductDto,
  CatalogTaxonomyDto,
  AvailabilityStatus,
} from "./catalog"
