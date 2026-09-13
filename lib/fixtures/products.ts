/**
 * DEVELOPMENT FIXTURE — gerçek müşteri ürünü değildir, commerce motoru kurulunca kaldırılacaktır.
 *
 * Bu dosya, storefront'un gerçek bir Prisma/commerce backend'i olmadan geliştirmeye devam
 * edebilmesi için hazırlanmış statik mock veridir. Hiçbir gerçek ürün, gerçek görsel veya
 * gerçek stok/sipariş mantığı içermez.
 *
 * Kaynak: storefront ↔ commerce contract alignment turunda mutabık kalınan veri kontratı
 * (bkz. bu oturumun geçmişi — Product/Variant alan listesi) ve `.claude/skills/jewelry-commerce`
 * skill'i.
 *
 * Bilinçli sınırlar (OPEN kararları kilitlemez):
 * - Kategori/koleksiyon değerleri (`docs/OPEN_QUESTIONS.md` #3) yalnızca örnektir, kesin liste değildir.
 * - Varyant öznitelikleri (`#4`) tamamen opsiyonel/dinamiktir; `attributes` dizisi ürüne göre
 *   değişir, sabit bir alan seti dayatılmaz.
 * - `availability` gerçek bir stok adedi DEĞİLDİR — stok düşme/rezervasyon politikası
 *   (`#8`, `docs/DECISIONS.md` D016) henüz kesinleşmediği için yalnızca jenerik bir durumdur.
 * - `images[].isRealProductPhoto` her zaman `false`'tur; bu, ürün kartı/detayında yalnızca
 *   gerçek ürün fotoğrafı kullanılması kuralının (D012) ihlal edilmemesi içindir — placeholder
 *   görsel gerçek bir ürün fotoğrafı gibi SUNULMAZ, storefront bu bayrağı bir UI guard'ı
 *   olarak kullanmalıdır (ör. gerçek görsel gelene kadar nötr bir placeholder/silhouette render etmek).
 * - Hediye paketinin checkout'a etkisi (ücret vb.) hâlâ OPEN olduğu için `giftPackagingAvailable`
 *   yalnızca seçimin var olup olmadığını belirtir, herhangi bir ücretlendirme alanı taşımaz.
 */

export type AttributeType =
  | "materyal"
  | "kaplama"
  | "renk"
  | "tasTuru"
  | "beden"
  | "olcu"
  | "zincirUzunlugu"

/**
 * Varyant özniteliği: `type` alanı sabit bir enum'a kilitlenmez, storefront'un
 * VariantSelector'ı bu diziyi dinamik/generic render eder — bir üründe hangi
 * öznitelik yoksa hiç görünmez.
 */
export interface ProductAttribute {
  type: AttributeType
  value: string
}

/**
 * Gerçek stok adedi değil, jenerik bir durumdur (bkz. dosya başı not).
 */
export type AvailabilityStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK"

export interface ProductVariant {
  id: string
  sku: string
  attributes: ProductAttribute[]
  price: number
  discountedPrice?: number
  availability: AvailabilityStatus
}

export interface ProductImage {
  url: string
  /** Her zaman false — bu fixture'da hiçbir gerçek ürün fotoğrafı yoktur (bkz. D012). */
  isRealProductPhoto: boolean
}

export interface Product {
  id: string
  slug: string
  name: string
  /** Örnek kategori string'leri — kesin liste OPEN #3. */
  categories: string[]
  /** Örnek koleksiyon string'leri — bir ürün birden fazla koleksiyonda yer alabilir. */
  collections: string[]
  images: ProductImage[]
  careInfo: string
  giftPackagingAvailable: boolean
  variants: ProductVariant[]
}

const GENERIC_SILVER_CARE_INFO =
  "Su, parfüm, losyon ve kimyasallarla temastan kaçının. Kullanmadığınızda kapalı bir kutu " +
  "veya kese içinde saklayın. Yumuşak bir bezle nazikçe temizleyin, aşındırıcı madde kullanmayın."

const PLACEHOLDER_IMAGE: ProductImage = {
  url: "/fixtures/placeholder-jewelry.svg",
  isRealProductPhoto: false,
}

export const sampleProducts: Product[] = [
  {
    id: "demo-001",
    slug: "ornek-gumus-yuzuk",
    name: "Örnek Gümüş Yüzük",
    categories: ["yuzuk"],
    collections: ["gunluk-koleksiyonu"],
    images: [PLACEHOLDER_IMAGE],
    careInfo: GENERIC_SILVER_CARE_INFO,
    giftPackagingAvailable: false,
    variants: [
      {
        id: "demo-001-v1",
        sku: "DEMO-YUZ-001-14",
        attributes: [
          { type: "materyal", value: "Gümüş" },
          { type: "beden", value: "14" },
        ],
        price: 450,
        availability: "IN_STOCK",
      },
      {
        id: "demo-001-v2",
        sku: "DEMO-YUZ-001-16",
        attributes: [
          { type: "materyal", value: "Gümüş" },
          { type: "beden", value: "16" },
        ],
        price: 450,
        availability: "LOW_STOCK",
      },
    ],
  },
  {
    id: "demo-002",
    slug: "ornek-gumus-zirkon-tasli-yuzuk",
    name: "Örnek Gümüş Zirkon Taşlı Yüzük",
    categories: ["yuzuk"],
    collections: ["gunluk-koleksiyonu", "hediyelik-koleksiyonu"],
    images: [PLACEHOLDER_IMAGE],
    careInfo: GENERIC_SILVER_CARE_INFO,
    giftPackagingAvailable: true,
    variants: [
      {
        id: "demo-002-v1",
        sku: "DEMO-YUZ-002-16",
        attributes: [
          { type: "materyal", value: "Gümüş" },
          { type: "tasTuru", value: "Zirkon" },
          { type: "beden", value: "16" },
        ],
        price: 620,
        discountedPrice: 550,
        availability: "IN_STOCK",
      },
      {
        id: "demo-002-v2",
        sku: "DEMO-YUZ-002-18",
        attributes: [
          { type: "materyal", value: "Gümüş" },
          { type: "tasTuru", value: "Zirkon" },
          { type: "beden", value: "18" },
        ],
        price: 620,
        discountedPrice: 550,
        availability: "OUT_OF_STOCK",
      },
    ],
  },
  {
    id: "demo-003",
    slug: "ornek-gumus-kolye",
    name: "Örnek Gümüş Kolye",
    categories: ["kolye"],
    collections: ["gunluk-koleksiyonu"],
    images: [PLACEHOLDER_IMAGE],
    careInfo: GENERIC_SILVER_CARE_INFO,
    giftPackagingAvailable: false,
    variants: [
      {
        id: "demo-003-v1",
        sku: "DEMO-KOL-003-45",
        attributes: [
          { type: "materyal", value: "Gümüş" },
          { type: "zincirUzunlugu", value: "45 cm" },
        ],
        price: 520,
        availability: "IN_STOCK",
      },
    ],
  },
  {
    id: "demo-004",
    slug: "ornek-gumus-inci-kolye",
    name: "Örnek Gümüş İnci Kolye",
    categories: ["kolye"],
    collections: ["hediyelik-koleksiyonu"],
    images: [PLACEHOLDER_IMAGE],
    careInfo: GENERIC_SILVER_CARE_INFO,
    giftPackagingAvailable: true,
    variants: [
      {
        id: "demo-004-v1",
        sku: "DEMO-KOL-004-40-45",
        attributes: [
          { type: "materyal", value: "Gümüş" },
          { type: "tasTuru", value: "İnci" },
          { type: "zincirUzunlugu", value: "40-45 cm ayarlanabilir" },
        ],
        price: 780,
        availability: "LOW_STOCK",
      },
    ],
  },
  {
    id: "demo-005",
    slug: "ornek-gumus-bileklik",
    name: "Örnek Gümüş Bileklik",
    categories: ["bileklik"],
    collections: ["gunluk-koleksiyonu"],
    images: [PLACEHOLDER_IMAGE],
    careInfo: GENERIC_SILVER_CARE_INFO,
    giftPackagingAvailable: false,
    variants: [
      {
        id: "demo-005-v1",
        sku: "DEMO-BIL-005-tek-olcu",
        attributes: [
          { type: "materyal", value: "Gümüş" },
          { type: "olcu", value: "16-19 cm ayarlanabilir" },
        ],
        price: 390,
        availability: "IN_STOCK",
      },
    ],
  },
  {
    id: "demo-006",
    slug: "ornek-gumus-akik-tasli-kupe",
    name: "Örnek Gümüş Akik Taşlı Küpe",
    categories: ["kupe"],
    collections: ["hediyelik-koleksiyonu"],
    images: [PLACEHOLDER_IMAGE],
    careInfo: GENERIC_SILVER_CARE_INFO,
    giftPackagingAvailable: true,
    variants: [
      {
        id: "demo-006-v1",
        sku: "DEMO-KUP-006",
        attributes: [
          { type: "materyal", value: "Gümüş" },
          { type: "tasTuru", value: "Akik" },
        ],
        price: 340,
        availability: "IN_STOCK",
      },
    ],
  },
  // NOT: demo-002'de (Zirkon Taşlı Yüzük) zaten aynı ürün içinde karışık availability
  // var (v1 IN_STOCK, v2 OUT_OF_STOCK) — AttributeButtonGroup'un "seçilebilir ama
  // devre dışı" state'i onunla da test edilebilir. Aşağıdaki demo-007, storefront'un
  // istediği "tek varyantlı, hiç seçilebilir özniteliği olmayan basit ürün" senaryosu
  // için eklendi (jewelry-commerce skill'indeki "varyantsız ürün = tek varyantlı ürün"
  // ilkesiyle tutarlı) — VariantSelector burada hiç render edilmemeli, doğrudan
  // "sepete ekle" durumu test edilebilir.
  {
    id: "demo-007",
    slug: "ornek-gumus-zincir-bileklik-tek-olcu",
    name: "Örnek Gümüş Zincir Bileklik",
    categories: ["bileklik"],
    collections: ["gunluk-koleksiyonu"],
    images: [PLACEHOLDER_IMAGE],
    careInfo: GENERIC_SILVER_CARE_INFO,
    giftPackagingAvailable: false,
    variants: [
      {
        id: "demo-007-v1",
        sku: "DEMO-BIL-007",
        attributes: [],
        price: 310,
        availability: "IN_STOCK",
      },
    ],
  },
]
