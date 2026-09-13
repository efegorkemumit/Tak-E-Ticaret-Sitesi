/**
 * DEVELOPMENT QUERY LAYER — commerce'in gerçek API'si/veritabanı erişimi
 * kurulunca bu dosyanın içi değişecek, dışa açtığı fonksiyon imzaları (kontrat)
 * mümkün olduğunca korunmaya çalışılacaktır. Şu an yalnızca
 * `lib/fixtures/products.ts` (commerce) ve `lib/fixtures/catalog-metadata.ts`
 * (storefront) üzerinde çalışan senkron yardımcı fonksiyonlardır.
 *
 * Bu dosya OPEN kararları (#3 kategori, #4 varyant yapısı, #8 stok politikası)
 * kesinleştirmez — yalnızca fixture verisini sayfa/component'lerin ihtiyaç
 * duyduğu şekle indirger.
 */
import { sampleProducts } from "./fixtures/products"
import type {
  AttributeType,
  AvailabilityStatus,
  Product,
  ProductAttribute,
  ProductVariant,
} from "./fixtures/products"
import { categoryMetadata, collectionMetadata } from "./fixtures/catalog-metadata"
import type { CatalogTaxonomyEntry } from "./fixtures/catalog-metadata"

export type {
  AttributeType,
  AvailabilityStatus,
  Product,
  ProductAttribute,
  ProductImage,
  ProductVariant,
} from "./fixtures/products"
export type { CatalogTaxonomyEntry } from "./fixtures/catalog-metadata"

export function getAllProducts(): Product[] {
  return sampleProducts
}

export function getProductBySlug(slug: string): Product | undefined {
  return sampleProducts.find((product) => product.slug === slug)
}

export function getProductsByCategorySlug(slug: string): Product[] {
  return sampleProducts.filter((product) => product.categories.includes(slug))
}

export function getProductsByCollectionSlug(slug: string): Product[] {
  return sampleProducts.filter((product) => product.collections.includes(slug))
}

export function getAllCategories(): CatalogTaxonomyEntry[] {
  return categoryMetadata
}

export function getAllCollections(): CatalogTaxonomyEntry[] {
  return collectionMetadata
}

export function getCategoryBySlug(slug: string): CatalogTaxonomyEntry | undefined {
  return categoryMetadata.find((category) => category.slug === slug)
}

export function getCollectionBySlug(slug: string): CatalogTaxonomyEntry | undefined {
  return collectionMetadata.find((collection) => collection.slug === slug)
}

/** Bir ürünün tüm varyantları tükenmiş mi (yalnızca UI etiketleme için, gerçek stok politikası OPEN #8). */
export function isProductOutOfStock(product: Product): boolean {
  return product.variants.every((variant) => variant.availability === "OUT_OF_STOCK")
}

/**
 * Kart/liste görünümünde gösterilecek fiyat aralığı. Tüm varyantlar aynı
 * fiyattaysa `min === max`; indirim varsa `hasDiscount` true döner ve
 * `displayPrice` indirimli fiyatı yansıtır.
 */
export interface PriceSummary {
  min: number
  max: number
  hasDiscount: boolean
  displayPrice: number
  compareAtPrice?: number
}

export function getPriceSummary(product: Product): PriceSummary {
  const effectivePrices = product.variants.map((v) => v.discountedPrice ?? v.price)
  const min = Math.min(...effectivePrices)
  const max = Math.max(...effectivePrices)
  const firstWithDiscount = product.variants.find((v) => v.discountedPrice !== undefined)
  return {
    min,
    max,
    hasDiscount: Boolean(firstWithDiscount),
    displayPrice: min,
    compareAtPrice: firstWithDiscount?.price,
  }
}

/** Ürünün jewelry-commerce skill'i anlamında "tek varyantlı" (seçilebilir özniteliği olmayan) olup olmadığı. */
export function isSingleVariantProduct(product: Product): boolean {
  return product.variants.length === 1 && product.variants[0].attributes.length === 0
}

/**
 * Bir üründe birden fazla değer alan (dolayısıyla müşterinin seçmesi gereken)
 * öznitelik tipleri. Yalnızca tek bir sabit değeri olan tipler (ör. her
 * varyantta aynı "materyal") burada dönmez — bunlar seçilecek bir şey değil,
 * bilgi alanıdır (bkz. `getConstantAttributes`).
 */
export function getSelectableAttributeTypes(product: Product): AttributeType[] {
  const valuesByType = new Map<AttributeType, Set<string>>()
  for (const variant of product.variants) {
    for (const attribute of variant.attributes) {
      const values = valuesByType.get(attribute.type) ?? new Set<string>()
      values.add(attribute.value)
      valuesByType.set(attribute.type, values)
    }
  }
  return Array.from(valuesByType.entries())
    .filter(([, values]) => values.size > 1)
    .map(([type]) => type)
}

/** Tüm varyantlarda aynı kalan öznitelikler — seçilmez, yalnızca bilgi olarak gösterilir. */
export function getConstantAttributes(product: Product): ProductAttribute[] {
  const selectable = new Set(getSelectableAttributeTypes(product))
  const seen = new Map<AttributeType, string>()
  for (const variant of product.variants) {
    for (const attribute of variant.attributes) {
      if (selectable.has(attribute.type)) continue
      seen.set(attribute.type, attribute.value)
    }
  }
  return Array.from(seen.entries()).map(([type, value]) => ({ type, value }))
}

/** Bir seçilebilir öznitelik tipi için mevcut tüm değerler (tekrarsız, ilk görülme sırasıyla). */
export function getAttributeOptions(product: Product, type: AttributeType): string[] {
  const values: string[] = []
  for (const variant of product.variants) {
    const match = variant.attributes.find((attribute) => attribute.type === type)
    if (match && !values.includes(match.value)) values.push(match.value)
  }
  return values
}

/**
 * Seçilen öznitelik kombinasyonuna (yalnızca `getSelectableAttributeTypes`
 * tarafından dönen tipler için) tam olarak eşleşen varyantı bulur.
 */
export function resolveVariant(
  product: Product,
  selection: Partial<Record<AttributeType, string>>
): ProductVariant | undefined {
  const selectableTypes = getSelectableAttributeTypes(product)
  return product.variants.find((variant) =>
    selectableTypes.every((type) => {
      const attribute = variant.attributes.find((a) => a.type === type)
      return attribute?.value === selection[type]
    })
  )
}

const ATTRIBUTE_TYPE_LABELS: Record<AttributeType, string> = {
  materyal: "Materyal",
  kaplama: "Kaplama",
  renk: "Renk",
  tasTuru: "Taş Türü",
  beden: "Beden",
  olcu: "Ölçü",
  zincirUzunlugu: "Zincir Uzunluğu",
}

/**
 * `AttributeType` union'ına yeni bir üye eklenirse (OPEN #4 netleştiğinde)
 * yalnızca bu tabloya bir satır eklemek yeterlidir — bilinmeyen bir tip
 * gelirse ham değeri fallback olarak gösterir, çalışma zamanında kırılmaz.
 */
export function getAttributeTypeLabel(type: AttributeType): string {
  return ATTRIBUTE_TYPE_LABELS[type] ?? type
}

export function getAvailabilityLabel(status: AvailabilityStatus): string {
  switch (status) {
    case "IN_STOCK":
      return "Stokta"
    case "LOW_STOCK":
      return "Son adet"
    case "OUT_OF_STOCK":
      return "Tükendi"
    default:
      return status
  }
}
