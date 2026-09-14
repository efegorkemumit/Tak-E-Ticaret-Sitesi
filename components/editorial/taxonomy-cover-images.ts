/**
 * VIDEO 08 STEP 2 (part 2) — kategori/koleksiyon kapak görselleri. Bilinçli
 * olarak `lib/**`'te DEĞİL burada: `CatalogTaxonomyDto`'da (`lib/commerce/
 * catalog.ts`) bir görsel alanı YOK — Category/Collection modelinin kendisi
 * görsel taşımıyor (yalnızca `Product`/`ProductImage` taşır, D012/D013). Bu
 * yüzden kapak görselleri DB-güdümlü değil, tamamen sunum katmanına ait,
 * team lead'in kesinleştirdiği statik bir eşleşmedir — yeni bir commerce
 * alanı/özelliği İCAT EDİLMEDİ.
 *
 * Eşleşmedeki her dosya `public/images/`'te gerçekten var (bkz. görev
 * talimatı) — bu listenin dışında yeni bir görsel üretilmedi/indirilmedi.
 */
const CATEGORY_COVER_IMAGES: Record<string, string> = {
  kolye: "/images/kolye_gercek_04.webp",
  yuzuk: "/images/yuzuk_gercek_12.webp",
  kupe: "/images/kupe_gercek_08.webp",
}

const COLLECTION_COVER_IMAGES: Record<string, string> = {
  "gunluk-koleksiyonu": "/images/kolye_gercek_04.webp",
  // Team lead'in geri aldığı karar: `yuzuk_gercek_11.webp` (brand-ui'nin
  // "bridal/çoklu ürün" gerekçesiyle reddettiği görsel) koyu/moody zemini ve
  // bridal estetiğiyle sitenin geri kalanının açık/nötr tonuyla çelişiyordu.
  // `yuzuk_gercek_12.webp` ile paylaşılıyor (Yüzük kategorisiyle aynı) —
  // yalnızca 6 kullanılabilir görselle bu paylaşım kaçınılmazdı.
  "hediyelik-koleksiyonu": "/images/yuzuk_gercek_12.webp",
}

/** Eşleşme yoksa `null` döner — çağıran taraf placeholder'a düşmelidir, boş/kırık görsel YOK. */
function getCategoryCoverImage(slug: string): string | null {
  return CATEGORY_COVER_IMAGES[slug] ?? null
}

function getCollectionCoverImage(slug: string): string | null {
  return COLLECTION_COVER_IMAGES[slug] ?? null
}

export { getCategoryCoverImage, getCollectionCoverImage }
