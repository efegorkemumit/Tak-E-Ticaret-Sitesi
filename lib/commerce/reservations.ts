import { ReservationStatus, type Prisma } from "../generated/prisma/client"
import type { ResolvedOrderItem } from "./resolve-order-items"

/**
 * D018 — sipariş oluşturulduğu anda, her satır kalemi için ACTIVE bir
 * stok rezervasyonu oluşturulacak girdiyi hazırlar (nested `create` içinde
 * `Order.reservations` ilişkisine bağlanmak üzere).
 *
 * `Variant.stockQuantity` burada DEĞİŞTİRİLMEZ — bkz. `stock.ts` başındaki
 * ledger açıklaması.
 */
export function buildReservationCreateInputs(
  items: ResolvedOrderItem[],
  expiresAt: Date
): Prisma.InventoryReservationUncheckedCreateWithoutOrderInput[] {
  return items.map((item) => ({
    variantId: item.variantId,
    quantity: item.quantity,
    status: ReservationStatus.ACTIVE,
    expiresAt,
  }))
}
