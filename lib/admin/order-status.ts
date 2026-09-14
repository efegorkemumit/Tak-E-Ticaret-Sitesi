/**
 * Sipariş durumu geçiş tablosu — OTORİTER kaynak `docs/PROJECT_BRIEF.md`
 * Bölüm 11'dir, bu dosya onun birebir kodlanmış hâlidir; başka bir yerde
 * (ör. `orders.ts` içinde satır içi) KEYFİ bir geçiş kuralı UYDURULMAZ.
 *
 * CLIENT-SAFE: `../generated/prisma/enums`'tan (sıfır bağımlılıklı) import
 * eder — bir admin UI'ı bu tabloyu, ör. bir durum dropdown'ında hangi hedef
 * durumların GEÇERLİ olduğunu göstermek için, Prisma'yı hiç yüklemeden
 * client component'te de kullanabilir.
 *
 * `paymentStatus`'a BİLİNÇLİ OLARAK hiç bakılmaz (D026) — ödeme onayı Video
 * 08'de; bu tabloyu `paymentStatus`'a göre kısıtlamak admin'in siparişi
 * ilerletmesini engeller.
 */
import { OrderStatus } from "../generated/prisma/enums"

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  [OrderStatus.PAYMENT_PENDING]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.RETURNED],
  [OrderStatus.DELIVERED]: [OrderStatus.RETURNED],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.RETURNED]: [],
}

export function isValidOrderStatusTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_STATUS_TRANSITIONS[from].includes(to)
}

export function getAllowedNextOrderStatuses(from: OrderStatus): readonly OrderStatus[] {
  return ORDER_STATUS_TRANSITIONS[from]
}
