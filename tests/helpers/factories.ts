import { randomUUID } from "node:crypto"
import { testPrisma } from "./test-prisma"
import { ProductStatus } from "../../lib/generated/prisma/client"
import type { CheckoutInput } from "../../lib/commerce/checkout-schema"

/**
 * DİKKAT — YIKICI İŞLEM: hedef `TEST_DATABASE_URL`'deki commerce verisinin
 * tamamını geri döndürülemez şekilde siler. Bilinçli olarak
 * `tests/helpers/test-prisma.ts`'teki AYRI test client'ını kullanır — üretim
 * singleton'ına (`lib/prisma.ts`, `DATABASE_URL`) hiçbir zaman dokunmaz.
 *
 * Bu fonksiyonun herhangi bir ortamda güvenle çağrılabilmesi,
 * `tests/setup.ts`'teki üç katmanlı guard'ın (ALLOW_DESTRUCTIVE_TEST_DB +
 * TEST_DATABASE_URL izolasyonu + ephemeral-desen doğrulaması) zaten geçmiş
 * olmasına bağlıdır — bu dosya kendi başına ek bir güvenlik kontrolü yapmaz,
 * tüm sorumluluk `tests/setup.ts`'e devredilmiştir. Test dosyaları DIŞINDA
 * (ör. bir script veya route içinde) ASLA import edilmemeli/çağrılmamalıdır.
 */
export async function resetCommerceTables(): Promise<void> {
  // `Order` BİLE İSTEYEREK ayrıca listeleniyor: Order, Category/Collection/
  // Product/Variant/AttributeDefinition'a hiçbir FK ile bağlı değildir (yalnızca
  // OrderItem/InventoryReservation Variant'a FK verir) — bu yüzden yalnızca
  // Category/Collection/AttributeDefinition'ı TRUNCATE CASCADE etmek Order
  // tablosunu TEMİZLEMEZ (cascade yalnızca "referans eden" tablolara iner,
  // Order'a "geri" çıkmaz). Bu ayrım gözden kaçırılıp gerçek DB'ye karşı test
  // çalıştırılana kadar fark edilmemişti — testler arası veri sızıntısına yol
  // açıyordu.
  await testPrisma.$executeRawUnsafe(
    'TRUNCATE TABLE "Order", "Category", "Collection", "AttributeDefinition" RESTART IDENTITY CASCADE'
  )
}

export interface TestProduct {
  productId: string
  productSlug: string
  categorySlug: string
  variantId: string
  sku: string
  price: number
}

export async function createCategory(
  name?: string,
  description?: string
): Promise<{ id: string; slug: string; name: string; description: string | null }> {
  const unique = randomUUID().slice(0, 8)
  return testPrisma.category.create({
    data: { name: name ?? `Test Kategori ${unique}`, slug: `test-kategori-${unique}`, description },
  })
}

export async function createCollection(
  name?: string,
  description?: string
): Promise<{ id: string; slug: string; name: string; description: string | null }> {
  const unique = randomUUID().slice(0, 8)
  return testPrisma.collection.create({
    data: { name: name ?? `Test Koleksiyon ${unique}`, slug: `test-koleksiyon-${unique}`, description },
  })
}

/**
 * Minimal bir Product + tek bir Variant oluşturur (varsayılan PUBLISHED).
 * Testlerin çoğu yalnızca "gerçek, satın alınabilir bir varyant" ihtiyacı
 * duyar; bu factory o minimum kurulumu sağlar. `categoryId` verilmezse
 * kendi tek-kullanımlık kategorisini oluşturur; `collectionIds` verilirse
 * `ProductCollection` join kayıtlarını da ekler (D023 çoktan-çoğa).
 */
export async function createPublishedProductWithVariant(options: {
  stockQuantity: number
  price?: number
  status?: ProductStatus
  categoryId?: string
  collectionIds?: string[]
  careInfo?: string
  giftPackagingAvailable?: boolean
  images?: Array<{ url: string; alt: string; isPlaceholder?: boolean; sortOrder?: number }>
}): Promise<TestProduct> {
  const unique = randomUUID().slice(0, 8)
  const price = options.price ?? 100

  const category = options.categoryId
    ? await testPrisma.category.findUniqueOrThrow({ where: { id: options.categoryId } })
    : await createCategory()

  const product = await testPrisma.product.create({
    data: {
      name: `Test Ürün ${unique}`,
      slug: `test-urun-${unique}`,
      status: options.status ?? ProductStatus.PUBLISHED,
      categoryId: category.id,
      careInfo: options.careInfo,
      giftPackagingAvailable: options.giftPackagingAvailable ?? false,
      collections: options.collectionIds
        ? { create: options.collectionIds.map((collectionId) => ({ collectionId })) }
        : undefined,
      images: options.images
        ? {
            create: options.images.map((image, index) => ({
              url: image.url,
              alt: image.alt,
              isPlaceholder: image.isPlaceholder ?? true,
              sortOrder: image.sortOrder ?? index,
            })),
          }
        : undefined,
    },
  })

  const sku = `TEST-SKU-${unique}`
  const variant = await testPrisma.variant.create({
    data: {
      productId: product.id,
      sku,
      price,
      stockQuantity: options.stockQuantity,
    },
  })

  return {
    productId: product.id,
    productSlug: product.slug,
    categorySlug: category.slug,
    variantId: variant.id,
    sku,
    price,
  }
}

/**
 * Bir varyant için ACTIVE bir stok rezervasyonu simüle eder — gerçek
 * `createOrder()` akışından GEÇMEDEN, doğrudan `testPrisma` ile atılabilir
 * (throwaway) bir Order + InventoryReservation oluşturur. Amaç, availability
 * hesaplamasını (`lib/commerce/availability.ts`) izole şekilde test etmektir;
 * sipariş oluşturma akışının kendisi zaten `create-order.test.ts`'te ayrıca
 * test ediliyor.
 */
export async function createActiveReservation(variantId: string, quantity: number): Promise<void> {
  await testPrisma.order.create({
    data: {
      orderNumber: `TEST-${randomUUID().slice(0, 8)}`,
      orderIdempotencyKey: randomUUID(),
      contactFullName: "Test Müşteri",
      contactPhone: "+905550000000",
      contactEmail: "test@example.com",
      deliveryAddressLine: "Test Adres",
      deliveryCity: "İstanbul",
      deliveryDistrict: "Kadıköy",
      deliveryPostalCode: "34000",
      paymentMethod: "BANK_TRANSFER",
      subtotal: quantity * 1,
      total: quantity * 1,
      reservations: {
        create: [{ variantId, quantity, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) }],
      },
    },
  })
}

/**
 * Geçerli, minimum bir `CheckoutInput` üretir — testler yalnızca farklı
 * kıldıkları alanları override eder.
 */
export function buildCheckoutInput(overrides: Partial<CheckoutInput> & { items: CheckoutInput["items"] }): CheckoutInput {
  return {
    orderIdempotencyKey: overrides.orderIdempotencyKey ?? randomUUID(),
    items: overrides.items,
    contact: overrides.contact ?? {
      fullName: "Test Müşteri",
      phone: "+905550000000",
      email: "test@example.com",
    },
    deliveryAddress: overrides.deliveryAddress ?? {
      addressLine: "Test Mahallesi Test Sokak No:1",
      city: "İstanbul",
      district: "Kadıköy",
      postalCode: "34000",
      country: "TR",
    },
    giftPackagingSelected: overrides.giftPackagingSelected ?? false,
    paymentMethod: overrides.paymentMethod ?? "BANK_TRANSFER",
  }
}
