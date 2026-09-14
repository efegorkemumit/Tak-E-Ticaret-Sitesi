import type { Prisma } from "../generated/prisma/client"
import type { ResolvedOrderItem } from "./resolve-order-items"
import type { OrderPricingLine } from "./pricing"

/**
 * `OrderItem` satırlarının SNAPSHOT girdisini hazırlar — sipariş anındaki
 * SKU/ürün adı/varyant açıklaması/birim fiyatı sabitler; Variant/Product
 * sonradan değişse bile geçmiş sipariş bu satırlardan etkilenmez (D017/D022
 * tutarlılığı).
 */
export function buildOrderItemCreateInputs(
  resolvedItems: ResolvedOrderItem[],
  pricingLines: OrderPricingLine[]
): Prisma.OrderItemUncheckedCreateWithoutOrderInput[] {
  const resolvedByVariantId = new Map(resolvedItems.map((item) => [item.variantId, item]))

  return pricingLines.map((line) => {
    // Aynı listeden türetildiği için burada her zaman bulunur.
    const resolved = resolvedByVariantId.get(line.variantId)!

    return {
      variantId: line.variantId,
      skuSnapshot: resolved.sku,
      productNameSnapshot: resolved.productName,
      variantDescriptionSnapshot: resolved.variantDescription,
      unitPriceSnapshot: line.unitPrice,
      quantity: line.quantity,
      lineTotal: line.lineTotal,
    }
  })
}
