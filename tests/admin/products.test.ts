import "../helpers/mock-admin-cookie"
import { beforeEach, describe, expect, it } from "vitest"
import { testPrisma } from "../helpers/test-prisma"
import { ProductStatus } from "../../lib/generated/prisma/client"
import { createProduct, updateProduct, getProductForAdmin, listProductsForAdmin } from "../../lib/admin/products"
import { getPublishedProducts, getProductBySlug } from "../../lib/commerce/catalog"
import { AdminAuthRequiredError } from "../../lib/auth"
import {
  createAuthenticatedAdmin,
  createCategory,
  resetCommerceTables,
} from "../helpers/factories"
import { setMockAdminCookie, clearMockAdminCookie } from "../helpers/mock-admin-cookie"

beforeEach(async () => {
  await resetCommerceTables()
})

describe("Admin ürün yönetimi (G/H/I/J — D021/D029)", () => {
  it("(F fonksiyon-seviyesi) oturumsuz çağrı her admin fonksiyonunda reddedilir — yalnızca sayfa redirect'i değil", async () => {
    clearMockAdminCookie()
    await expect(
      createProduct({ name: "X", categoryId: "yok" }, testPrisma)
    ).rejects.toBeInstanceOf(AdminAuthRequiredError)
    await expect(listProductsForAdmin(testPrisma)).rejects.toBeInstanceOf(AdminAuthRequiredError)
  })

  it("(G) geçerli girdiyle DRAFT bir ürün oluşturur (varsayılan status)", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)
    const category = await createCategory()

    const result = await createProduct(
      { name: "Örnek Gümüş Kolye", categoryId: category.id },
      testPrisma
    )

    expect(result.success).toBe(true)
    if (!result.success) throw new Error("beklenmedik hata")
    expect(result.product.status).toBe(ProductStatus.DRAFT)
    expect(result.product.slug).toBe("ornek-gumus-kolye")

    const row = await testPrisma.product.findUniqueOrThrow({ where: { id: result.product.id } })
    expect(row.status).toBe(ProductStatus.DRAFT)
  })

  it("(G) aynı slug'a çakışan iki eşzamanlı create'ten yalnızca biri başarılı olur (SLUG_CONFLICT, P2002 yakalama)", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)
    const category = await createCategory()

    const [resultA, resultB] = await Promise.all([
      createProduct({ name: "Çakışan Ürün", slug: "cakisan-urun", categoryId: category.id }, testPrisma),
      createProduct({ name: "Çakışan Ürün", slug: "cakisan-urun", categoryId: category.id }, testPrisma),
    ])

    const outcomes = [resultA, resultB]
    const succeeded = outcomes.filter((r) => r.success)
    const failed = outcomes.filter((r) => !r.success)
    expect(succeeded).toHaveLength(1)
    expect(failed).toHaveLength(1)
    if (failed[0].success) throw new Error("beklenmedik başarı")
    expect(failed[0].error.code).toBe("SLUG_CONFLICT")

    const rows = await testPrisma.product.findMany({ where: { slug: "cakisan-urun" } })
    expect(rows).toHaveLength(1)
  })

  it("(H) updateProduct mevcut alanları günceller", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)
    const category = await createCategory()
    const created = await createProduct({ name: "Eski Ad", categoryId: category.id }, testPrisma)
    if (!created.success) throw new Error("setup başarısız")

    const updated = await updateProduct(
      { id: created.product.id, name: "Yeni Ad", slug: created.product.slug, categoryId: category.id, careInfo: "Nazikçe temizleyin." },
      testPrisma
    )

    expect(updated.success).toBe(true)
    if (!updated.success) throw new Error("beklenmedik hata")
    expect(updated.product.name).toBe("Yeni Ad")
    expect(updated.product.careInfo).toBe("Nazikçe temizleyin.")
  })

  it("(I) PUBLISHED bir ürün storefront katalog katmanında (getPublishedProducts/getProductBySlug) GÖRÜNÜR", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)
    const category = await createCategory()
    const created = await createProduct(
      { name: "Görünür Ürün", categoryId: category.id, status: ProductStatus.PUBLISHED },
      testPrisma
    )
    if (!created.success) throw new Error("setup başarısız")

    const published = await getPublishedProducts(testPrisma)
    expect(published.map((p) => p.id)).toContain(created.product.id)

    const bySlug = await getProductBySlug(created.product.slug, testPrisma)
    expect(bySlug?.id).toBe(created.product.id)
  })

  it("(J) ARCHIVED bir ürün storefront katalog katmanında HİÇ GÖRÜNMEZ (ama admin listesinde görünür)", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)
    const category = await createCategory()
    const created = await createProduct(
      { name: "Arşivlenecek Ürün", categoryId: category.id, status: ProductStatus.PUBLISHED },
      testPrisma
    )
    if (!created.success) throw new Error("setup başarısız")

    // "Arşivle" yolu — D029: hard delete yok, yalnızca ARCHIVED'a geçiş.
    const archived = await updateProduct(
      { id: created.product.id, name: created.product.name, slug: created.product.slug, categoryId: category.id, status: ProductStatus.ARCHIVED },
      testPrisma
    )
    expect(archived.success).toBe(true)

    const published = await getPublishedProducts(testPrisma)
    expect(published.map((p) => p.id)).not.toContain(created.product.id)

    const bySlug = await getProductBySlug(created.product.slug, testPrisma)
    expect(bySlug).toBeNull()

    // Admin tarafında hâlâ görünür ve durumu doğru — "silinmedi", yalnızca gizlendi.
    const adminView = await getProductForAdmin(created.product.id, testPrisma)
    expect(adminView?.status).toBe(ProductStatus.ARCHIVED)

    const adminList = await listProductsForAdmin(testPrisma)
    expect(adminList.map((p) => p.id)).toContain(created.product.id)
  })

  it("(Y ilkesi) lib/admin/products.ts'te herhangi bir 'silme'/'delete' fonksiyonu İHRAÇ EDİLMEZ (D029)", async () => {
    const productsModule = await import("../../lib/admin/products")
    const exportedNames = Object.keys(productsModule)
    const hasDeleteLikeExport = exportedNames.some((name) => /delete|remove.*product\b/i.test(name) && !/descriptiveattribute/i.test(name))
    expect(hasDeleteLikeExport).toBe(false)
  })
})
