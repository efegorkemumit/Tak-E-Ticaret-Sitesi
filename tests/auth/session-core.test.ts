import { beforeEach, describe, expect, it } from "vitest"
import { testPrisma } from "../helpers/test-prisma"
import { issueSession, getSessionUser, revokeSession } from "../../lib/auth"
import { createAdminUser, createAdminSession, resetCommerceTables } from "../helpers/factories"

beforeEach(async () => {
  await resetCommerceTables()
})

/**
 * `session-core.ts`'in `next/headers`'tan bağımsız SAF iş mantığı — burada
 * doğrudan `testPrisma` ile test edilir, hiçbir mock/cookie enjeksiyonu
 * gerekmez (bkz. dosyanın kendi başlık yorumu). E)'nin ("logout → session
 * geçersiz") GERÇEK cookie/HTTP ayağı Wave C-2'de Playwright ile test
 * edilecek — burada yalnızca ALTINDAKİ DB mantığını (revokeSession sonrası
 * getSessionUser'ın artık kabul etmediğini) doğruluyoruz.
 */
describe("Oturum yaşam döngüsü — session-core (D025)", () => {
  it("issueSession ile üretilen token, getSessionUser ile doğru admin'e çözülür", async () => {
    const admin = await createAdminUser()

    const { token, expiresAt } = await issueSession(admin.id, testPrisma)

    expect(token).toBeTruthy()
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now())

    const sessionUser = await getSessionUser(token, testPrisma)
    expect(sessionUser).toEqual({ id: admin.id, email: admin.email })

    // DB'ye yalnızca HASH yazılmalı, ham token asla saklanmamalı.
    const row = await testPrisma.adminSession.findFirstOrThrow({ where: { adminUserId: admin.id } })
    expect(row.tokenHash).not.toBe(token)
  })

  it("bilinmeyen/uydurma bir token için getSessionUser null döner", async () => {
    const sessionUser = await getSessionUser("hic-var-olmamis-uydurma-token", testPrisma)
    expect(sessionUser).toBeNull()
  })

  it("süresi dolmuş bir token için getSessionUser null döner (satır DB'de var olsa bile)", async () => {
    const admin = await createAdminUser()
    const token = await createAdminSession(admin.id, { expired: true })

    const sessionUser = await getSessionUser(token, testPrisma)
    expect(sessionUser).toBeNull()
  })

  describe("(E'nin DB-mantığı ayağı) revokeSession sonrası ESKİ token bir daha KABUL edilmez", () => {
    it("revokeSession çağrıldıktan sonra AYNI (eski) token'la getSessionUser null döner", async () => {
      const admin = await createAdminUser()
      const token = await createAdminSession(admin.id)

      // Iptalden ÖNCE hâlâ geçerli olduğunu doğrula (asıl testin anlamlı
      // olması için — zaten geçersiz bir şeyi "geçersiz" bulmak kanıt değildir).
      expect(await getSessionUser(token, testPrisma)).not.toBeNull()

      await revokeSession(token, testPrisma)

      // Asıl kanıt: AYNI ham token'ı GERİ SUNSAK bile artık reddediliyor —
      // yalnızca "cookie silindi" değil, sunucu tarafında GERÇEK bir iptal.
      expect(await getSessionUser(token, testPrisma)).toBeNull()

      const row = await testPrisma.adminSession.findFirstOrThrow({ where: { adminUserId: admin.id } })
      expect(row.revokedAt).not.toBeNull()
    })

    it("aynı token'ı İKİ KEZ revoke etmek hataya yol açmaz (idempotent)", async () => {
      const admin = await createAdminUser()
      const token = await createAdminSession(admin.id)

      await revokeSession(token, testPrisma)
      const rowAfterFirst = await testPrisma.adminSession.findFirstOrThrow({ where: { adminUserId: admin.id } })
      const revokedAtFirst = rowAfterFirst.revokedAt

      await expect(revokeSession(token, testPrisma)).resolves.not.toThrow()

      const rowAfterSecond = await testPrisma.adminSession.findFirstOrThrow({ where: { adminUserId: admin.id } })
      // İkinci çağrı `revokedAt`'i DEĞİŞTİRMEMELİ (WHERE revokedAt: null koşulu
      // ikinci denemede hiçbir satırı etkilemez).
      expect(rowAfterSecond.revokedAt?.getTime()).toBe(revokedAtFirst?.getTime())
    })

    it("bilinmeyen bir token'ı revoke etmeye çalışmak sessizce başarısız olur (hata fırlatmaz)", async () => {
      await expect(revokeSession("hic-var-olmamis-token", testPrisma)).resolves.not.toThrow()
    })
  })
})
