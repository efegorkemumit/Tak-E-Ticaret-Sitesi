import "../helpers/mock-admin-cookie"
import { beforeEach, describe, expect, it } from "vitest"
import { testPrisma } from "../helpers/test-prisma"
import { ProductStatus } from "../../lib/generated/prisma/client"
import { updateProductShopierLink } from "../../lib/admin/products"
import { getProductBySlug, getPublishedProducts } from "../../lib/commerce/catalog"
import { AdminAuthRequiredError } from "../../lib/auth"
import { createAuthenticatedAdmin, createPublishedProductWithVariant, resetCommerceTables } from "../helpers/factories"
import { setMockAdminCookie, clearMockAdminCookie } from "../helpers/mock-admin-cookie"

beforeEach(async () => {
  await resetCommerceTables()
})

const SHOPIER_URL = "https://www.shopier.com/50918034"
const SHOPIER_PRODUCT_ID = "50918034"

async function readLink(productId: string): Promise<{ shopierProductId: string | null; shopierUrl: string | null }> {
  const product = await testPrisma.product.findUniqueOrThrow({
    where: { id: productId },
    select: { shopierProductId: true, shopierUrl: true },
  })
  return product
}

describe("updateProductShopierLink — yetki ve doğrulama (D030)", () => {
  it("oturumsuz çağrı reddedilir ve DB DEĞİŞMEZ", async () => {
    clearMockAdminCookie()
    const { productId } = await createPublishedProductWithVariant({ stockQuantity: 5 })

    await expect(
      updateProductShopierLink({ productId, shopierUrl: SHOPIER_URL }, testPrisma)
    ).rejects.toBeInstanceOf(AdminAuthRequiredError)

    expect(await readLink(productId)).toEqual({ shopierProductId: null, shopierUrl: null })
  })

  it("PUBLISHED ürüne geçerli Shopier URL'i yazılır; DB'de KANONİK url + sayısal id saklanır", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)
    const { productId } = await createPublishedProductWithVariant({ stockQuantity: 5 })

    // Bilinçli olarak KANONİK OLMAYAN (www'suz + satıcı slug'lı) biçim
    // gönderiliyor — kaydedilen değerin ham girdi DEĞİL, doğrulayıcının
    // ürettiği string olduğunu kanıtlamak için.
    const result = await updateProductShopierLink(
      { productId, shopierUrl: "https://shopier.com/efegorkemumit/50918034" },
      testPrisma
    )

    expect(result.success).toBe(true)
    if (!result.success) throw new Error("beklenmedik hata")
    expect(result.shopierUrl).toBe(SHOPIER_URL)
    expect(result.shopierProductId).toBe(SHOPIER_PRODUCT_ID)

    expect(await readLink(productId)).toEqual({
      shopierProductId: SHOPIER_PRODUCT_ID,
      shopierUrl: SHOPIER_URL,
    })
  })

  it("geçersiz domain INVALID_SHOPIER_URL döner ve DB DEĞİŞMEZ", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)
    const { productId } = await createPublishedProductWithVariant({ stockQuantity: 5 })
    await updateProductShopierLink({ productId, shopierUrl: SHOPIER_URL }, testPrisma)

    const result = await updateProductShopierLink({ productId, shopierUrl: "https://evil.com/123456" }, testPrisma)

    expect(result.success).toBe(false)
    if (result.success) throw new Error("beklenmedik başarı")
    expect(result.error.code).toBe("INVALID_SHOPIER_URL")

    // Önceki geçerli bağlantı BOZULMAMIŞ olmalı.
    expect(await readLink(productId)).toEqual({
      shopierProductId: SHOPIER_PRODUCT_ID,
      shopierUrl: SHOPIER_URL,
    })
  })

  it("boş string bağlantıyı kaldırır (her iki alan da null)", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)
    const { productId } = await createPublishedProductWithVariant({ stockQuantity: 5 })
    await updateProductShopierLink({ productId, shopierUrl: SHOPIER_URL }, testPrisma)

    const result = await updateProductShopierLink({ productId, shopierUrl: "" }, testPrisma)

    expect(result.success).toBe(true)
    if (!result.success) throw new Error("beklenmedik hata")
    expect(result.shopierUrl).toBeNull()
    expect(result.shopierProductId).toBeNull()
    expect(await readLink(productId)).toEqual({ shopierProductId: null, shopierUrl: null })
  })

  it("bağlantı kaldırıldıktan sonra AYNI Shopier ürünü BAŞKA bir ürüne bağlanabilir", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)
    const first = await createPublishedProductWithVariant({ stockQuantity: 5 })
    const second = await createPublishedProductWithVariant({ stockQuantity: 5 })

    await updateProductShopierLink({ productId: first.productId, shopierUrl: SHOPIER_URL }, testPrisma)
    await updateProductShopierLink({ productId: first.productId, shopierUrl: "" }, testPrisma)

    const result = await updateProductShopierLink({ productId: second.productId, shopierUrl: SHOPIER_URL }, testPrisma)
    expect(result.success).toBe(true)
  })

  it("var olmayan ürün PRODUCT_NOT_FOUND döner", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)

    const result = await updateProductShopierLink(
      { productId: "00000000-0000-4000-8000-000000000000", shopierUrl: SHOPIER_URL },
      testPrisma
    )

    expect(result.success).toBe(false)
    if (result.success) throw new Error("beklenmedik başarı")
    expect(result.error.code).toBe("PRODUCT_NOT_FOUND")
  })
})

describe("updateProductShopierLink — duplicate koruması (D030)", () => {
  it("aynı Shopier ürünü İKİNCİ bir ürüne bağlanamaz; ham P2002 SIZMAZ", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)
    const first = await createPublishedProductWithVariant({ stockQuantity: 5 })
    const second = await createPublishedProductWithVariant({ stockQuantity: 5 })

    const firstResult = await updateProductShopierLink(
      { productId: first.productId, shopierUrl: SHOPIER_URL },
      testPrisma
    )
    expect(firstResult.success).toBe(true)

    const secondResult = await updateProductShopierLink(
      { productId: second.productId, shopierUrl: SHOPIER_URL },
      testPrisma
    )

    expect(secondResult.success).toBe(false)
    if (secondResult.success) throw new Error("beklenmedik başarı")
    expect(secondResult.error.code).toBe("SHOPIER_PRODUCT_ALREADY_LINKED")
    // Ham Prisma hatası (kod/meta/bağlantı detayı) admin'e SIZMAMALI.
    expect(secondResult.error.message).toBe("Bu Shopier ürünü başka bir ürüne bağlı.")
    expect(secondResult.error.message).not.toContain("P2002")

    expect(await readLink(second.productId)).toEqual({ shopierProductId: null, shopierUrl: null })
  })

  it("AYNI ürüne aynı bağlantıyı tekrar yazmak duplicate SAYILMAZ (idempotent)", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)
    const { productId } = await createPublishedProductWithVariant({ stockQuantity: 5 })

    await updateProductShopierLink({ productId, shopierUrl: SHOPIER_URL }, testPrisma)
    const second = await updateProductShopierLink({ productId, shopierUrl: SHOPIER_URL }, testPrisma)

    expect(second.success).toBe(true)
    if (!second.success) throw new Error("beklenmedik hata")
    expect(second.shopierUrl).toBe(SHOPIER_URL)
  })

  it("kanonik olmayan yazımla gelen AYNI ürün de duplicate olarak yakalanır (kanonikleştirmenin amacı)", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)
    const first = await createPublishedProductWithVariant({ stockQuantity: 5 })
    const second = await createPublishedProductWithVariant({ stockQuantity: 5 })

    await updateProductShopierLink({ productId: first.productId, shopierUrl: SHOPIER_URL }, testPrisma)

    // Farklı yazım, AYNI Shopier ürünü — kanonikleştirme olmasaydı `@unique`
    // kısıtı fiilen atlatılmış olurdu.
    const result = await updateProductShopierLink(
      { productId: second.productId, shopierUrl: "https://shopier.com/efegorkemumit/50918034" },
      testPrisma
    )

    expect(result.success).toBe(false)
    if (result.success) throw new Error("beklenmedik başarı")
    expect(result.error.code).toBe("SHOPIER_PRODUCT_ALREADY_LINKED")
  })
})

describe("Katalog DTO'su — shopierUrl savunması (D030, defense in depth)", () => {
  it("getProductBySlug ve getPublishedProducts KANONİK shopierUrl döner", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)
    const { productId, productSlug } = await createPublishedProductWithVariant({ stockQuantity: 5 })
    await updateProductShopierLink(
      { productId, shopierUrl: "https://shopier.com/efegorkemumit/50918034" },
      testPrisma
    )

    const detail = await getProductBySlug(productSlug, testPrisma)
    expect(detail?.shopierUrl).toBe(SHOPIER_URL)

    const list = await getPublishedProducts(testPrisma)
    expect(list.find((product) => product.slug === productSlug)?.shopierUrl).toBe(SHOPIER_URL)
  })

  it("Shopier bağlantısı olmayan üründe shopierUrl null döner", async () => {
    const { productSlug } = await createPublishedProductWithVariant({ stockQuantity: 5 })

    const detail = await getProductBySlug(productSlug, testPrisma)
    expect(detail?.shopierUrl).toBeNull()
  })

  const corruptedValues: Array<[string, string]> = [
    ["javascript: şeması", "javascript:alert(1)"],
    ["saldırgan domain'i", "https://evil.com/50918034"],
    ["şifresiz http", "http://www.shopier.com/50918034"],
    ["`endsWith` tuzağı", "https://evil-shopier.com/50918034"],
  ]

  it.each(corruptedValues)(
    "DB'ye ELLE bozuk bir değer yazılsa bile katalog DTO'su null döner: %s",
    async (_label, corrupted) => {
      const { productId, productSlug } = await createPublishedProductWithVariant({ stockQuantity: 5 })

      // Servis katmanını BİLEREK atlayıp doğrudan DB'ye yazıyoruz — bu, veri
      // tabanına başka bir yoldan (elle migration, eski kayıt, başka bir
      // araç) girmiş bozuk bir değeri simüle eder. Okuma tarafının da kendi
      // doğrulamasını yapması, "defense in depth"in tam olarak bu senaryo
      // içindir.
      await testPrisma.product.update({ where: { id: productId }, data: { shopierUrl: corrupted } })

      const detail = await getProductBySlug(productSlug, testPrisma)
      expect(detail?.shopierUrl).toBeNull()

      const list = await getPublishedProducts(testPrisma)
      expect(list.find((product) => product.slug === productSlug)?.shopierUrl).toBeNull()
    }
  )
})

describe("Katalog görünürlüğü — regresyon kilidi (D021)", () => {
  it("DRAFT ve ARCHIVED ürünler, Shopier bağlantıları olsa bile katalogda DÖNMEZ", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)

    const draft = await createPublishedProductWithVariant({ stockQuantity: 5, status: ProductStatus.DRAFT })
    const archived = await createPublishedProductWithVariant({ stockQuantity: 5, status: ProductStatus.ARCHIVED })
    await updateProductShopierLink({ productId: draft.productId, shopierUrl: SHOPIER_URL }, testPrisma)
    await updateProductShopierLink(
      { productId: archived.productId, shopierUrl: "https://www.shopier.com/50917990" },
      testPrisma
    )

    const list = await getPublishedProducts(testPrisma)
    const slugs = list.map((product) => product.slug)
    expect(slugs).not.toContain(draft.productSlug)
    expect(slugs).not.toContain(archived.productSlug)

    expect(await getProductBySlug(draft.productSlug, testPrisma)).toBeNull()
    expect(await getProductBySlug(archived.productSlug, testPrisma)).toBeNull()
  })
})
