import { ReservationStatus } from "../generated/prisma/client"
import type { Prisma } from "../generated/prisma/client"

/**
 * SUNUCU-TARAFI (DB'ye gider) availability hesaplaması. Saf/görüntüleme
 * yardımcıları (`AvailabilityStatus` tipi, `getAvailabilityStatus`,
 * `getAvailabilityLabel`) BİLİNÇLİ OLARAK `./availability-display.ts`'e
 * taşındı — bu dosya `../generated/prisma/client`'ı (dolayısıyla Prisma
 * runtime'ını) içe aktardığı için CLIENT component'lerden ASLA import
 * edilmemelidir (storefront'un bulduğu gerçek bir bundling sorunu —
 * `pg`'nin Node-only `net`/`tls` bağımlılıkları tarayıcı paketine sızıyordu).
 * Server-taraflı kodun kolaylığı için bu iki sembol burada da re-export
 * edilir, ama bunlar SUNUCU/server component kodunda kullanılmalıdır;
 * client component'ler doğrudan `./availability-display`'den import etmelidir.
 */
export { getAvailabilityStatus, getAvailabilityLabel } from "./availability-display"
export type { AvailabilityStatus } from "./availability-display"

/**
 * D018 — kullanılabilir stok formülünün TEK, PAYLAŞILAN tanımı.
 *
 * `availableQuantity = Variant.stockQuantity - Σ(ACTIVE InventoryReservation.quantity)`
 *
 * Bu formül hem sipariş oluşturma tarafında (`stock.ts` →
 * `assertSufficientStock`, `SELECT ... FOR UPDATE` kilidi ALTINDA, transaction
 * içinde) hem de salt-okunur katalog görüntüleme tarafında (`catalog.ts`,
 * kilitsiz, eventually-consistent) KULLANILIR — iki yerde birbirinden farklı
 * bir yorum OLAMAZ, bu yüzden kod burada tek bir yerde tanımlanır.
 *
 * Süresi geçmiş (`expiresAt < now`) ama henüz bir cron/scheduler tarafından
 * `RELEASED`'a çevrilmemiş `ACTIVE` rezervasyonlar BİLE İSTEYEREK hâlâ
 * "aktif" sayılır — `status` alanı tek doğruluk kaynağıdır, `expiresAt`'a
 * hiç bakılmaz. Bu, sipariş oluşturma tarafının (D018'in otomatik-iptal
 * parçası için henüz bir cron/scheduler yazılmadığı için) zaten sahip olduğu
 * davranışla birebir aynıdır; okuma tarafı farklı bir yorum UYDURMAZ.
 *
 * `db` parametresi bilinçli olarak `Prisma.TransactionClient` tipindedir —
 * ama hem düz `PrismaClient` (üretim singleton'ı, `catalog.ts`'in kullandığı)
 * hem de bir `$transaction` callback'indeki `tx` (`stock.ts`'in kullandığı)
 * yapısal olarak bu tipi karşılar, bu yüzden fonksiyon her iki bağlamda da
 * değişiklik yapılmadan çağrılabilir.
 */
export async function getAvailableQuantities(
  db: Prisma.TransactionClient,
  variantIds: string[]
): Promise<Map<string, number>> {
  if (variantIds.length === 0) return new Map()

  const variants = await db.variant.findMany({
    where: { id: { in: variantIds } },
    select: { id: true, stockQuantity: true },
  })
  const stockByVariantId = new Map(variants.map((variant) => [variant.id, variant.stockQuantity]))

  const activeReservationTotals = await db.inventoryReservation.groupBy({
    by: ["variantId"],
    where: { variantId: { in: variantIds }, status: ReservationStatus.ACTIVE },
    _sum: { quantity: true },
  })
  const reservedByVariantId = new Map(
    activeReservationTotals.map((row) => [row.variantId, row._sum.quantity ?? 0])
  )

  const result = new Map<string, number>()
  for (const variantId of variantIds) {
    const rawStock = stockByVariantId.get(variantId) ?? 0
    const reserved = reservedByVariantId.get(variantId) ?? 0
    result.set(variantId, rawStock - reserved)
  }
  return result
}
