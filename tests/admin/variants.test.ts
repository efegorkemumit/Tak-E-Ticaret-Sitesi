import "../helpers/mock-admin-cookie"
import { beforeEach, describe, expect, it } from "vitest"
import { testPrisma } from "../helpers/test-prisma"
import { ProductStatus } from "../../lib/generated/prisma/client"
import { createProduct } from "../../lib/admin/products"
import { suggestVariantSku, createVariant, updateVariant } from "../../lib/admin/variants"
import { AdminAuthRequiredError } from "../../lib/auth"
import { createAuthenticatedAdmin, createCategory, resetCommerceTables } from "../helpers/factories"
import { setMockAdminCookie, clearMockAdminCookie } from "../helpers/mock-admin-cookie"

beforeEach(async () => {
  await resetCommerceTables()
})

async function setupProduct(): Promise<string> {
  const { token } = await createAuthenticatedAdmin()
  setMockAdminCookie(token)
  const category = await createCategory()
  const product = await createProduct(
    { name: `Test Ürün ${Math.random().toString(36).slice(2, 8)}`, categoryId: category.id, status: ProductStatus.PUBLISHED },
    testPrisma
  )
  if (!product.success) throw new Error("setup başarısız")
  return product.product.id
}

describe("Admin varyant yönetimi (N/O/P/Q — D019/D027)", () => {
  it("oturumsuz çağrı reddedilir", async () => {
    clearMockAdminCookie()
    await expect(createVariant({ productId: "x", sku: "X", price: "1.00", stockQuantity: 0 }, testPrisma)).rejects.toBeInstanceOf(
      AdminAuthRequiredError
    )
  })

  it("(N) suggestVariantSku bir öneri üretir, createVariant bu öneriyle GEÇERLİ bir varyant oluşturur", async () => {
    const productId = await setupProduct()

    const suggested = await suggestVariantSku(productId, testPrisma)
    expect(suggested).toBeTruthy()

    const result = await createVariant(
      { productId, sku: suggested!, price: "450.00", stockQuantity: 5 },
      testPrisma
    )

    expect(result.success).toBe(true)
    if (!result.success) throw new Error("beklenmedik hata")
    expect(result.variant.sku).toBe(suggested)
    expect(result.variant.price).toBe("450.00")
    expect(result.variant.availableQuantity).toBe(5)
  })

  it("(O) admin önerilen SKU'yu YOK SAYIP kendi elle girdiği bir SKU ile de varyant oluşturabilir", async () => {
    const productId = await setupProduct()

    const result = await createVariant(
      { productId, sku: "MARKA-OZEL-KOD-001", price: "300.00", stockQuantity: 3 },
      testPrisma
    )

    expect(result.success).toBe(true)
    if (!result.success) throw new Error("beklenmedik hata")
    expect(result.variant.sku).toBe("MARKA-OZEL-KOD-001")
  })

  it("(O, IDOR düzeltmesi girdi doğrulaması) boş productId INVALID_INPUT döner (updateVariantSchema)", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)

    const result = await updateVariant({ id: "x", productId: "", sku: "Y", price: "1.00" }, testPrisma)
    expect(result.success).toBe(false)
    if (result.success) throw new Error("beklenmedik başarı")
    expect(result.error.code).toBe("INVALID_INPUT")
  })

  it("(O) updateVariant mevcut bir varyantın SKU'sunu elle girilen başka bir değere değiştirebilir", async () => {
    const productId = await setupProduct()
    const created = await createVariant({ productId, sku: "ESKI-SKU-001", price: "100.00", stockQuantity: 1 }, testPrisma)
    if (!created.success) throw new Error("setup başarısız")

    const updated = await updateVariant({ id: created.variant.id, productId, sku: "YENI-SKU-002", price: "100.00" }, testPrisma)

    expect(updated.success).toBe(true)
    if (!updated.success) throw new Error("beklenmedik hata")
    expect(updated.variant.sku).toBe("YENI-SKU-002")
  })

  it("(P) aynı SKU ile ikinci create SKU_CONFLICT döner (ön-SELECT değil, P2002 yakalama)", async () => {
    const productId = await setupProduct()
    await createVariant({ productId, sku: "TEKRARLI-SKU", price: "100.00", stockQuantity: 1 }, testPrisma)

    const second = await createVariant({ productId, sku: "TEKRARLI-SKU", price: "200.00", stockQuantity: 1 }, testPrisma)

    expect(second.success).toBe(false)
    if (second.success) throw new Error("beklenmedik başarı")
    expect(second.error.code).toBe("SKU_CONFLICT")
  })

  it("(P) aynı SKU ile GERÇEKTEN eşzamanlı iki create'ten yalnızca biri başarılı olur (aynı bug sınıfı — idempotency race regresyonu)", async () => {
    const productId = await setupProduct()

    const [resultA, resultB] = await Promise.all([
      createVariant({ productId, sku: "YARIS-SKU", price: "100.00", stockQuantity: 1 }, testPrisma),
      createVariant({ productId, sku: "YARIS-SKU", price: "150.00", stockQuantity: 1 }, testPrisma),
    ])

    const outcomes = [resultA, resultB]
    const succeeded = outcomes.filter((r) => r.success)
    const failed = outcomes.filter((r) => !r.success)
    expect(succeeded).toHaveLength(1)
    expect(failed).toHaveLength(1)
    if (failed[0].success) throw new Error("beklenmedik başarı")
    expect(failed[0].error.code).toBe("SKU_CONFLICT")

    const rows = await testPrisma.variant.findMany({ where: { sku: "YARIS-SKU" } })
    expect(rows).toHaveLength(1)
  })

  it("(Q) updateVariant fiyatı günceller", async () => {
    const productId = await setupProduct()
    const created = await createVariant({ productId, sku: "FIYAT-TEST", price: "100.00", stockQuantity: 1 }, testPrisma)
    if (!created.success) throw new Error("setup başarısız")

    const updated = await updateVariant({ id: created.variant.id, productId, sku: "FIYAT-TEST", price: "275.50" }, testPrisma)

    expect(updated.success).toBe(true)
    if (!updated.success) throw new Error("beklenmedik hata")
    expect(updated.variant.price).toBe("275.50")

    const row = await testPrisma.variant.findUniqueOrThrow({ where: { id: created.variant.id } })
    expect(row.price.toFixed(2)).toBe("275.50")
  })

  it("(Q, IDOR düzeltmesi — security C-2) DOĞRU varyant id'si ama YANLIŞ (başka bir ürünün) productId'siyle güncelleme VARIANT_NOT_FOUND döner, fiyat DEĞİŞMEZ", async () => {
    const productId = await setupProduct()
    const created = await createVariant({ productId, sku: "IDOR-TEST", price: "100.00", stockQuantity: 1 }, testPrisma)
    if (!created.success) throw new Error("setup başarısız")
    const otherProductId = await setupProduct()
    expect(otherProductId).not.toBe(productId)

    const result = await updateVariant({ id: created.variant.id, productId: otherProductId, sku: "ELE-GECIRILDI", price: "1.00" }, testPrisma)

    expect(result.success).toBe(false)
    if (result.success) throw new Error("beklenmedik başarı")
    expect(result.error.code).toBe("VARIANT_NOT_FOUND")

    const row = await testPrisma.variant.findUniqueOrThrow({ where: { id: created.variant.id } })
    expect(row.sku).toBe("IDOR-TEST")
    expect(row.price.toFixed(2)).toBe("100.00")
  })
})
