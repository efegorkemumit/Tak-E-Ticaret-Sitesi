"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { AttributeButtonGroup } from "./attribute-button-group"
import { PriceDisplay } from "./price-display"
import {
  getAttributeOptions,
  getAvailabilityLabel,
  getSelectableAttributeTypes,
  resolveVariant,
} from "@/lib/catalog"
import type { AttributeType, Product } from "@/lib/catalog"

/**
 * Sayfa (`app/urun/[slug]/page.tsx`) server component olarak kalabilsin diye
 * varyant seçimi + fiyat/stok gösterimi + "sepete ekle" bu ayrı client
 * component'e taşındı (yalnızca gerçek etkileşim burada, `docs/ARCHITECTURE.md`
 * server/client ayrım ilkesiyle tutarlı).
 *
 * FIRST IMPLEMENTATION WAVE kapsamı: gerçek sepet/stok/checkout mantığı YOK.
 * "Sepete Ekle" kasıtlı olarak disabled ve demo olduğu açıkça belirtilir.
 */
function ProductPurchasePanel({ product }: { product: Product }) {
  const selectableTypes = useMemo(() => getSelectableAttributeTypes(product), [product])

  const [selection, setSelection] = useState<Partial<Record<AttributeType, string>>>(() => {
    const initial: Partial<Record<AttributeType, string>> = {}
    for (const type of selectableTypes) {
      const options = getAttributeOptions(product, type)
      if (options[0]) initial[type] = options[0]
    }
    return initial
  })

  const resolvedVariant = resolveVariant(product, selection) ?? product.variants[0]
  const isOutOfStock = resolvedVariant.availability === "OUT_OF_STOCK"

  return (
    <div className="flex flex-col gap-6">
      <PriceDisplay
        price={resolvedVariant.discountedPrice ?? resolvedVariant.price}
        compareAtPrice={resolvedVariant.discountedPrice ? resolvedVariant.price : undefined}
        size="lg"
      />

      {selectableTypes.map((type) => {
        const options = getAttributeOptions(product, type)
        const disabledOptions = options.filter((option) => {
          const candidate = resolveVariant(product, { ...selection, [type]: option })
          return !candidate || candidate.availability === "OUT_OF_STOCK"
        })
        return (
          <AttributeButtonGroup
            key={type}
            type={type}
            options={options}
            value={selection[type]}
            disabledOptions={disabledOptions}
            onValueChange={(value) =>
              setSelection((current) => ({ ...current, [type]: value }))
            }
          />
        )
      })}

      <p className="text-sm text-muted-foreground">
        {getAvailabilityLabel(resolvedVariant.availability)}
      </p>

      {product.giftPackagingAvailable && (
        <p className="text-sm text-muted-foreground">
          Hediye paketi seçeneği mevcuttur (ödeme adımında seçilebilir).
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Button size="lg" disabled className="w-full">
          {isOutOfStock ? "Tükendi" : "Sepete Ekle"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Bu aşamada sepet işlevi demo amaçlıdır; yakında aktif olacaktır.
        </p>
      </div>
    </div>
  )
}

export { ProductPurchasePanel }
