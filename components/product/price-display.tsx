import { formatPriceTRY } from "@/lib/format"
import { cn } from "cn"

/**
 * `docs/COMPONENT_INVENTORY.md` #19 — ProductCard, ProductGallery/detay,
 * CartLineItem, CartSummary'de tekrar kullanılan ortak fiyat gösterim birimi.
 * shadcn eşleşmesi yok, saf tipografi.
 *
 * VIDEO 08 — punto/ağırlık `docs/DESIGN_DIRECTION.md`'deki "Price" satırıyla
 * BİREBİR: sm/md 500 ağırlık, lg 600; üçü de `tabular-nums` (rakamlar sabit
 * genişlikte, fiyat değiştiğinde yan metin kaymaz). Fiyat gövde metniyle
 * (`text-body`) ASLA aynı ağırlıkta değildir — bu, Video 07 audit'inin kök
 * bulgusuydu.
 */
function PriceDisplay({
  price,
  compareAtPrice,
  size = "md",
  className,
}: {
  price: number
  compareAtPrice?: number
  size?: "sm" | "md" | "lg"
  className?: string
}) {
  const hasDiscount = compareAtPrice !== undefined && compareAtPrice > price

  return (
    <div className={cn("flex items-baseline gap-2", className)}>
      <span
        className={cn(
          "tabular-nums text-foreground",
          size === "sm" && "text-price-sm font-medium",
          size === "md" && "text-price-md font-medium",
          size === "lg" && "text-price-lg font-semibold"
        )}
      >
        {formatPriceTRY(price)}
      </span>
      {hasDiscount && (
        <span className="text-metadata tabular-nums text-muted-foreground line-through lg:text-metadata-lg">
          {formatPriceTRY(compareAtPrice)}
        </span>
      )}
    </div>
  )
}

export { PriceDisplay }
