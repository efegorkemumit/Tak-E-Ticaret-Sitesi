/**
 * Admin login iş mantığı — bir Server Action içinden çağrılmak üzere
 * tasarlanmıştır (kendisi `"use server"` İŞARETLİ DEĞİLDİR; admin UI'ı bunu
 * kendi `"use server"` action'ından invoke etmelidir, `checkout-action.ts`
 * deseniyle tutarlı).
 *
 * BİLİNÇLİ OLARAK `./session.ts`'teki cookie-yazan `createSession`'ı DEĞİL,
 * `./session-core.ts`'teki saf `issueSession`'ı çağırır — bu fonksiyon
 * `next/headers`'a hiç dokunmadığı için qa, gerçek bir Next.js request
 * context'i olmadan `testPrisma` ile doğrudan test edebilir. Başarılı
 * girişte dönen `session.token`'ı cookie'ye yazmak, bu fonksiyonu çağıran
 * `"use server"` action'ın (admin UI, `app/` altında) sorumluluğundadır —
 * ör. `await setSessionCookie(result.session.token, result.session.expiresAt)`.
 */
import { prisma } from "../prisma"
import type { PrismaClient } from "../generated/prisma/client"
import { verifyPassword, runTimingSafeDummyVerify } from "./password"
import { issueSession, type IssuedSession } from "./session-core"
import { isRateLimited, recordFailedAttempt, clearRateLimit, buildRateLimitKey } from "./rate-limit"
import { loginInputSchema } from "./schemas"

export type LoginErrorCode = "INVALID_INPUT" | "INVALID_CREDENTIALS" | "RATE_LIMITED"

export type LoginResult =
  | { success: true; session: IssuedSession }
  | { success: false; error: { code: LoginErrorCode; message: string } }

/**
 * D002 gereği tek, jenerik Türkçe mesaj — "e-posta bulunamadı" ile "parola
 * yanlış" arasında hiçbir ayrım yapılmaz (e-posta enumeration'ı önler).
 */
const GENERIC_CREDENTIALS_ERROR = "E-posta veya parola hatalı."
const RATE_LIMITED_ERROR = "Çok fazla başarısız deneme yapıldı. Lütfen birkaç dakika sonra tekrar deneyin."

/**
 * @param ip İsteğin geldiği IP — rate limit anahtarının parçası. Route/Server
 * Action tarafında `headers()`'tan (`x-forwarded-for` vb.) çıkarılıp buraya
 * geçirilmelidir; bu fonksiyon kendisi HTTP isteğine erişmez.
 */
export async function loginAdmin(rawInput: unknown, ip: string, client: PrismaClient = prisma): Promise<LoginResult> {
  const parsed = loginInputSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { success: false, error: { code: "INVALID_INPUT", message: GENERIC_CREDENTIALS_ERROR } }
  }
  const email = parsed.data.email.trim().toLowerCase()
  const { password } = parsed.data

  const rateLimitKey = buildRateLimitKey(ip, email)
  if (isRateLimited(rateLimitKey)) {
    return { success: false, error: { code: "RATE_LIMITED", message: RATE_LIMITED_ERROR } }
  }

  const adminUser = await client.adminUser.findUnique({ where: { email } })

  if (!adminUser) {
    // E-posta enumeration'a karşı: kullanıcı yokken de bir hash doğrulaması
    // ÇALIŞTIR, ki yanıt süresi "kullanıcı var, parola yanlış" durumundan
    // ayırt edilemesin.
    await runTimingSafeDummyVerify(password)
    recordFailedAttempt(rateLimitKey)
    return { success: false, error: { code: "INVALID_CREDENTIALS", message: GENERIC_CREDENTIALS_ERROR } }
  }

  const passwordMatches = await verifyPassword(adminUser.passwordHash, password)
  if (!passwordMatches) {
    recordFailedAttempt(rateLimitKey)
    return { success: false, error: { code: "INVALID_CREDENTIALS", message: GENERIC_CREDENTIALS_ERROR } }
  }

  clearRateLimit(rateLimitKey)
  await client.adminUser.update({ where: { id: adminUser.id }, data: { lastLoginAt: new Date() } })
  const session = await issueSession(adminUser.id, client)

  return { success: true, session }
}
