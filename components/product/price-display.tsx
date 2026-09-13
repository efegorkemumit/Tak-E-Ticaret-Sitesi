import { formatPriceTRY } from "@/lib/format"
import { cn } from "cn"

/**
 * `docs/COMPONENT_INVENTORY.md` #19 — ProductCard, ProductGallery/detay,
 * CartLineItem, CartSummary'de tekrar kullanılan ortak fiyat gösterim birimi.
 * shadcn eşleşmesi yok, saf tipografi.
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
          "font-medium text-foreground",
          size === "sm" && "text-sm",
          size === "md" && "text-base",
          size === "lg" && "text-xl"
        )}
      >
        {formatPriceTRY(price)}
      </span>
      {hasDiscount && (
        <span className="text-sm text-muted-foreground line-through">
          {formatPriceTRY(compareAtPrice)}
        </span>
      )}
    </div>
  )
}

export { PriceDisplay }
