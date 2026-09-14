/**
 * DEVELOPMENT SEED — gerçek müşteri katalog verisi DEĞİLDİR.
 *
 * `lib/fixtures/products.ts` (storefront'un mock veriyle çalıştığı dosya)
 * ile KARIŞTIRILMAMALIDIR — bu dosya gerçek PostgreSQL veritabanına, gerçek
 * şema üzerinden (D018-D023) birkaç açıkça DEMO satır yazar. Amaç, admin
 * panel/API/storefront'un gerçek-DB katalog read layer'ı (`lib/commerce/catalog.ts`)
 * geliştirmesi sırasında test edilebilir minimal bir veri kümesi sağlamaktır;
 * gerçek ürünmüş gibi sunulmaz (isimler açıkça "Örnek ..." öneki taşır).
 *
 * Çalıştırma: `npx prisma db seed` (bkz. `prisma7.config.ts` → migrations.seed)
 *
 * Idempotent: tüm kayıtlar `upsert` ile oluşturulur, script birden fazla kez
 * çalıştırılabilir.
 */
import "dotenv/config"
import { PrismaClient } from "../lib/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

// Prisma 7'nin yeni client generator'ı ("prisma-client") artık DATABASE_URL'i
// örtük kullanmıyor; bağlantı açıkça bir sürücü adaptörü üzerinden verilir
// (bkz. `.claude/skills/prisma-database-setup/references/postgresql.md`).
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

// jewelry-commerce skill'indeki genel bakım kalıplarından — ürüne özgü
// doğrulanmamış bir iddia YOK, `lib/fixtures/products.ts`'teki mock'la aynı
// metin (tutarlılık için).
const GENERIC_SILVER_CARE_INFO =
  "Su, parfüm, losyon ve kimyasallarla temastan kaçının. Kullanmadığınızda kapalı bir kutu " +
  "veya kese içinde saklayın. Yumuşak bir bezle nazikçe temizleyin, aşındırıcı madde kullanmayın."

// Storefront'un daha önce oluşturduğu, elle çizilmiş soyut placeholder SVG —
// hiçbir zaman gerçek ürün fotoğrafı gibi sunulmaz (`isPlaceholder: true`,
// D012).
const PLACEHOLDER_IMAGE_URL = "/fixtures/placeholder-jewelry.svg"

async function main() {
  // --- Category (D023 — Product tekil FK) -----------------------------------
  const ringCategory = await prisma.category.upsert({
    where: { slug: "yuzuk" },
    update: { description: "Günlük kullanım ve özel anlar için gümüş yüzük modelleri." },
    create: {
      name: "Yüzük",
      slug: "yuzuk",
      description: "Günlük kullanım ve özel anlar için gümüş yüzük modelleri.",
    },
  })

  const necklaceCategory = await prisma.category.upsert({
    where: { slug: "kolye" },
    update: { description: "İnce zincirli ve taşlı gümüş kolye modelleri." },
    create: {
      name: "Kolye",
      slug: "kolye",
      description: "İnce zincirli ve taşlı gümüş kolye modelleri.",
    },
  })

  const earringCategory = await prisma.category.upsert({
    where: { slug: "kupe" },
    update: { description: "Sade ve taşlı gümüş küpe modelleri." },
    create: {
      name: "Küpe",
      slug: "kupe",
      description: "Sade ve taşlı gümüş küpe modelleri.",
    },
  })

  // --- Collection (D023 — Product çoktan-çoğa) -------------------------------
  // Slug'lar `lib/fixtures/catalog-metadata.ts`'teki (storefront'un VIDEO 05
  // mock'u) isimlerle tutarlı tutuldu, ama bu OPEN #3'ü kilitlemez — yalnızca
  // bu geliştirme dalgasının ihtiyacı kadar örnek.
  const dailyCollection = await prisma.collection.upsert({
    where: { slug: "gunluk-koleksiyonu" },
    update: { description: "Her gün rahatlıkla kullanılabilecek sade, dayanıklı parçalar." },
    create: {
      name: "Günlük Koleksiyonu",
      slug: "gunluk-koleksiyonu",
      description: "Her gün rahatlıkla kullanılabilecek sade, dayanıklı parçalar.",
    },
  })

  const giftCollection = await prisma.collection.upsert({
    where: { slug: "hediyelik-koleksiyonu" },
    update: { description: "Özel günler için seçilmiş, hediye paketleme seçeneği sunulan parçalar." },
    create: {
      name: "Hediyelik Koleksiyonu",
      slug: "hediyelik-koleksiyonu",
      description: "Özel günler için seçilmiş, hediye paketleme seçeneği sunulan parçalar.",
    },
  })

  // --- AttributeDefinition / AttributeValue (D020, esnek — OPEN #4'ü kilitlemez) ---
  const materyal = await prisma.attributeDefinition.upsert({
    where: { key: "materyal" },
    update: {},
    create: { key: "materyal", label: "Materyal" },
  })
  const beden = await prisma.attributeDefinition.upsert({
    where: { key: "beden" },
    update: {},
    create: { key: "beden", label: "Beden" },
  })
  const tasTuru = await prisma.attributeDefinition.upsert({
    where: { key: "tasTuru" },
    update: {},
    create: { key: "tasTuru", label: "Taş Türü" },
  })

  const gumus = await prisma.attributeValue.upsert({
    where: { attributeDefinitionId_value: { attributeDefinitionId: materyal.id, value: "Gümüş" } },
    update: {},
    create: { attributeDefinitionId: materyal.id, value: "Gümüş" },
  })
  const beden16 = await prisma.attributeValue.upsert({
    where: { attributeDefinitionId_value: { attributeDefinitionId: beden.id, value: "16" } },
    update: {},
    create: { attributeDefinitionId: beden.id, value: "16" },
  })
  const beden18 = await prisma.attributeValue.upsert({
    where: { attributeDefinitionId_value: { attributeDefinitionId: beden.id, value: "18" } },
    update: {},
    create: { attributeDefinitionId: beden.id, value: "18" },
  })
  const zirkon = await prisma.attributeValue.upsert({
    where: { attributeDefinitionId_value: { attributeDefinitionId: tasTuru.id, value: "Zirkon" } },
    update: {},
    create: { attributeDefinitionId: tasTuru.id, value: "Zirkon" },
  })
  const inci = await prisma.attributeValue.upsert({
    where: { attributeDefinitionId_value: { attributeDefinitionId: tasTuru.id, value: "İnci" } },
    update: {},
    create: { attributeDefinitionId: tasTuru.id, value: "İnci" },
  })
  const akik = await prisma.attributeValue.upsert({
    where: { attributeDefinitionId_value: { attributeDefinitionId: tasTuru.id, value: "Akik" } },
    update: {},
    create: { attributeDefinitionId: tasTuru.id, value: "Akik" },
  })

  // --- Product 1: tek varyantlı olmayan, iki beden seçeneği (D019) ----------
  const ring = await prisma.product.upsert({
    where: { slug: "ornek-gumus-yuzuk" },
    update: { careInfo: GENERIC_SILVER_CARE_INFO, giftPackagingAvailable: false },
    create: {
      name: "Örnek Gümüş Yüzük",
      slug: "ornek-gumus-yuzuk",
      description: "DEMO — geliştirme amaçlı örnek ürün, gerçek katalog verisi değildir.",
      status: "PUBLISHED",
      categoryId: ringCategory.id,
      careInfo: GENERIC_SILVER_CARE_INFO,
      // Günlük kullanım ürünü — hediye paketi seçeneği sunulmuyor (fixture'daki
      // örüntüyle tutarlı, bir iş kararı değil, yalnızca DEMO çeşitliliği).
      giftPackagingAvailable: false,
    },
  })
  await prisma.productImage.upsert({
    where: { productId_sortOrder: { productId: ring.id, sortOrder: 0 } },
    update: {},
    create: {
      productId: ring.id,
      url: PLACEHOLDER_IMAGE_URL,
      alt: "Örnek Gümüş Yüzük — örnek/placeholder görsel",
      isPlaceholder: true,
      sortOrder: 0,
    },
  })

  for (const [sku, sizeValue, stock] of [
    ["DEMO-YUZ-001-16", beden16, 5],
    ["DEMO-YUZ-001-18", beden18, 0],
  ] as const) {
    const variant = await prisma.variant.upsert({
      where: { sku },
      update: {},
      create: {
        productId: ring.id,
        sku,
        price: "450.00",
        stockQuantity: stock,
      },
    })
    await prisma.variantAttributeValue.upsert({
      where: { variantId_attributeDefinitionId: { variantId: variant.id, attributeDefinitionId: materyal.id } },
      update: {},
      create: { variantId: variant.id, attributeDefinitionId: materyal.id, attributeValueId: gumus.id },
    })
    await prisma.variantAttributeValue.upsert({
      where: { variantId_attributeDefinitionId: { variantId: variant.id, attributeDefinitionId: beden.id } },
      update: {},
      create: { variantId: variant.id, attributeDefinitionId: beden.id, attributeValueId: sizeValue.id },
    })
  }

  await prisma.productCollection.upsert({
    where: { productId_collectionId: { productId: ring.id, collectionId: dailyCollection.id } },
    update: {},
    create: { productId: ring.id, collectionId: dailyCollection.id },
  })

  // --- Product 2: açıklayıcı öznitelikte birden fazla değer (D020) ---------
  const necklace = await prisma.product.upsert({
    where: { slug: "ornek-gumus-zirkon-inci-kolye" },
    update: { careInfo: GENERIC_SILVER_CARE_INFO, giftPackagingAvailable: true },
    create: {
      name: "Örnek Gümüş Zirkon ve İnci Kolye",
      slug: "ornek-gumus-zirkon-inci-kolye",
      description: "DEMO — geliştirme amaçlı örnek ürün, gerçek katalog verisi değildir.",
      status: "PUBLISHED",
      categoryId: necklaceCategory.id,
      careInfo: GENERIC_SILVER_CARE_INFO,
      // Hediyelik koleksiyonunda — hediye paketi seçeneği sunuluyor.
      giftPackagingAvailable: true,
      // D020: Bu ürün fiziksel olarak hem Zirkon hem İnci taşıyor — bu,
      // Variant'ın seçilebilir (tekil) taş türü özniteliğinden FARKLI olarak,
      // Product seviyesinde birden fazla satır alabilen açıklayıcı bilgidir.
      descriptiveAttributes: {
        create: [
          { attributeDefinitionId: tasTuru.id, attributeValueId: zirkon.id },
          { attributeDefinitionId: tasTuru.id, attributeValueId: inci.id },
        ],
      },
    },
  })
  await prisma.productImage.upsert({
    where: { productId_sortOrder: { productId: necklace.id, sortOrder: 0 } },
    update: {},
    create: {
      productId: necklace.id,
      url: PLACEHOLDER_IMAGE_URL,
      alt: "Örnek Gümüş Zirkon ve İnci Kolye — örnek/placeholder görsel",
      isPlaceholder: true,
      sortOrder: 0,
    },
  })

  const necklaceVariant = await prisma.variant.upsert({
    where: { sku: "DEMO-KOL-002" },
    update: {},
    create: {
      productId: necklace.id,
      sku: "DEMO-KOL-002",
      price: "780.00",
      stockQuantity: 3,
    },
  })
  await prisma.variantAttributeValue.upsert({
    where: {
      variantId_attributeDefinitionId: { variantId: necklaceVariant.id, attributeDefinitionId: materyal.id },
    },
    update: {},
    create: { variantId: necklaceVariant.id, attributeDefinitionId: materyal.id, attributeValueId: gumus.id },
  })

  await prisma.productCollection.upsert({
    where: { productId_collectionId: { productId: necklace.id, collectionId: giftCollection.id } },
    update: {},
    create: { productId: necklace.id, collectionId: giftCollection.id },
  })

  // --- Product 3: küpe — seçilebilir taş türü öznitelikli, tek varyant ------
  const earring = await prisma.product.upsert({
    where: { slug: "ornek-gumus-akik-kupe" },
    update: { careInfo: GENERIC_SILVER_CARE_INFO, giftPackagingAvailable: true },
    create: {
      name: "Örnek Gümüş Akik Küpe",
      slug: "ornek-gumus-akik-kupe",
      description: "DEMO — geliştirme amaçlı örnek ürün, gerçek katalog verisi değildir.",
      status: "PUBLISHED",
      categoryId: earringCategory.id,
      careInfo: GENERIC_SILVER_CARE_INFO,
      giftPackagingAvailable: true,
    },
  })
  await prisma.productImage.upsert({
    where: { productId_sortOrder: { productId: earring.id, sortOrder: 0 } },
    update: {},
    create: {
      productId: earring.id,
      url: PLACEHOLDER_IMAGE_URL,
      alt: "Örnek Gümüş Akik Küpe — örnek/placeholder görsel",
      isPlaceholder: true,
      sortOrder: 0,
    },
  })

  const earringVariant = await prisma.variant.upsert({
    where: { sku: "DEMO-KUP-003" },
    update: {},
    create: {
      productId: earring.id,
      sku: "DEMO-KUP-003",
      price: "340.00",
      stockQuantity: 8,
    },
  })
  await prisma.variantAttributeValue.upsert({
    where: {
      variantId_attributeDefinitionId: { variantId: earringVariant.id, attributeDefinitionId: materyal.id },
    },
    update: {},
    create: { variantId: earringVariant.id, attributeDefinitionId: materyal.id, attributeValueId: gumus.id },
  })
  await prisma.variantAttributeValue.upsert({
    where: {
      variantId_attributeDefinitionId: { variantId: earringVariant.id, attributeDefinitionId: tasTuru.id },
    },
    update: {},
    create: { variantId: earringVariant.id, attributeDefinitionId: tasTuru.id, attributeValueId: akik.id },
  })

  // Küpe, D023'ün çoktan-çoğa doğasını göstermek için HER İKİ koleksiyonda da yer alıyor.
  await prisma.productCollection.upsert({
    where: { productId_collectionId: { productId: earring.id, collectionId: dailyCollection.id } },
    update: {},
    create: { productId: earring.id, collectionId: dailyCollection.id },
  })
  await prisma.productCollection.upsert({
    where: { productId_collectionId: { productId: earring.id, collectionId: giftCollection.id } },
    update: {},
    create: { productId: earring.id, collectionId: giftCollection.id },
  })

  // --- Doğrulama ürünleri: D021'in (görünürlük stoktan bağımsız) storefront
  // tarafında gerçekten uygulandığını manuel/smoke test ile görebilmek için.
  // İkisi de PUBLISHED OLMADIĞI için hiçbir listeleme sayfasında görünmemeli ve
  // slug'ları bilinse bile ürün detayında 404 dönmelidir.
  const draftProduct = await prisma.product.upsert({
    where: { slug: "demo-draft-gumus-yuzuk" },
    update: { status: "DRAFT" },
    create: {
      name: "DEMO Taslak Gümüş Yüzük (DRAFT — görünmemeli)",
      slug: "demo-draft-gumus-yuzuk",
      description: "DEMO — D021 doğrulaması için DRAFT durumunda bırakılmış örnek ürün.",
      status: "DRAFT",
      categoryId: ringCategory.id,
      careInfo: GENERIC_SILVER_CARE_INFO,
    },
  })
  await prisma.variant.upsert({
    where: { sku: "DEMO-DRAFT-001" },
    update: {},
    create: { productId: draftProduct.id, sku: "DEMO-DRAFT-001", price: "500.00", stockQuantity: 5 },
  })

  const archivedProduct = await prisma.product.upsert({
    where: { slug: "demo-arsiv-gumus-kolye" },
    update: { status: "ARCHIVED" },
    create: {
      name: "DEMO Arşivlenmiş Gümüş Kolye (ARCHIVED — görünmemeli)",
      slug: "demo-arsiv-gumus-kolye",
      description: "DEMO — D021 doğrulaması için ARCHIVED durumunda bırakılmış örnek ürün.",
      status: "ARCHIVED",
      categoryId: necklaceCategory.id,
      careInfo: GENERIC_SILVER_CARE_INFO,
    },
  })
  await prisma.variant.upsert({
    where: { sku: "DEMO-ARCHIVED-001" },
    update: {},
    create: { productId: archivedProduct.id, sku: "DEMO-ARCHIVED-001", price: "600.00", stockQuantity: 5 },
  })

  console.log("Development seed tamamlandı (DEMO veri):", {
    categories: [ringCategory.slug, necklaceCategory.slug, earringCategory.slug],
    collections: [dailyCollection.slug, giftCollection.slug],
    published: [ring.slug, necklace.slug, earring.slug],
    dogrulama: [`${draftProduct.slug} (DRAFT)`, `${archivedProduct.slug} (ARCHIVED)`],
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
