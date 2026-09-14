import { beforeEach, describe, expect, it } from "vitest"
import { testPrisma } from "../helpers/test-prisma"
import { adminExists, createFirstAdmin } from "../../lib/auth"
import { resetCommerceTables } from "../helpers/factories"

beforeEach(async () => {
  await resetCommerceTables()
})

describe("İlk admin kurulumu (A/B — D025)", () => {
  it("(A) hiç admin yokken createFirstAdmin geçerli girdiyle başarılı olur ve bir AdminUser + geçerli oturum döner", async () => {
    expect(await adminExists(testPrisma)).toBe(false)

    const result = await createFirstAdmin(
      { email: "sahibi@example.com", password: "guclu-bir-parola-123" },
      testPrisma
    )

    expect(result.success).toBe(true)
    if (!result.success) throw new Error("beklenmedik hata")
    expect(result.session.token).toBeTruthy()
    expect(result.session.expiresAt.getTime()).toBeGreaterThan(Date.now())

    const admin = await testPrisma.adminUser.findUnique({ where: { email: "sahibi@example.com" } })
    expect(admin).not.toBeNull()
    // Parola HİÇBİR ZAMAN düz metin olarak saklanmaz.
    expect(admin!.passwordHash).not.toBe("guclu-bir-parola-123")

    expect(await adminExists(testPrisma)).toBe(true)
  })

  it("(B) bir admin zaten varken createFirstAdmin ikinci bir admin OLUŞTURMAZ, ALREADY_SET_UP döner", async () => {
    const first = await createFirstAdmin({ email: "ilk@example.com", password: "guclu-bir-parola-123" }, testPrisma)
    expect(first.success).toBe(true)

    const second = await createFirstAdmin({ email: "ikinci@example.com", password: "baska-bir-parola-456" }, testPrisma)

    expect(second.success).toBe(false)
    if (second.success) throw new Error("beklenmedik başarı")
    expect(second.error.code).toBe("ALREADY_SET_UP")

    // DB-seviyesi doğrulama: yalnızca İLK admin var, ikinci hiç oluşturulmamış.
    const admins = await testPrisma.adminUser.findMany()
    expect(admins).toHaveLength(1)
    expect(admins[0].email).toBe("ilk@example.com")
  })

  it("(B) EŞZAMANLI iki setup isteği de iki admin OLUŞTURMAZ (advisory lock)", async () => {
    const [resultA, resultB] = await Promise.all([
      createFirstAdmin({ email: "yaris-a@example.com", password: "guclu-bir-parola-123" }, testPrisma),
      createFirstAdmin({ email: "yaris-b@example.com", password: "guclu-bir-parola-456" }, testPrisma),
    ])

    const outcomes = [resultA, resultB]
    const succeeded = outcomes.filter((r) => r.success)
    const failed = outcomes.filter((r) => !r.success)

    // Tam olarak biri başarılı olmalı, diğeri ALREADY_SET_UP ile reddedilmeli
    // — advisory lock ikinciyi ilkinin transaction'ı bitene kadar bekletip
    // GÜNCEL (artık admin var) durumu görmesini sağlar.
    expect(succeeded).toHaveLength(1)
    expect(failed).toHaveLength(1)
    if (failed[0].success) throw new Error("beklenmedik başarı")
    expect(failed[0].error.code).toBe("ALREADY_SET_UP")

    // Asıl kanıt: Promise sonuçlarına değil, DB'ye güven — tam olarak 1 admin.
    const admins = await testPrisma.adminUser.findMany()
    expect(admins).toHaveLength(1)
  })

  it("(B, security'nin doğrulamasının kalıcı hâli) 8 EŞZAMANLI setup isteğinden yalnızca 1'i başarılı olur (pg_advisory_xact_lock)", async () => {
    // security'nin ad-hoc (repoya girmeyen) script'inin gerçek Postgres'e
    // karşı doğruladığı senaryonun kalıcı regresyon testi — bu koruma
    // `pg_advisory_xact_lock`'a dayanıyor (bkz. `lib/auth/setup.ts`); biri
    // transaction sınırını değiştirirse sessizce birden fazla admin oluşmaya
    // başlar ve DB-seviyesi bu assertion dışında bunu yakalayacak başka
    // hiçbir mekanizma yok.
    const attempts = Array.from({ length: 8 }, (_, index) =>
      createFirstAdmin({ email: `yaris-${index}@example.com`, password: "guclu-bir-parola-123" }, testPrisma)
    )
    const outcomes = await Promise.all(attempts)

    const succeeded = outcomes.filter((r) => r.success)
    const failed = outcomes.filter((r) => !r.success)
    expect(succeeded).toHaveLength(1)
    expect(failed).toHaveLength(7)
    for (const failure of failed) {
      if (failure.success) throw new Error("beklenmedik başarı")
      expect(failure.error.code).toBe("ALREADY_SET_UP")
    }

    // Asıl kanıt: 8 Promise sonucuna değil, DB'ye güven.
    const admins = await testPrisma.adminUser.findMany()
    expect(admins).toHaveLength(1)
  })

  it("(B) geçersiz girdide (zayıf parola) INVALID_INPUT döner, admin oluşturulmaz", async () => {
    const result = await createFirstAdmin({ email: "test@example.com", password: "kisa" }, testPrisma)

    expect(result.success).toBe(false)
    if (result.success) throw new Error("beklenmedik başarı")
    expect(result.error.code).toBe("INVALID_INPUT")
    expect(await adminExists(testPrisma)).toBe(false)
  })
})
