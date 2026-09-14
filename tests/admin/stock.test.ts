import "../helpers/mock-admin-cookie"
import { beforeEach, describe, expect, it } from "vitest"
import { testPrisma } from "../helpers/test-prisma"
import { ProductStatus } from "../../lib/generated/prisma/client"
import { createProduct } from "../../lib/admin/products"
import { createVariant } from "../../lib/admin/variants"
import { getVariantStockBreakdown, updateVariantStock } from "../../lib/admin/stock"
import { AdminAuthRequiredError } from "../../lib/auth"
import { createAuthenticatedAdmin, createActiveReservation, createCategory, resetCommerceTables } from "../helpers/factories"
import { setMockAdminCookie, clearMockAdminCookie } from "../helpers/mock-admin-cookie"

beforeEach(async () => {
  await resetCommerceTables()
})

async function setupVariant(stockQuantity: number): Promise<{ variantId: string; productId: string }> {
  const { token } = await createAuthenticatedAdmin()
  setMockAdminCookie(token)
  const category = await createCategory()
  const product = await createProduct({ name: `Stok Testi ${Math.random().toString(36).slice(2, 8)}`, categoryId: category.id, status: ProductStatus.PUBLISHED }, testPrisma)
  if (!product.success) throw new Error("setup başarısız")
  const variant = await createVariant({ productId: product.product.id, sku: `STOK-${Date.now()}`, price: "100.00", stockQuantity }, testPrisma)
  if (!variant.success) throw new Error("setup başarısız")
  return { variantId: variant.variant.id, productId: product.product.id }
}

describe("Admin fiziksel stok yönetimi (R — D018)", () => {
  it("oturumsuz çağrı reddedilir", async () => {
    clearMockAdminCookie()
    await expect(updateVariantStock({ variantId: "x", productId: "y", stockQuantity: 5 }, testPrisma)).rejects.toBeInstanceOf(AdminAuthRequiredError)
  })

  it("(R) updateVariantStock ham stoğu günceller, DB'de doğrulanır", async () => {
    const { variantId, productId } = await setupVariant(5)

    const result = await updateVariantStock({ variantId, productId, stockQuantity: 20 }, testPrisma)

    expect(result.success).toBe(true)
    if (!result.success) throw new Error("beklenmedik hata")
    expect(result.stock.physicalStock).toBe(20)

    const row = await testPrisma.variant.findUniqueOrThrow({ where: { id: variantId } })
    expect(row.stockQuantity).toBe(20)
  })

  it("(R) getVariantStockBreakdown, TEK paylaşılan D018 formülünü (getAvailableQuantities) kullanır — aktif rezervasyon düşülür", async () => {
    const { variantId } = await setupVariant(10)
    await createActiveReservation(variantId, 4)

    const [breakdown] = await getVariantStockBreakdown([variantId], testPrisma)

    expect(breakdown.physicalStock).toBe(10)
    expect(breakdown.reservedQuantity).toBe(4)
    expect(breakdown.availableQuantity).toBe(6)
  })

  it("(R) var olmayan bir varyant için stok güncellemesi VARIANT_NOT_FOUND döner", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)

    const result = await updateVariantStock({ variantId: "yok-boyle-bir-id", productId: "yok-boyle-bir-urun", stockQuantity: 5 }, testPrisma)

    expect(result.success).toBe(false)
    if (result.success) throw new Error("beklenmedik başarı")
    expect(result.error.code).toBe("VARIANT_NOT_FOUND")
  })

  it("(R, IDOR düzeltmesi girdi doğrulaması) boş productId INVALID_INPUT döner (updateVariantStockSchema)", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)

    const result = await updateVariantStock({ variantId: "x", productId: "", stockQuantity: 5 }, testPrisma)

    expect(result.success).toBe(false)
    if (result.success) throw new Error("beklenmedik başarı")
    expect(result.error.code).toBe("INVALID_INPUT")
  })

  it("(R, IDOR düzeltmesi — security C-2) DOĞRU variantId ama YANLIŞ (başka bir ürünün) productId'siyle stok güncellemesi VARIANT_NOT_FOUND döner, stok DEĞİŞMEZ", async () => {
    const { variantId, productId } = await setupVariant(5)
    const category = await createCategory()
    const otherProduct = await createProduct({ name: `Başka Ürün ${Math.random().toString(36).slice(2, 8)}`, categoryId: category.id, status: ProductStatus.PUBLISHED }, testPrisma)
    if (!otherProduct.success) throw new Error("setup başarısız")
    expect(otherProduct.product.id).not.toBe(productId)

    const result = await updateVariantStock({ variantId, productId: otherProduct.product.id, stockQuantity: 999 }, testPrisma)

    expect(result.success).toBe(false)
    if (result.success) throw new Error("beklenmedik başarı")
    expect(result.error.code).toBe("VARIANT_NOT_FOUND")

    const row = await testPrisma.variant.findUniqueOrThrow({ where: { id: variantId } })
    expect(row.stockQuantity).toBe(5)
  })
})
