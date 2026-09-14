/**
 * Testlere ÖZEL, üretim singleton'ından (`lib/prisma.ts`) TAMAMEN AYRI bir
 * `PrismaClient` örneği.
 *
 * NEDEN AYRI: `lib/prisma.ts`, uygulamanın kendi `DATABASE_URL`'ini okur.
 * Testler yıkıcıdır (`resetCommerceTables()` her testten önce TRUNCATE
 * CASCADE çalıştırır) — bu yüzden testlerin `DATABASE_URL`'e HİÇBİR ZAMAN
 * dokunmaması, yalnızca ayrı, açıkça test amaçlı `TEST_DATABASE_URL`'e
 * bağlanması gerekir (qa'nın bulgusu + team-lead'in istediği ek izolasyon
 * katmanı). Bu dosya, `lib/commerce/create-order.ts`'in artık kabul ettiği
 * `client` dependency injection parametresiyle birlikte kullanılır — test
 * kodu asla `lib/prisma.ts`'i import ETMEZ.
 *
 * Doğrulama (`tests/setup.ts`'te yapılır, burada TEKRARLANMAZ): bu modül
 * yalnızca `tests/setup.ts` zaten `TEST_DATABASE_URL`'in var olduğunu, gerçek
 * `DATABASE_URL`'den FARKLI olduğunu ve ephemeral bir `prisma dev`
 * örneğine benzediğini doğruladıktan SONRA import edilmelidir — bu yüzden
 * `vitest.config.ts`'teki `setupFiles` sırası önemlidir.
 */
import { PrismaClient } from "../../lib/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.TEST_DATABASE_URL })

export const testPrisma = new PrismaClient({ adapter })
