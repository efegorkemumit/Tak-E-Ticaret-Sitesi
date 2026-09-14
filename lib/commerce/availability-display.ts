/**
 * SAF (PURE) availability görüntüleme yardımcıları — hiçbir DB/Prisma
 * importu YOK (ne `../prisma` ne de `../generated/prisma/client`). Bu,
 * bilinçli bir ayrımdır: bu dosya hem server hem CLIENT component'lerden
 * güvenle import edilebilir olmalıdır.
 *
 * `AvailabilityStatus`'un asıl "hesaplama" tarafı (`getAvailableQuantities`,
 * DB'ye gidiyor) `./availability.ts`'te kalır — orası `pg`/Prisma runtime'ını
 * (Node-only, `net`/`tls`) içe aktardığı için bir client bundle'a ASLA
 * girmemelidir (bkz. storefront'un bulduğu gerçek bundling sorunu).
 */

/**
 * Jenerik, müşteriye gösterilen stok durumu — gerçek adet DEĞİLDİR.
 */
export type AvailabilityStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK"

/**
 * "Son adet" eşiği — bu SAF BİR UI/GÖRÜNTÜLEME kuralıdır, bir iş kararı
 * DEĞİLDİR (OPEN #8/D018 stok POLİTİKASINI etkilemez, yalnızca müşteriye "az
 * kaldı" ne zaman gösterileceğini belirler). Serbestçe değiştirilebilir.
 */
const LOW_STOCK_THRESHOLD = 3

export function getAvailabilityStatus(availableQuantity: number): AvailabilityStatus {
  if (availableQuantity <= 0) return "OUT_OF_STOCK"
  if (availableQuantity <= LOW_STOCK_THRESHOLD) return "LOW_STOCK"
  return "IN_STOCK"
}

export function getAvailabilityLabel(status: AvailabilityStatus): string {
  switch (status) {
    case "IN_STOCK":
      return "Stokta"
    case "LOW_STOCK":
      return "Son adet"
    case "OUT_OF_STOCK":
      return "Tükendi"
    default:
      return status
  }
}
