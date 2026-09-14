"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { useCart } from "@/lib/cart/cart-context"
import { getPlaceholderImage } from "@/lib/placeholder-image"
import { AttributeButtonGroup } from "./attribute-button-group"
import { PriceDisplay } from "./price-display"
import { QuantityStepper } from "@/components/cart/quantity-stepper"
import {
  getAttributeOptions,
  getAvailabilityLabel,
  getSelectableAttributeTypes,
  resolveVariant,
} from "@/lib/commerce/catalog-display"
import type { CatalogProductDto } from "@/lib/commerce/catalog"

/**
 * Sayfa (`app/urun/[slug]/page.tsx`) server component olarak kalabilsin diye
 * varyant seçimi + fiyat/stok gösterimi + "sepete ekle" bu ayrı client
 * component'e taşındı (yalnızca gerçek etkileşim burada, `docs/ARCHITECTURE.md`
 * server/client ayrım ilkesiyle tutarlı).
 *
 * VIDEO 06 STEP 5 — gerçek client-side sepete ekleme (D022). Sepete eklenen
 * satırdaki fiyat/ürün bilgisi YALNIZCA GÖRÜNTÜLEME amaçlıdır; checkout'ta
 * sunucuya asla gönderilmez (bkz. `lib/cart/types.ts` dosya başı notu).
 * Burada "geçerli bir varyant seçilmemiş/stok yok" kontrolü yalnızca UX
 * amaçlıdır — asıl stok/availability doğrulaması sunucuda yapılır.
 *
 * Hediye paketi notu: `giftPackagingAvailable` yalnızca seçeneğin var
 * olduğunu bilgi olarak gösterir; ücretlendirme/checkout etkisi hâlâ OPEN
 * (`docs/PROJECT_BRIEF.md` Bölüm 10), burada bir toggle/seçim UYDURULMAZ.
 */
function ProductPurchasePanel({ product }: { product: CatalogProductDto }) {
  const { addItem } = useCart()
  const toast = useToast()
  const selectableTypes = useMemo(() => getSelectableAttributeTypes(product), [product])

  const [selection, setSelection] = useState<Record<string, string | undefined>>(() => {
    const initial: Record<string, string | undefined> = {}
    for (const type of selectableTypes) {
      const options = getAttributeOptions(product, type)
      if (options[0]) initial[type] = options[0]
    }
    return initial
  })
  const [quantity, setQuantity] = useState(1)

  const resolvedVariant = resolveVariant(product, selection)
  const displayVariant = resolvedVariant ?? product.variants[0]
  const isOutOfStock = displayVariant.availability === "OUT_OF_STOCK"
  const canAddToCart = Boolean(resolvedVariant) && !isOutOfStock

  function handleAddToCart() {
    if (!resolvedVariant) return
    const attributeSummary = resolvedVariant.attributes.map((a) => `${a.label}: ${a.value}`).join(", ")
    const image = product.images[0] ?? getPlaceholderImage(product.name)

    addItem({
      variantId: resolvedVariant.id,
      quantity,
      productSlug: product.slug,
      productName: product.name,
      attributeSummary,
      unitPrice: resolvedVariant.price,
      image,
      giftPackagingAvailable: product.giftPackagingAvailable,
    })

    toast.add({
      title: "Sepete eklendi",
      description: `${product.name}${attributeSummary ? ` — ${attributeSummary}` : ""}`,
    })
    setQuantity(1)
  }

  return (
    <div className="flex flex-col gap-6">
      <PriceDisplay price={Number(displayVariant.price)} size="lg" />

      {selectableTypes.map((type) => {
        const options = getAttributeOptions(product, type)
        const label =
          product.variants
            .flatMap((variant) => variant.attributes)
            .find((attribute) => attribute.type === type)?.label ?? type
        const disabledOptions = options.filter((option) => {
          const candidate = resolveVariant(product, { ...selection, [type]: option })
          return !candidate || candidate.availability === "OUT_OF_STOCK"
        })
        return (
          <AttributeButtonGroup
            key={type}
            type={type}
            label={label}
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
        {getAvailabilityLabel(displayVariant.availability)}
      </p>

      {product.giftPackagingAvailable && (
        <p className="text-sm text-muted-foreground">
          Hediye paketi seçeneği mevcuttur (ödeme adımında seçilebilir).
        </p>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Adet</span>
          <QuantityStepper quantity={quantity} onChange={setQuantity} disabled={!canAddToCart} />
        </div>
        {/* min-h-11 (44px): paylaşılan Button primitive'inin `lg` boyutu 36px'tir;
            birincil CTA'lar `docs/COMPONENT_INVENTORY.md`'deki 44px asgari dokunma
            hedefini karşılamak için açıkça yükseltilir (primitive'in kendisi
            değiştirilmez — o brand-ui'nin design-system kararı). */}
        <Button size="lg" disabled={!canAddToCart} className="min-h-11 w-full" onClick={handleAddToCart}>
          {isOutOfStock ? "Tükendi" : "Sepete Ekle"}
        </Button>
      </div>
    </div>
  )
}

export { ProductPurchasePanel }
