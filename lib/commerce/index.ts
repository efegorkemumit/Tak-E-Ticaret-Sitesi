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
  isUniqueConstraintViolation,
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

// D018'in TEK paylaşılan kullanılabilir-stok formülü (bkz. `availability.ts`
// başlık yorumu) — Wave B'de `lib/admin/` (stok ekranı, varyant oluşturma)
// bunu tüketir, ikinci bir kopyasını YAZMAZ.
export { getAvailableQuantities } from "./availability"

// VIDEO 09 — public sipariş sorgulama (D031). Şeması (`./order-lookup-schema`)
// BİLİNÇLİ OLARAK bu barrel'da YOKTUR: client-safe'tir ve sorgulama formu onu
// doğrudan import etmelidir (dosya başındaki client/server ayrımı notuna bkz.).
export { lookupOrder } from "./order-lookup"
export type { PublicOrderDto, OrderLookupResult } from "./order-lookup"

// VIDEO 09 — D018'in otomatik zaman aşımı parçası. Bir HTTP isteği değil,
// sistem/cron job'ıdır (`requireAdmin` çağırmaz); `scripts/expire-orders.ts`
// bunu yerel/test ortamında çalıştırır.
export { expireOverdueBankTransferOrders } from "./expire-orders"
export type { ExpireOverdueOrdersResult } from "./expire-orders"
