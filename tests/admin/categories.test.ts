import "../helpers/mock-admin-cookie"
import { beforeEach, describe, expect, it } from "vitest"
import { testPrisma } from "../helpers/test-prisma"
import { createCategory as createCategoryAdmin, listCategoriesForAdmin } from "../../lib/admin/categories"
import { AdminAuthRequiredError } from "../../lib/auth"
import { createAuthenticatedAdmin, resetCommerceTables } from "../helpers/factories"
import { setMockAdminCookie, clearMockAdminCookie } from "../helpers/mock-admin-cookie"

beforeEach(async () => {
  await resetCommerceTables()
})

describe("Admin kategori yönetimi (K)", () => {
  it("oturumsuz çağrı reddedilir", async () => {
    clearMockAdminCookie()
    await expect(createCategoryAdmin({ name: "Yüzük" }, testPrisma)).rejects.toBeInstanceOf(AdminAuthRequiredError)
  })

  it("(K) geçerli girdiyle kategori oluşturur, slug otomatik türetilir", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)

    const result = await createCategoryAdmin({ name: "Yüzük" }, testPrisma)

    expect(result.success).toBe(true)
    if (!result.success) throw new Error("beklenmedik hata")
    expect(result.category.slug).toBe("yuzuk")
    expect(result.category.productCount).toBe(0)

    const list = await listCategoriesForAdmin(testPrisma)
    expect(list.map((c) => c.slug)).toContain("yuzuk")
  })

  it("(K) aynı slug ile ikinci create SLUG_CONFLICT döner", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)

    const first = await createCategoryAdmin({ name: "Kolye", slug: "kolye" }, testPrisma)
    expect(first.success).toBe(true)

    const second = await createCategoryAdmin({ name: "Kolye (2)", slug: "kolye" }, testPrisma)
    expect(second.success).toBe(false)
    if (second.success) throw new Error("beklenmedik başarı")
    expect(second.error.code).toBe("SLUG_CONFLICT")
  })
})
