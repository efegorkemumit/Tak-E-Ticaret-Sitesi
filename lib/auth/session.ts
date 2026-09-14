/**
 * Cookie okuyan/yazan İNCE sarmalayıcı katman. Asıl oturum iş mantığı
 * (`issueSession`/`getSessionUser`/`revokeSession`) `./session-core.ts`'tedir
 * ve `next/headers`'a hiç dokunmaz (qa'nın test edilebilirlik talebi) — bu
 * dosya yalnızca cookie okuma/yazmayı o saf fonksiyonlara bağlar.
 *
 * Bu dosyadaki HİÇBİR fonksiyon Vitest'ten doğrudan çağrılmaya uygun
 * DEĞİLDİR (`cookies()` gerçek bir Next.js request context'i ister) — testler
 * `./session-core.ts`'i doğrudan çağırmalıdır.
 */
import { cookies } from "next/headers"
import { prisma } from "../prisma"
import type { PrismaClient } from "../generated/prisma/client"
import { issueSession, getSessionUser, revokeSession } from "./session-core"
import type { AdminSessionUser } from "./session-core"
import { AdminAuthRequiredError } from "./errors"

export type { AdminSessionUser } from "./session-core"

export const ADMIN_SESSION_COOKIE_NAME = "admin_session"

function cookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  }
}

/**
 * `issueSession`'ın döndürdüğü ham token'ı httpOnly cookie olarak set eder.
 * YALNIZCA bir Server Action/Route Handler içinden çağrılabilir. `login.ts`/
 * `setup.ts` KENDİLERİ bunu çağırmaz (testable kalmaları için) — admin UI'ının
 * `"use server"` action'ı, `loginAdmin`/`createFirstAdmin` başarılı döndüğünde
 * bu fonksiyonu (veya doğrudan `createSession`'ı) çağırmalıdır.
 */
export async function setSessionCookie(token: string, expiresAt: Date): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(ADMIN_SESSION_COOKIE_NAME, token, cookieOptions(expiresAt))
}

/**
 * Kolaylık fonksiyonu: `issueSession` + `setSessionCookie` — tek adımda yeni
 * bir oturum açıp cookie'yi set eder. YALNIZCA bir Server Action/Route
 * Handler içinden çağrılabilir.
 */
export async function createSession(adminUserId: string, client: PrismaClient = prisma): Promise<void> {
  const { token, expiresAt } = await issueSession(adminUserId, client)
  await setSessionCookie(token, expiresAt)
}

/**
 * Geçerli isteğin admin oturumunu doğrular. Server Component'lerden
 * (salt-okunur render sırasında) VE Server Action/Route Handler'lardan
 * çağrılabilir — ikisini de desteklemek için cookie temizleme adımı
 * `try/catch` ile sarılıdır (bkz. aşağıdaki yorum).
 */
export async function getCurrentAdmin(client: PrismaClient = prisma): Promise<AdminSessionUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value
  if (!token) return null

  const admin = await getSessionUser(token, client)
  if (!admin) {
    try {
      cookieStore.delete(ADMIN_SESSION_COOKIE_NAME)
    } catch {
      // `getCurrentAdmin` bir Server Component render'ı sırasında (ör. bir
      // layout'ta salt-okunur oturum kontrolü için) çağrılmış olabilir —
      // Next.js bu bağlamda cookie mutasyonuna izin vermez ("Cookies can
      // only be modified in a Server Action or Route Handler"). Bu beklenen
      // bir durumdur: fonksiyon zaten `null` döneceği için geçersiz oturum
      // etkisiz hâle getirilmiş olur; cookie'nin fiilen silinmesi bir
      // sonraki Server Action/Route Handler çağrısında gerçekleşir.
    }
    return null
  }

  return admin
}

/**
 * Geçerli bir oturum yoksa fırlatır. TEK, PAYLAŞILAN guard — her admin
 * server action/route istisnasız bunu çağırmalıdır (kopyala-yapıştır kontrol
 * yazılmaz); Wave B'deki tüm admin domain servisleri bu fonksiyonu kullanır.
 */
export async function requireAdmin(client: PrismaClient = prisma): Promise<AdminSessionUser> {
  const admin = await getCurrentAdmin(client)
  if (!admin) {
    throw new AdminAuthRequiredError()
  }
  return admin
}

/**
 * Gerçek iptal: DB'deki oturum satırına `revokedAt` yazar (aynı token bir
 * daha kabul edilmez) VE cookie'yi siler. YALNIZCA bir Server Action/Route
 * Handler içinden çağrılabilir.
 */
export async function revokeCurrentSession(client: PrismaClient = prisma): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value

  if (token) {
    await revokeSession(token, client)
  }

  cookieStore.delete(ADMIN_SESSION_COOKIE_NAME)
}
