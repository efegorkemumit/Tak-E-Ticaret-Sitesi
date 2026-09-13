/**
 * DEVELOPMENT FIXTURE — gerçek kategori/koleksiyon kaydı değildir, commerce
 * motoru (admin panelinden yönetilen kategori/koleksiyon CRUD'u) kurulunca
 * kaldırılacaktır.
 *
 * `lib/fixtures/products.ts` içindeki `Product.categories`/`Product.collections`
 * alanları yalnızca slug string'i taşır; bu dosya o slug'lara karşılık gelen
 * görüntülenecek ad/açıklamayı sağlar (storefront'un kendi geliştirme ihtiyacı,
 * commerce'in fixture'ının bir parçası değildir).
 *
 * Bilinçli sınır: kesin ürün kategorileri henüz OPEN'dır (`docs/OPEN_QUESTIONS.md`
 * #3) — buradaki isimler yalnızca `jewelry-commerce` skill'indeki sektör
 * örnekleriyle tutarlı, geçici örneklerdir; gerçek kategori listesi değildir.
 */

export interface CatalogTaxonomyEntry {
  slug: string
  name: string
  description: string
}

export const categoryMetadata: CatalogTaxonomyEntry[] = [
  {
    slug: "yuzuk",
    name: "Yüzük",
    description: "Günlük kullanım ve özel anlar için gümüş yüzük modelleri.",
  },
  {
    slug: "kolye",
    name: "Kolye",
    description: "İnce zincirli ve taşlı gümüş kolye modelleri.",
  },
  {
    slug: "bileklik",
    name: "Bileklik",
    description: "Ayarlanabilir ve sabit ölçülü gümüş bileklikler.",
  },
  {
    slug: "kupe",
    name: "Küpe",
    description: "Sade ve taşlı gümüş küpe modelleri.",
  },
]

export const collectionMetadata: CatalogTaxonomyEntry[] = [
  {
    slug: "gunluk-koleksiyonu",
    name: "Günlük Koleksiyonu",
    description: "Her gün rahatlıkla kullanılabilecek sade, dayanıklı parçalar.",
  },
  {
    slug: "hediyelik-koleksiyonu",
    name: "Hediyelik Koleksiyonu",
    description: "Özel günler için seçilmiş, hediye paketleme seçeneği sunulan parçalar.",
  },
]
