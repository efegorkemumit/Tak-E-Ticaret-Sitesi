import { beforeEach, describe, expect, it } from "vitest"
import { testPrisma } from "../helpers/test-prisma"
import { ProductStatus } from "../../lib/generated/prisma/client"
import {
  getCategories,
  getCategoryBySlug,
  getCollectionBySlug,
  getCollections,
  getProductBySlug,
  getProductsByCategorySlug,
  getProductsByCollectionSlug,
  getPublishedProducts,
} from "../../lib/commerce/catalog"
import {
  createActiveReservation,
  createCategory,
  createCollection,
  createPublishedProductWithVariant,
  resetCommerceTables,
} from "../helpers/factories"

beforeEach(async () => {
  await resetCommerceTables()
})

describe("catalog read layer — D021 yayın durumu", () => {
  it("getPublishedProducts yalnızca PUBLISHED ürünleri döner", async () => {
    const published = await createPublishedProductWithVariant({ stockQuantity: 5 })
    await createPublishedProductWithVariant({ stockQuantity: 5, status: ProductStatus.DRAFT })
    await createPublishedProductWithVariant({ stockQuantity: 5, status: ProductStatus.ARCHIVED })

    const products = await getPublishedProducts(testPrisma)

    expect(products).toHaveLength(1)
    expect(products[0].slug).toBe(published.productSlug)
  })

  it("getProductBySlug, slug bilinse bile DRAFT/ARCHIVED ürün için null döner", async () => {
    const draft = await createPublishedProductWithVariant({ stockQuantity: 5, status: ProductStatus.DRAFT })
    const archived = await createPublishedProductWithVariant({ stockQuantity: 5, status: ProductStatus.ARCHIVED })

    expect(await getProductBySlug(draft.productSlug, testPrisma)).toBeNull()
    expect(await getProductBySlug(archived.productSlug, testPrisma)).toBeNull()
  })

  it("getProductBySlug, PUBLISHED bir ürün için tam DTO döner (Decimal string, ham Prisma tipi yok)", async () => {
    const { productSlug, sku, categorySlug } = await createPublishedProductWithVariant({
      stockQuantity: 5,
      price: 199.9,
    })

    const product = await getProductBySlug(productSlug, testPrisma)

    expect(product).not.toBeNull()
    expect(product!.categorySlug).toBe(categorySlug)
    expect(product!.variants).toHaveLength(1)
    expect(product!.variants[0].sku).toBe(sku)
    expect(product!.variants[0].price).toBe("199.90")
    expect(typeof product!.variants[0].price).toBe("string")
  })

  it("getProductBySlug, careInfo/giftPackagingAvailable/images alanlarını doğru döner", async () => {
    const { productSlug } = await createPublishedProductWithVariant({
      stockQuantity: 5,
      careInfo: "Test bakım bilgisi.",
      giftPackagingAvailable: true,
      images: [
        { url: "/a.svg", alt: "İkinci sırada", isPlaceholder: true, sortOrder: 1 },
        { url: "/b.svg", alt: "İlk sırada", isPlaceholder: false, sortOrder: 0 },
      ],
    })

    const product = await getProductBySlug(productSlug, testPrisma)

    expect(product!.careInfo).toBe("Test bakım bilgisi.")
    expect(product!.giftPackagingAvailable).toBe(true)
    // `sortOrder` sırasına göre dönmeli (0 önce).
    expect(product!.images).toEqual([
      { url: "/b.svg", alt: "İlk sırada", isPlaceholder: false },
      { url: "/a.svg", alt: "İkinci sırada", isPlaceholder: true },
    ])
  })

  it("getProductBySlug, careInfo/images verilmemişse null/boş dizi döner (opsiyonel alanlar)", async () => {
    const { productSlug } = await createPublishedProductWithVariant({ stockQuantity: 5 })

    const product = await getProductBySlug(productSlug, testPrisma)

    expect(product!.careInfo).toBeNull()
    expect(product!.giftPackagingAvailable).toBe(false)
    expect(product!.images).toEqual([])
  })
})

describe("catalog read layer — availability (D018 formülüyle tutarlı)", () => {
  it("hiç aktif rezervasyon yoksa stockQuantity kadar kullanılabilir (IN_STOCK)", async () => {
    const { productSlug } = await createPublishedProductWithVariant({ stockQuantity: 10 })

    const product = await getProductBySlug(productSlug, testPrisma)

    expect(product!.variants[0].availability).toBe("IN_STOCK")
    expect(product!.variants[0].availableQuantity).toBe(10)
  })

  it("ACTIVE rezervasyon kullanılabilir stoğu düşürür (LOW_STOCK/OUT_OF_STOCK eşiği)", async () => {
    const { productSlug, variantId } = await createPublishedProductWithVariant({ stockQuantity: 5 })
    // Kullanılabilir: 5 - 3 = 2 → LOW_STOCK eşiği (<=3) içinde.
    await createActiveReservation(variantId, 3)

    const product = await getProductBySlug(productSlug, testPrisma)
    expect(product!.variants[0].availability).toBe("LOW_STOCK")
    expect(product!.variants[0].availableQuantity).toBe(2)
  })

  it("ACTIVE rezervasyon toplamı stoğa eşit/fazlaysa OUT_OF_STOCK", async () => {
    const { productSlug, variantId } = await createPublishedProductWithVariant({ stockQuantity: 2 })
    await createActiveReservation(variantId, 2)

    const product = await getProductBySlug(productSlug, testPrisma)
    expect(product!.variants[0].availability).toBe("OUT_OF_STOCK")

    // Ham stok (Variant.stockQuantity) rezervasyon anında AZALTILMAMIŞ olmalı
    // (D018 — ledger yaklaşımı) — DB'den doğrudan doğrula.
    const rawVariant = await testPrisma.variant.findUniqueOrThrow({ where: { id: variantId } })
    expect(rawVariant.stockQuantity).toBe(2)
  })
})

describe("catalog read layer — kategori/koleksiyon filtreleme (D023)", () => {
  it("getProductsByCategorySlug yalnızca o kategorideki PUBLISHED ürünleri döner", async () => {
    const categoryA = await createCategory()
    const categoryB = await createCategory()
    const inA = await createPublishedProductWithVariant({ stockQuantity: 5, categoryId: categoryA.id })
    await createPublishedProductWithVariant({ stockQuantity: 5, categoryId: categoryB.id })

    const products = await getProductsByCategorySlug(categoryA.slug, testPrisma)

    expect(products).toHaveLength(1)
    expect(products[0].slug).toBe(inA.productSlug)
  })

  it("getProductsByCollectionSlug, bir ürün birden fazla koleksiyonda olsa da doğru filtreler (çoktan-çoğa)", async () => {
    const collectionA = await createCollection()
    const collectionB = await createCollection()
    const inBoth = await createPublishedProductWithVariant({
      stockQuantity: 5,
      collectionIds: [collectionA.id, collectionB.id],
    })
    const onlyA = await createPublishedProductWithVariant({ stockQuantity: 5, collectionIds: [collectionA.id] })

    const productsInA = await getProductsByCollectionSlug(collectionA.slug, testPrisma)
    const productsInB = await getProductsByCollectionSlug(collectionB.slug, testPrisma)

    expect(productsInA.map((p) => p.slug).sort()).toEqual([inBoth.productSlug, onlyA.productSlug].sort())
    expect(productsInB.map((p) => p.slug)).toEqual([inBoth.productSlug])
  })
})

describe("catalog read layer — taksonomi", () => {
  it("getCategories/getCategoryBySlug ve getCollections/getCollectionBySlug beklenen kayıtları (description dahil) döner", async () => {
    const category = await createCategory("Test Yüzük Kategorisi", "Test kategori açıklaması.")
    const collection = await createCollection("Test Koleksiyonu", "Test koleksiyon açıklaması.")

    const categories = await getCategories(testPrisma)
    const collections = await getCollections(testPrisma)

    expect(categories.some((c) => c.slug === category.slug && c.name === category.name)).toBe(true)
    expect(collections.some((c) => c.slug === collection.slug && c.name === collection.name)).toBe(true)

    expect(await getCategoryBySlug(category.slug, testPrisma)).toEqual({
      slug: category.slug,
      name: category.name,
      description: "Test kategori açıklaması.",
    })
    expect(await getCollectionBySlug(collection.slug, testPrisma)).toEqual({
      slug: collection.slug,
      name: collection.name,
      description: "Test koleksiyon açıklaması.",
    })
    expect(await getCategoryBySlug("does-not-exist", testPrisma)).toBeNull()
  })
})
