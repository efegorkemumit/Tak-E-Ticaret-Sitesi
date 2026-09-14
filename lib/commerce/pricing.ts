import { Prisma } from "../generated/prisma/client"
import type { ResolvedOrderItem } from "./resolve-order-items"

export interface OrderPricingLine {
  variantId: string
  quantity: number
  unitPrice: Prisma.Decimal
  lineTotal: Prisma.Decimal
}

export interface OrderPricing {
  subtotal: Prisma.Decimal
  total: Prisma.Decimal
  lines: OrderPricingLine[]
}

/**
 * Sunucu-taraflı fiyat hesaplaması (D022) — `Prisma.Decimal` aritmetiği
 * kullanır, asla `number`/float ile para çarpımı/toplamı YAPILMAZ (ondalık
 * yuvarlama hatası riski nedeniyle).
 *
 * Bu turda kargo ücreti/indirim/kupon/vergi YOK — mevcut kesin kararlarda
 * (`docs/DECISIONS.md`) bu tür bir ücret tanımlı değil, burada UYDURULMADI.
 * Bu yüzden `total === subtotal`. Kargo ücreti ileride eklenirse (OPEN
 * #5-7 netleşince) yalnızca bu fonksiyonun içi değişir; `create-order.ts`
 * çağrısı etkilenmez.
 */
export function calculateOrderPricing(items: ResolvedOrderItem[]): OrderPricing {
  const lines: OrderPricingLine[] = items.map((item) => ({
    variantId: item.variantId,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    lineTotal: item.unitPrice.mul(item.quantity),
  }))

  const subtotal = lines.reduce((sum, line) => sum.add(line.lineTotal), new Prisma.Decimal(0))

  return { subtotal, total: subtotal, lines }
}
