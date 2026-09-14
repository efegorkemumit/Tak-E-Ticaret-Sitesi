import { Prisma } from "../generated/prisma/client"
import { InsufficientStockError } from "./errors"
import { getAvailableQuantities } from "./availability"
import type { ResolvedOrderItem } from "./resolve-order-items"

/**
 * Talep edilen `variantId`'lerin satırlarını `SELECT ... FOR UPDATE` ile
 * kilitler.
 *
 * KRİTİK: Bu yalnızca bir `prisma.$transaction(async (tx) => ...)` callback'i
 * İÇİNDE, döndürülen `tx` bağlantısıyla çağrılmalıdır. Aksi halde kilit hiçbir
 * işe yaramaz — her sorgu kendi bağlantısını/transaction'ını alır ve kilit
 * sorgu biter bitmez serbest kalır.
 *
 * Deadlock'ı önlemek için id'ler her zaman ARTAN sırada kilitlenir — tüm
 * çağıranlar aynı sırayı kullandığı sürece, birden fazla varyant içeren iki
 * eşzamanlı sipariş birbirini çevrimsel olarak bekleyip kilitlenmez.
 */
export async function lockVariantsForUpdate(tx: Prisma.TransactionClient, variantIds: string[]): Promise<void> {
  if (variantIds.length === 0) return

  const sortedUniqueIds = Array.from(new Set(variantIds)).sort()

  await tx.$queryRaw`SELECT "id" FROM "Variant" WHERE "id" IN (${Prisma.join(sortedUniqueIds)}) ORDER BY "id" FOR UPDATE`
}

/**
 * Kullanılabilir stoğu (bkz. `availability.ts` → `getAvailableQuantities`,
 * D018'in TEK paylaşılan formülü) her satır için doğrular, yetersizse
 * `InsufficientStockError` fırlatır.
 *
 * ÖNEMLİ (TOCTOU'yu önleme): bu fonksiyon çağrılmadan HEMEN ÖNCE, aynı `tx`
 * ile `lockVariantsForUpdate` çağrılmış olmalıdır. Kilit alınmadan yapılan bir
 * "oku, sonra karar ver" kontrolü, iki eşzamanlı isteğin ikisinin de "stok
 * yeterli" görüp aynı son adedi rezerve etmesine (oversell) yol açabilir —
 * bkz. Risk R1.
 */
export async function assertSufficientStock(
  tx: Prisma.TransactionClient,
  items: ResolvedOrderItem[]
): Promise<void> {
  const availableByVariantId = await getAvailableQuantities(
    tx,
    items.map((item) => item.variantId)
  )

  for (const item of items) {
    const availableStock = availableByVariantId.get(item.variantId) ?? 0
    if (availableStock < item.quantity) {
      throw new InsufficientStockError(item.variantId, item.quantity, availableStock)
    }
  }
}
