/**
 * İlk admin hesabı kurulumu — `adminExists()` false olduğu sürece erişilebilir
 * bir "setup" akışının iş mantığı. Bir Server Action içinden çağrılmak üzere
 * tasarlanmıştır (`checkout-action.ts` deseniyle tutarlı).
 *
 * `login.ts`'teki aynı gerekçeyle `./session-core.ts`'teki saf `issueSession`'ı
 * çağırır, `./session.ts`'teki cookie-yazan `createSession`'ı DEĞİL — qa
 * `testPrisma` ile doğrudan test edebilsin diye. Cookie'yi set etmek, bunu
 * çağıran `"use server"` action'ın sorumluluğundadır.
 */
import { prisma } from "../prisma"
import type { PrismaClient } from "../generated/prisma/client"
import { hashPassword } from "./password"
import { issueSession, type IssuedSession } from "./session-core"
import { setupInputSchema } from "./schemas"
import { SetupAlreadyCompletedError } from "./errors"

export type SetupErrorCode = "INVALID_INPUT" | "ALREADY_SET_UP"

export type CreateFirstAdminResult =
  | { success: true; session: IssuedSession }
  | { success: false; error: { code: SetupErrorCode; message: string } }

export async function adminExists(client: PrismaClient = prisma): Promise<boolean> {
  const count = await client.adminUser.count()
  return count > 0
}

/**
 * Sabit, projeye özgü keyfi bir sayı — Postgres advisory lock anahtarı.
 * Yalnızca setup akışının kendi içinde tutarlı olması gerekir, başka hiçbir
 * anlamı yoktur.
 */
const SETUP_ADVISORY_LOCK_KEY = 851102

/**
 * İlk (ve D005 gereği TEK) admin hesabını oluşturur.
 *
 * Yarış koşulu koruması: iki eşzamanlı setup isteği aynı anda
 * `adminExists() === false` görüp iki admin oluşturmasın diye, kontrol +
 * oluşturma tek bir transaction içinde VE bir Postgres transaction-seviyesi
 * advisory lock (`pg_advisory_xact_lock`) altında yapılır — ikinci istek,
 * ilkinin transaction'ı commit/rollback olana kadar bu satırda bloke olur,
 * sonra "zaten kurulmuş" durumunu doğru şekilde görür. Advisory lock,
 * transaction bittiğinde Postgres tarafından otomatik serbest bırakılır
 * (elle "unlock" çağrısı gerekmez).
 */
export async function createFirstAdmin(rawInput: unknown, client: PrismaClient = prisma): Promise<CreateFirstAdminResult> {
  const parsed = setupInputSchema.safeParse(rawInput)
  if (!parsed.success) {
    return {
      success: false,
      error: { code: "INVALID_INPUT", message: parsed.error.issues[0]?.message ?? "Geçersiz girdi." },
    }
  }
  const email = parsed.data.email.trim().toLowerCase()
  const { password } = parsed.data

  try {
    const admin = await client.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${SETUP_ADVISORY_LOCK_KEY})`

      const existingCount = await tx.adminUser.count()
      if (existingCount > 0) {
        throw new SetupAlreadyCompletedError()
      }

      const passwordHash = await hashPassword(password)
      return tx.adminUser.create({ data: { email, passwordHash } })
    })

    const session = await issueSession(admin.id, client)
    return { success: true, session }
  } catch (error) {
    if (error instanceof SetupAlreadyCompletedError) {
      return { success: false, error: { code: "ALREADY_SET_UP", message: error.message } }
    }
    throw error
  }
}
