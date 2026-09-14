import "../helpers/mock-admin-cookie"
import { beforeEach, describe, expect, it } from "vitest"
import { testPrisma } from "../helpers/test-prisma"
import { createCollection as createCollectionAdmin, listCollectionsForAdmin } from "../../lib/admin/collections"
import { AdminAuthRequiredError } from "../../lib/auth"
import { createAuthenticatedAdmin, resetCommerceTables } from "../helpers/factories"
import { setMockAdminCookie, clearMockAdminCookie } from "../helpers/mock-admin-cookie"

beforeEach(async () => {
  await resetCommerceTables()
})

describe("Admin koleksiyon yönetimi (L)", () => {
  it("oturumsuz çağrı reddedilir", async () => {
    clearMockAdminCookie()
    await expect(createCollectionAdmin({ name: "Günlük" }, testPrisma)).rejects.toBeInstanceOf(AdminAuthRequiredError)
  })

  it("(L) geçerli girdiyle koleksiyon oluşturur", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)

    const result = await createCollectionAdmin({ name: "Günlük Koleksiyonu" }, testPrisma)

    expect(result.success).toBe(true)
    if (!result.success) throw new Error("beklenmedik hata")
    expect(result.collection.slug).toBe("gunluk-koleksiyonu")

    const list = await listCollectionsForAdmin(testPrisma)
    expect(list.map((c) => c.slug)).toContain("gunluk-koleksiyonu")
  })

  it("(L) aynı slug ile ikinci create SLUG_CONFLICT döner", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)

    await createCollectionAdmin({ name: "Hediyelik", slug: "hediyelik" }, testPrisma)
    const second = await createCollectionAdmin({ name: "Hediyelik (2)", slug: "hediyelik" }, testPrisma)

    expect(second.success).toBe(false)
    if (second.success) throw new Error("beklenmedik başarı")
    expect(second.error.code).toBe("SLUG_CONFLICT")
  })
})
