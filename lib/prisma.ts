/**
 * SUNUCU TARAFI Prisma Client singleton.
 *
 * Next.js dev modunda hot-reload her modül yeniden yüklendiğinde yeni bir
 * `PrismaClient` (ve dolayısıyla yeni bir bağlantı havuzu) oluşturulmasını
 * önlemek için `globalThis` üzerinde tekil bir örnek saklanır — bu, Prisma'nın
 * kendi resmi Next.js entegrasyon deseni.
 *
 * Şemamız Prisma 7'nin yeni `"prisma-client"` generator'ını kullanıyor; bu
 * generator artık `DATABASE_URL`'i örtük okumuyor, bağlantı açıkça bir sürücü
 * adaptörü (`@prisma/adapter-pg`) üzerinden verilmelidir (bkz.
 * `.claude/skills/prisma-database-setup/references/postgresql.md` ve
 * `prisma/seed.ts`'teki aynı desen).
 *
 * Bu dosya yalnızca sunucu tarafında (route handler, server component, server
 * action, script) import edilmelidir — client component'e asla girmemelidir.
 */
import { PrismaClient } from "./generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

declare global {
  var __commercePrismaClient: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  return new PrismaClient({ adapter })
}

export const prisma: PrismaClient = globalThis.__commercePrismaClient ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalThis.__commercePrismaClient = prisma
}
