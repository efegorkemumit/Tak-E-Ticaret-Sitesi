/**
 * SAF (PURE) katalog görüntüleme yardımcıları — hiçbir DB/Prisma importu
 * YOK. `./catalog.ts`'ten (`../prisma`, dolayısıyla `pg`'nin Node-only
 * `net`/`tls` bağımlılıklarını içe aktarır) BİLİNÇLİ OLARAK AYRI bir dosyadır.
 *
 * Neden ayrı: storefront, bir client component'in bu dosyadaki saf
 * fonksiyonlardan birini `./catalog.ts`'ten import ettiğinde, bundler'ın
 * modülün TAMAMINI (dolayısıyla `pg`'yi) tarayıcı paketine dahil etmeye
 * çalışıp build'i kırdığını buldu. Bu dosya `./catalog`'tan yalnızca
 * `import type` (derleme zamanında tamamen silinir, hiçbir çalışma zamanı
 * maliyeti/importu yoktur) kullanır — bu yüzden client component'lerden
 * güvenle import edilebilir.
 *
 * `lib/catalog.ts` (mock, storefront'un VIDEO 05 katmanı) ile mümkün
 * olduğunca aynı imza/davranış korunmuştur.
 */
import type { CatalogProductDto, CatalogVariantDto } from "./catalog"

export { getAvailabilityLabel } from "./availability-display"
export type { AvailabilityStatus } from "./availability-display"

/** Ürünün tüm varyantları tükenmiş mi. */
export function isProductOutOfStock(product: CatalogProductDto): boolean {
  return product.variants.every((variant) => variant.availability === "OUT_OF_STOCK")
}

/**
 * Ürünün jewelry-commerce skill'i anlamında "tek varyantlı" (seçilebilir
 * özniteliği olmayan) olup olmadığı — D019 gereği her Product en az bir
 * Variant'a sahiptir, varyantsız görünen ürünler tek bir default Variant'la
 * temsil edilir.
 */
export function isSingleVariantProduct(product: CatalogProductDto): boolean {
  return product.variants.length === 1 && product.variants[0].attributes.length === 0
}

export interface CatalogPriceSummary {
  min: string
  max: string
  hasDiscount: boolean
  displayPrice: string
}

/**
 * Kart/liste görünümünde gösterilecek fiyat aralığı. Mock'un aksine
 * `discountedPrice` alanı şemada YOK (bkz. rapor — bu bir OPEN/gelecek konu),
 * bu yüzden `hasDiscount` şimdilik her zaman `false` döner; alan eklenirse bu
 * fonksiyonun yalnızca içi değişir, çağıran kod etkilenmez.
 */
export function getPriceSummary(product: CatalogProductDto): CatalogPriceSummary {
  const prices = product.variants.map((variant) => Number(variant.price))
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  return {
    min: min.toFixed(2),
    max: max.toFixed(2),
    hasDiscount: false,
    displayPrice: min.toFixed(2),
  }
}

/** Bir öznitelik tipi için mevcut tüm değerler (tekrarsız, ilk görülme sırasıyla). */
export function getAttributeOptions(product: CatalogProductDto, type: string): string[] {
  const values: string[] = []
  for (const variant of product.variants) {
    const match = variant.attributes.find((attribute) => attribute.type === type)
    if (match && !values.includes(match.value)) values.push(match.value)
  }
  return values
}

/**
 * Bir üründe birden fazla değer alan (dolayısıyla müşterinin seçmesi gereken)
 * öznitelik tipleri.
 *
 * NOT (mock'tan FARKI): Mock'ta bu, "constant vs selectable" ayrımını
 * çalışma zamanında DERİVE ediyordu. Gerçek şemada bu ayrım artık D020 ile
 * TASARIM ZAMANINDA yapılıyor (VariantAttributeValue = seçilebilir,
 * ProductAttributeValue = açıklayıcı) — yani `variant.attributes`'taki HER
 * şey zaten seçilebilir kabul edilir. Bu fonksiyon yine de faydalıdır çünkü
 * bir üründe SEÇENEKSİZ (tüm varyantlarda aynı) ama yine de
 * VariantAttributeValue olarak girilmiş bir öznitelik olması durumunda
 * (veri girişi hatası değil, meşru bir senaryo) onu picker'da göstermemeyi
 * sağlar.
 */
export function getSelectableAttributeTypes(product: CatalogProductDto): string[] {
  const valuesByType = new Map<string, Set<string>>()
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

/**
 * Seçilen öznitelik kombinasyonuna (yalnızca `getSelectableAttributeTypes`
 * tarafından dönen tipler için) tam olarak eşleşen varyantı bulur.
 */
export function resolveVariant(
  product: CatalogProductDto,
  selection: Record<string, string | undefined>
): CatalogVariantDto | undefined {
  const selectableTypes = getSelectableAttributeTypes(product)
  return product.variants.find((variant) =>
    selectableTypes.every((type) => {
      const attribute = variant.attributes.find((a) => a.type === type)
      return attribute?.value === selection[type]
    })
  )
}
