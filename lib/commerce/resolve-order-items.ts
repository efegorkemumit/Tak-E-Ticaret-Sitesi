import { ProductStatus, type Prisma } from "../generated/prisma/client"
import { ProductNotPurchasableError, VariantNotFoundError } from "./errors"
import type { CheckoutItemInput } from "./checkout-schema"

export interface ResolvedOrderItem {
  variantId: string
  quantity: number
  sku: string
  unitPrice: Prisma.Decimal
  productId: string
  productName: string
  /** İnsan-okunabilir varyant/öznitelik özeti — `OrderItem` snapshot'ı için. */
  variantDescription: string
}

/**
 * `items[].variantId` referanslarını GERÇEK veritabanı kaydına çözer.
 *
 * D022'nin kritik ilkesi burada uygulanır: fiyat, SKU, ürün adı, öznitelik
 * bilgisi — hiçbiri çağırandan (client'tan) alınmaz, tamamı burada DB'den
 * okunur. Girdi olarak yalnızca `variantId` + `quantity` kabul edilir.
 *
 * Bu fonksiyon her zaman bir `$transaction` callback'indeki `tx` ile
 * çağrılmalıdır (bkz. `create-order.ts`) — kilit/tutarlılık sınırının bir
 * parçası olarak aynı bağlantı üzerinde kalması gerekir.
 */
export async function resolveOrderItems(
  tx: Prisma.TransactionClient,
  items: CheckoutItemInput[]
): Promise<ResolvedOrderItem[]> {
  const variantIds = items.map((item) => item.variantId)

  const variants = await tx.variant.findMany({
    where: { id: { in: variantIds } },
    include: {
      product: true,
      attributeValues: {
        include: { attributeDefinition: true, attributeValue: true },
      },
    },
  })

  const variantById = new Map(variants.map((variant) => [variant.id, variant]))

  const missingVariantIds = variantIds.filter((id) => !variantById.has(id))
  if (missingVariantIds.length > 0) {
    throw new VariantNotFoundError(missingVariantIds)
  }

  return items.map((item) => {
    // Yukarıdaki kontrol nedeniyle burada her zaman bulunur (non-null assertion güvenli).
    const variant = variantById.get(item.variantId)!

    // D021 — yalnızca PUBLISHED ürünler satın alınabilir; DRAFT/ARCHIVED
    // stok durumundan bağımsız olarak asla satılamaz.
    if (variant.product.status !== ProductStatus.PUBLISHED) {
      throw new ProductNotPurchasableError(variant.id, variant.product.status)
    }

    const variantDescription =
      variant.attributeValues
        .map((selection) => `${selection.attributeDefinition.label}: ${selection.attributeValue.value}`)
        .join(", ") || "—"

    return {
      variantId: variant.id,
      quantity: item.quantity,
      sku: variant.sku,
      unitPrice: variant.price,
      productId: variant.productId,
      productName: variant.product.name,
      variantDescription,
    }
  })
}
