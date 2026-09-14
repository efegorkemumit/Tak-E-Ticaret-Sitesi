import "../helpers/mock-admin-cookie"
import { beforeEach, describe, expect, it } from "vitest"
import { testPrisma } from "../helpers/test-prisma"
import {
  createAttributeDefinition as createAttributeDefinitionAdmin,
  createAttributeValue as createAttributeValueAdmin,
  listAttributeDefinitionsForAdmin,
} from "../../lib/admin/attributes"
import { AdminAuthRequiredError } from "../../lib/auth"
import { createAttributeDefinition, createAuthenticatedAdmin, resetCommerceTables } from "../helpers/factories"
import { setMockAdminCookie, clearMockAdminCookie } from "../helpers/mock-admin-cookie"

beforeEach(async () => {
  await resetCommerceTables()
})

describe("Admin öznitelik yönetimi (M — D028)", () => {
  it("oturumsuz çağrı reddedilir", async () => {
    clearMockAdminCookie()
    await expect(createAttributeDefinitionAdmin({ key: "tasTuru", label: "Taş Türü" }, testPrisma)).rejects.toBeInstanceOf(
      AdminAuthRequiredError
    )
  })

  it("(M) yeni bir öznitelik TİPİ oluşturur", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)

    const result = await createAttributeDefinitionAdmin({ key: "tasTuru", label: "Taş Türü" }, testPrisma)

    expect(result.success).toBe(true)
    if (!result.success) throw new Error("beklenmedik hata")
    expect(result.definition.key).toBe("tasTuru")
    expect(result.definition.values).toEqual([])
  })

  it("(M) aynı key ile ikinci tip KEY_CONFLICT döner", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)

    await createAttributeDefinitionAdmin({ key: "renk", label: "Renk" }, testPrisma)
    const second = await createAttributeDefinitionAdmin({ key: "renk", label: "Renk (2)" }, testPrisma)

    expect(second.success).toBe(false)
    if (second.success) throw new Error("beklenmedik başarı")
    expect(second.error.code).toBe("KEY_CONFLICT")
  })

  it("(M) mevcut bir tip için yeni bir DEĞER oluşturur", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)
    const definition = await createAttributeDefinition("materyal", "Materyal")

    const result = await createAttributeValueAdmin({ attributeDefinitionId: definition.id, value: "Gümüş" }, testPrisma)

    expect(result.success).toBe(true)
    if (!result.success) throw new Error("beklenmedik hata")
    expect(result.value.value).toBe("Gümüş")

    const list = await listAttributeDefinitionsForAdmin(testPrisma)
    const found = list.find((d) => d.id === definition.id)
    expect(found?.values.map((v) => v.value)).toContain("Gümüş")
  })

  it("(M) var olmayan bir tip için değer eklemek ATTRIBUTE_DEFINITION_NOT_FOUND döner", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)

    const result = await createAttributeValueAdmin({ attributeDefinitionId: "yok-boyle-bir-id", value: "X" }, testPrisma)

    expect(result.success).toBe(false)
    if (result.success) throw new Error("beklenmedik başarı")
    expect(result.error.code).toBe("ATTRIBUTE_DEFINITION_NOT_FOUND")
  })

  it("(M) aynı tip içinde aynı değer ikinci kez eklenirse VALUE_CONFLICT döner", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)
    const definition = await createAttributeDefinition("beden", "Beden")

    await createAttributeValueAdmin({ attributeDefinitionId: definition.id, value: "16" }, testPrisma)
    const second = await createAttributeValueAdmin({ attributeDefinitionId: definition.id, value: "16" }, testPrisma)

    expect(second.success).toBe(false)
    if (second.success) throw new Error("beklenmedik başarı")
    expect(second.error.code).toBe("VALUE_CONFLICT")
  })
})
