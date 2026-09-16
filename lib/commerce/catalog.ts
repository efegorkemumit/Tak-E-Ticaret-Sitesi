/**
 * Gerçek veritabanı üzerinde çalışan, SALT-OKUNUR katalog read layer.
 *
 * ÖNEMLİ İSİM/KAVRAM AYRIMI (bkz. `create-order.ts`'teki aynı uyarı):
 * Bu, `lib/catalog.ts` DEĞİLDİR. `lib/catalog.ts` storefront'un VIDEO 05'te
 * kurduğu, `lib/fixtures/products.ts` (statik mock veri) üzerinde çalışan bir
 * katmandır — ona dokunulmadı, storefront onu bu dosyayı kullanacak şekilde
 * kendisi değiştirecek/kaldıracaktır.
 *
 * Bu dosya, sipariş oluşturma yetkisi olan `create-order.ts`'ten farklı
 * olarak hiçbir transaction/satır kilidi GEREKTİRMEZ — yalnızca görüntüleme
 * amaçlıdır, eventually-consistent olması kabul edilebilir (ör. availability
 * hesaplaması ile gerçek checkout anı arasında birkaç saniyelik bir sapma
 * olması normaldir, checkout anında zaten `stock.ts` kilitli/kesin kontrolü
 * yeniden yapar).
 *
 * SUNUCU-TARAFI (CLIENT COMPONENT'TEN İMPORT ETMEYİN): Bu dosya `../prisma`
 * (dolayısıyla `pg`'nin Node-only `net`/`tls` bağımlılıklarını) içe aktarır.
 * Saf/görüntüleme yardımcıları (`getPriceSummary`, `isProductOutOfStock`,
 * `getAttributeOptions`, `resolveVariant`, vb.) BİLİNÇLİ OLARAK bu dosyada
 * DEĞİL, `./catalog-display.ts`'tedir — storefront'un bir client component'te
 * bu saf fonksiyonlardan birini buradan import ettiğinde bundler'ın `pg`'yi
 * tarayıcı paketine dahil etmeye çalışıp build'i kırdığını bulmasının
 * ardından bu ayrım yapıldı. DTO tipleri (`CatalogProductDto` vb.) bu
 * dosyada TANIMLI kalır (`export type`/`interface` derleme zamanında
 * tamamen silinir, `import type` ile her yerden güvenle kullanılabilir).
 *
 * Bu turda YAZILMAYAN şeyler (bilinçli sınır): cart/checkout, API route,
 * admin, route/page dosyaları (storefront'un kendi işi).
 */
import { ProductStatus } from "../generated/prisma/client"
import type { Prisma, PrismaClient } from "../generated/prisma/client"
import { prisma } from "../prisma"
import { getAvailabilityStatus, getAvailableQuantities } from "./availability"
import { validateShopierUrl } from "../shopier/url"
import type { AvailabilityStatus } from "./availability"

export type { AvailabilityStatus } from "./availability"

// -----------------------------------------------------------------------------
// DTO'lar — hiçbir zaman ham Prisma model tipini veya `Prisma.Decimal`'ı
// dışarı sızdırmaz; server component'ten client component'e güvenle geçilebilir
// (serialize-safe: yalnızca string/number/boolean/array/plain object).
// -----------------------------------------------------------------------------

export interface CatalogAttributeDto {
  /** `AttributeDefinition.key` — serbest string, OPEN #4 kilitlenmez. */
  type: string
  /** `AttributeDefinition.label` — DB'den gelir, hardcoded bir çeviri tablosuna gerek YOK. */
  label: string
  value: string
}

export interface CatalogVariantDto {
  id: string
  sku: string
  /** `Prisma.Decimal` DEĞİL — `.toFixed(2)` ile string'e çevrilmiş (ör. "450.00"). */
  price: string
  /** D020 — bu varyantın SEÇİLEBİLİR öznitelik kombinasyonu (VariantAttributeValue). */
  attributes: CatalogAttributeDto[]
  /** Jenerik 3-durum (bkz. `availability.ts`) — müşteriye gösterilecek etiket için. */
  availability: AvailabilityStatus
  /**
   * D018 formülüyle hesaplanmış ham sayı (`stockQuantity - aktif rezervasyon`).
   * Storefront'un talebi üzerine eklendi — UI-taraflı "seçilebilir mi/disabled
   * mı" mantığı (ör. bir öznitelik kombinasyonunun anlık olarak tükenmiş
   * olması) için `availability` enum'undan daha kesin bir sinyal sağlar.
   * Müşteriye DOĞRUDAN bu sayının gösterilip gösterilmeyeceği (ör. "yalnızca
   * 2 adet kaldı") bir UI/iş kararıdır, bu DTO onu dayatmaz — yalnızca veriyi
   * sağlar.
   */
  availableQuantity: number
}

export interface CatalogImageDto {
  url: string
  /** Erişilebilirlik metni (`<img alt>`). */
  alt: string
  /**
   * `true` ise bu görsel GERÇEK ürün fotoğrafı DEĞİLDİR (D012) — storefront
   * bunu "Örnek görsel" rozeti için kullanmalıdır. Mock'taki `isRealProductPhoto`
   * alanının TERSİDİR (kutupsallık değişti) — dikkat: `!isRealProductPhoto`
   * yerine artık doğrudan `isPlaceholder`.
   */
  isPlaceholder: boolean
}

export interface CatalogProductDto {
  id: string
  slug: string
  name: string
  /** Şemada `Product.description` opsiyonel; dolu değilse `null`. */
  description: string | null
  /** Ürün bakım bilgisi metni (opsiyonel; dolu değilse `null`). */
  careInfo: string | null
  /** Hediye paketi seçeneği sunuluyor mu — yalnızca varlık, ücretlendirme yok. */
  giftPackagingAvailable: boolean
  categorySlug: string
  /** Bir ürün birden fazla koleksiyonda olabilir (D023 — çoktan-çoğa). */
  collectionSlugs: string[]
  /** Galeri sırasına göre (sortOrder asc) sıralanmış görseller. */
  images: CatalogImageDto[]
  /**
   * D020 — ürünün AÇIKLAYICI/spesifikasyon özniteliği (ProductAttributeValue).
   * Varyant seçimi DEĞİLDİR, her zaman gösterilen sabit bilgidir (ör. bir
   * kolyenin hem "Zirkon" hem "İnci" taşıması). Aynı `type` birden fazla kez
   * gelebilir (D020'nin kendisi bunu izin veriyor).
   */
  descriptiveAttributes: CatalogAttributeDto[]
  variants: CatalogVariantDto[]
  /**
   * D030 (VIDEO 09) — Shopier ARTIK checkout içindeki bir ödeme sağlayıcısı
   * DEĞİL, AYRI bir kartlı satış kanalıdır: ürün detayındaki CTA müşteriyi
   * bu ürünün kayıtlı Shopier satış sayfasına götürür. Bu ürünün Shopier'de
   * bir karşılığı yoksa (veya kayıtlı değer doğrulamadan geçmiyorsa) `null`
   * olur ve storefront CTA'yı hiç göstermez.
   */
  shopierUrl: string | null
}

export interface CatalogTaxonomyDto {
  slug: string
  name: string
  /** Kategori/koleksiyon sayfası alt başlığı (opsiyonel; dolu değilse `null`). */
  description: string | null
}

// -----------------------------------------------------------------------------
// Ürün sorguları
// -----------------------------------------------------------------------------

const PRODUCT_INCLUDE = {
  variants: {
    include: {
      attributeValues: {
        include: { attributeDefinition: true, attributeValue: true },
      },
    },
  },
  descriptiveAttributes: {
    include: { attributeDefinition: true, attributeValue: true },
  },
  images: {
    orderBy: { sortOrder: "asc" },
  },
  category: true,
  collections: {
    include: { collection: true },
  },
} satisfies Prisma.ProductInclude

type ProductWithRelations = Prisma.ProductGetPayload<{ include: typeof PRODUCT_INCLUDE }>

/** Yalnızca doğrulamadan geçen, kanonik hâle getirilmiş Shopier url'i dışarı verilir. */
function resolvePublicShopierUrl(rawUrl: string | null): string | null {
  const result = validateShopierUrl(rawUrl)
  return result.ok ? result.url : null
}

function mapProductWithAvailability(
  product: ProductWithRelations,
  availabilityByVariantId: Map<string, number>
): CatalogProductDto {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    careInfo: product.careInfo,
    giftPackagingAvailable: product.giftPackagingAvailable,
    categorySlug: product.category.slug,
    // DEFENSE IN DEPTH: DB'deki değer admin formunda zaten doğrulanarak
    // yazılıyor (bkz. `lib/admin/products.ts` → `updateProductShopierLink`),
    // ama storefront'a çıkarken BİR KEZ DAHA doğrulanır. Neden: alan geçmişte
    // başka bir yoldan (elle SQL, seed, eski bir migration) doldurulmuş
    // olabilir; doğrulamadan geçmeyen bir değeri müşteriye `href` olarak
    // vermek, kullanıcıyı bizim kontrol etmediğimiz bir adrese yönlendirmek
    // demektir. Yalnızca KANONİK biçim dışarı verilir.
    shopierUrl: resolvePublicShopierUrl(product.shopierUrl),
    collectionSlugs: product.collections.map((join) => join.collection.slug),
    images: product.images.map((image) => ({
      url: image.url,
      alt: image.alt,
      isPlaceholder: image.isPlaceholder,
    })),
    descriptiveAttributes: product.descriptiveAttributes.map((entry) => ({
      type: entry.attributeDefinition.key,
      label: entry.attributeDefinition.label,
      value: entry.attributeValue.value,
    })),
    variants: product.variants.map((variant) => {
      const availableQuantity = availabilityByVariantId.get(variant.id) ?? 0
      return {
        id: variant.id,
        sku: variant.sku,
        price: variant.price.toFixed(2),
        attributes: variant.attributeValues.map((selection) => ({
          type: selection.attributeDefinition.key,
          label: selection.attributeDefinition.label,
          value: selection.attributeValue.value,
        })),
        availability: getAvailabilityStatus(availableQuantity),
        availableQuantity,
      }
    }),
  }
}

async function mapProductToDto(product: ProductWithRelations, client: PrismaClient): Promise<CatalogProductDto> {
  const availabilityByVariantId = await getAvailableQuantities(
    client,
    product.variants.map((variant) => variant.id)
  )
  return mapProductWithAvailability(product, availabilityByVariantId)
}

async function mapProductsToDtos(
  products: ProductWithRelations[],
  client: PrismaClient
): Promise<CatalogProductDto[]> {
  // Tek tek `mapProductToDto` çağırmak yerine tüm variantId'ler için TEK bir
  // toplu `getAvailableQuantities` sorgusu yapılır — liste sayfalarında N+1
  // sorgu üretmemek için.
  const allVariantIds = products.flatMap((product) => product.variants.map((variant) => variant.id))
  const availabilityByVariantId = await getAvailableQuantities(client, allVariantIds)

  return products.map((product) => mapProductWithAvailability(product, availabilityByVariantId))
}

/**
 * `client` parametresi tüm fonksiyonlarda `create-order.ts`'teki aynı
 * dependency injection desenini izler (varsayılan: üretim singleton'ı) —
 * testlerin üretimin okuduğu `DATABASE_URL`'e hiç dokunmadan, ayrı bir
 * `testPrisma` geçerek bu katmanı da test edebilmesi içindir.
 */

/** Yalnızca `PUBLISHED` ürünler (D021) — DRAFT/ARCHIVED asla dönmez. */
export async function getPublishedProducts(client: PrismaClient = prisma): Promise<CatalogProductDto[]> {
  const products = await client.product.findMany({
    where: { status: ProductStatus.PUBLISHED },
    include: PRODUCT_INCLUDE,
    orderBy: { createdAt: "desc" },
  })
  return mapProductsToDtos(products, client)
}

/**
 * `slug` bilinse/tahmin edilse bile ürün `PUBLISHED` değilse `null` döner —
 * sayfa bunu `notFound()` ile ele almalı (D021).
 */
export async function getProductBySlug(slug: string, client: PrismaClient = prisma): Promise<CatalogProductDto | null> {
  const product = await client.product.findFirst({
    where: { slug, status: ProductStatus.PUBLISHED },
    include: PRODUCT_INCLUDE,
  })
  if (!product) return null
  return mapProductToDto(product, client)
}

export async function getProductsByCategorySlug(
  slug: string,
  client: PrismaClient = prisma
): Promise<CatalogProductDto[]> {
  const products = await client.product.findMany({
    where: { status: ProductStatus.PUBLISHED, category: { slug } },
    include: PRODUCT_INCLUDE,
    orderBy: { createdAt: "desc" },
  })
  return mapProductsToDtos(products, client)
}

export async function getProductsByCollectionSlug(
  slug: string,
  client: PrismaClient = prisma
): Promise<CatalogProductDto[]> {
  const products = await client.product.findMany({
    where: { status: ProductStatus.PUBLISHED, collections: { some: { collection: { slug } } } },
    include: PRODUCT_INCLUDE,
    orderBy: { createdAt: "desc" },
  })
  return mapProductsToDtos(products, client)
}

// -----------------------------------------------------------------------------
// Kategori / Koleksiyon sorguları (nav/breadcrumb/metadata için)
// -----------------------------------------------------------------------------

export async function getCategories(client: PrismaClient = prisma): Promise<CatalogTaxonomyDto[]> {
  const categories = await client.category.findMany({ orderBy: { name: "asc" } })
  return categories.map((category) => ({ slug: category.slug, name: category.name, description: category.description }))
}

export async function getCategoryBySlug(
  slug: string,
  client: PrismaClient = prisma
): Promise<CatalogTaxonomyDto | null> {
  const category = await client.category.findUnique({ where: { slug } })
  return category ? { slug: category.slug, name: category.name, description: category.description } : null
}

export async function getCollections(client: PrismaClient = prisma): Promise<CatalogTaxonomyDto[]> {
  const collections = await client.collection.findMany({ orderBy: { name: "asc" } })
  return collections.map((collection) => ({
    slug: collection.slug,
    name: collection.name,
    description: collection.description,
  }))
}

export async function getCollectionBySlug(
  slug: string,
  client: PrismaClient = prisma
): Promise<CatalogTaxonomyDto | null> {
  const collection = await client.collection.findUnique({ where: { slug } })
  return collection ? { slug: collection.slug, name: collection.name, description: collection.description } : null
}

// Saf görüntüleme yardımcıları (isProductOutOfStock, getPriceSummary,
// getAttributeOptions, resolveVariant, vb.) BURADA DEĞİL — bkz. yukarıdaki
// dosya başı notu — `./catalog-display.ts`'e taşındı.
