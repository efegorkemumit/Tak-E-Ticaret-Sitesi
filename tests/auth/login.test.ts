import { beforeEach, describe, expect, it } from "vitest"
import { testPrisma } from "../helpers/test-prisma"
import { loginAdmin, getSessionUser } from "../../lib/auth"
import { createAdminUser, resetCommerceTables } from "../helpers/factories"

beforeEach(async () => {
  await resetCommerceTables()
})

const TEST_IP = "127.0.0.1"

describe("Admin login (C/D — D025)", () => {
  it("(D) doğru e-posta/parola ile login başarılı olur, geçerli bir oturum döner", async () => {
    const admin = await createAdminUser({ email: "gecerli@example.com", password: "dogru-parola-123" })

    const result = await loginAdmin({ email: "gecerli@example.com", password: "dogru-parola-123" }, TEST_IP, testPrisma)

    expect(result.success).toBe(true)
    if (!result.success) throw new Error("beklenmedik hata")
    expect(result.session.token).toBeTruthy()

    // Dönen token GERÇEKTEN geçerli bir oturuma çözülüyor mu (getSessionUser
    // ile bağımsız doğrulama — yalnızca loginAdmin'in kendi iddiasına güvenme).
    const sessionUser = await getSessionUser(result.session.token, testPrisma)
    expect(sessionUser?.id).toBe(admin.id)

    // lastLoginAt güncellenmiş olmalı.
    const updated = await testPrisma.adminUser.findUniqueOrThrow({ where: { id: admin.id } })
    expect(updated.lastLoginAt).not.toBeNull()
  })

  it("(C) yanlış parola ile login INVALID_CREDENTIALS döner (jenerik mesaj, hangi alanın yanlış olduğu sızmaz)", async () => {
    await createAdminUser({ email: "gecerli@example.com", password: "dogru-parola-123" })

    const result = await loginAdmin({ email: "gecerli@example.com", password: "yanlis-parola" }, TEST_IP, testPrisma)

    expect(result.success).toBe(false)
    if (result.success) throw new Error("beklenmedik başarı")
    expect(result.error.code).toBe("INVALID_CREDENTIALS")
    expect(result.error.message).toBe("E-posta veya parola hatalı.")
  })

  it("(C) var olmayan bir e-posta ile login de AYNI jenerik mesajı döner (user enumeration önleme)", async () => {
    const result = await loginAdmin({ email: "hicvar-olmayan@example.com", password: "herhangi-bir-sey" }, TEST_IP, testPrisma)

    expect(result.success).toBe(false)
    if (result.success) throw new Error("beklenmedik başarı")
    expect(result.error.code).toBe("INVALID_CREDENTIALS")
    expect(result.error.message).toBe("E-posta veya parola hatalı.")
  })

  it("(C) başarısız denemeler belirli bir eşiği aşınca RATE_LIMITED döner (bellek içi rate-limit, commerce'in kendi sözleşmesi)", async () => {
    await createAdminUser({ email: "hedef@example.com", password: "dogru-parola-123" })
    const uniqueIp = "10.0.0.1"

    let lastResult
    // rate-limit.ts: MAX_ATTEMPTS_PER_WINDOW = 10 — 10'dan fazla yanlış deneme sonrası reddedilmeli.
    for (let i = 0; i < 11; i++) {
      lastResult = await loginAdmin({ email: "hedef@example.com", password: "yanlis" }, uniqueIp, testPrisma)
    }

    expect(lastResult!.success).toBe(false)
    if (lastResult!.success) throw new Error("beklenmedik başarı")
    expect(lastResult!.error.code).toBe("RATE_LIMITED")
  })

  it("(D) doğru parolayla girişten sonra rate-limit sayacı sıfırlanır (meşru kullanıcı cezalandırılmaz)", async () => {
    await createAdminUser({ email: "hedef2@example.com", password: "dogru-parola-123" })
    const uniqueIp = "10.0.0.2"

    // Birkaç yanlış deneme (eşiğin altında).
    for (let i = 0; i < 3; i++) {
      await loginAdmin({ email: "hedef2@example.com", password: "yanlis" }, uniqueIp, testPrisma)
    }
    // Doğru parola ile başarılı giriş.
    const success = await loginAdmin({ email: "hedef2@example.com", password: "dogru-parola-123" }, uniqueIp, testPrisma)
    expect(success.success).toBe(true)

    // Hemen ardından tekrar yanlış parola denense bile RATE_LIMITED DEĞİL,
    // INVALID_CREDENTIALS dönmeli (sayaç sıfırlandığı için).
    const afterSuccess = await loginAdmin({ email: "hedef2@example.com", password: "yanlis" }, uniqueIp, testPrisma)
    expect(afterSuccess.success).toBe(false)
    if (afterSuccess.success) throw new Error("beklenmedik başarı")
    expect(afterSuccess.error.code).toBe("INVALID_CREDENTIALS")
  })
})
