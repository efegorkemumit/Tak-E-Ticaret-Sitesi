/**
 * Oturum yaşam döngüsünün SAF iş mantığı — `next/headers`/cookie okuma-yazma
 * KATMANINDAN bilinçli olarak AYRIDIR (qa'nın test edilebilirlik talebi,
 * `lib/commerce/create-order.ts`'teki `client: PrismaClient = prisma`
 * dependency-injection deseniyle birebir aynı gerekçe): bu dosyadaki
 * fonksiyonlar yalnızca ham bir token string'i ve bir Prisma client alır,
 * `next/headers`'a hiç dokunmaz — bu sayede Vitest, gerçek bir Next.js
 * request context'i (route/Server Action) OLMADAN, `testPrisma` enjekte
 * ederek bunları DOĞRUDAN çağırabilir (`checkout-action.test.ts`'in
 * `submitCheckoutOrder`'ı doğrudan çağırma şekliyle aynı).
 *
 * Cookie okuyan/yazan ince sarmalayıcı katman `./session.ts`'tedir —
 * `getCurrentAdmin`/`requireAdmin`/`createSession`/`revokeCurrentSession` o
 * dosyada kalır ve burayı çağırır.
 */
import { prisma } from "../prisma"
import type { PrismaClient } from "../generated/prisma/client"
import { generateSessionToken, hashSessionToken } from "./token"

/** DB'deki `expiresAt` ile AYNI değer kullanılır — ikisi asla birbirinden bağımsız sürüklenmemeli. */
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 gün

export interface AdminSessionUser {
  id: string
  email: string
}

export interface IssuedSession {
  /** HAM (hash'lenmemiş) token — cookie'ye yazmak çağıranın (cookie katmanının) işidir. */
  token: string
  expiresAt: Date
}

/** Yeni bir `AdminSession` satırı oluşturur; yalnızca token'ın SHA-256 hash'i DB'ye yazılır. */
export async function issueSession(adminUserId: string, client: PrismaClient = prisma): Promise<IssuedSession> {
  const token = generateSessionToken()
  const tokenHash = hashSessionToken(token)
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)

  await client.adminSession.create({
    data: { adminUserId, tokenHash, expiresAt },
  })

  return { token, expiresAt }
}

/**
 * Ham bir token'ı doğrular: eşleşen kayıt var mı, `revokedAt` null mı,
 * `expiresAt` gelecekte mi. Cookie/HTTP katmanından tamamen bağımsızdır —
 * geçersiz bir cookie'yi TEMİZLEMEZ, bu `./session.ts`'in sorumluluğundadır.
 */
export async function getSessionUser(token: string, client: PrismaClient = prisma): Promise<AdminSessionUser | null> {
  const tokenHash = hashSessionToken(token)
  const session = await client.adminSession.findUnique({
    where: { tokenHash },
    include: { adminUser: true },
  })

  const isValid = session !== null && session.revokedAt === null && session.expiresAt.getTime() > Date.now()
  if (!isValid) return null

  return { id: session.adminUser.id, email: session.adminUser.email }
}

/**
 * Ham bir token'a karşılık gelen oturumu iptal eder. `revokedAt: null`
 * koşulu bu işlemi idempotent kılar (zaten iptal edilmiş bir token'ı tekrar
 * iptal etmeye çalışmak hataya yol açmaz).
 */
export async function revokeSession(token: string, client: PrismaClient = prisma): Promise<void> {
  const tokenHash = hashSessionToken(token)
  await client.adminSession.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}
