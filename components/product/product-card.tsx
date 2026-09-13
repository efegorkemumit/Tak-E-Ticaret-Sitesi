import Image from "next/image"
import Link from "next/link"
import { cn } from "cn"
import type { Product } from "@/lib/catalog"
import { getPriceSummary, isProductOutOfStock } from "@/lib/catalog"
import { PriceDisplay } from "./price-display"

/**
 * `docs/COMPONENT_INVENTORY.md` #2 — ÇERÇEVESİZ ürün kartı. shadcn `Card`
 * bilinçli olarak kullanılmaz (varsayılan border/gölge "Açık Alan"ın
 * çerçevesiz ilkesiyle çelişir). Kart tamamen tıklanabilir tek bir `Link`;
 * çerçeve olmadığı için görünür `focus-visible` halkası zorunludur (a11y).
 *
 * D012 guard: `image.isRealProductPhoto` false ise (bu fixture'da her zaman
 * false) görsel sessizce gerçek ürün fotoğrafı gibi SUNULMAZ — üzerine
 * "Örnek görsel" etiketi eklenir, böylece placeholder olduğu açıkça belli olur.
 */
function ProductCard({ product, className }: { product: Product; className?: string }) {
  const image = product.images[0]
  const price = getPriceSummary(product)
  const outOfStock = isProductOutOfStock(product)

  return (
    <Link
      href={`/urun/${product.slug}`}
      className={cn(
        "group/product-card flex flex-col gap-3 rounded-md outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-surface-muted">
        {image && (
          <Image
            src={image.url}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover"
            // SVG placeholder'lar Next.js image optimizer'ın varsayılan SVG
            // kısıtlamasına takılmasın diye optimize edilmeden sunulur; gerçek
            // ürün fotoğrafları (jpg/png/webp) geldiğinde bu koşul devre dışı kalır.
            unoptimized={image.url.endsWith(".svg")}
          />
        )}
        {image && !image.isRealProductPhoto && (
          <span className="absolute left-2 top-2 rounded-full bg-background/90 px-2 py-0.5 text-[0.7rem] text-muted-foreground">
            Örnek görsel
          </span>
        )}
        {outOfStock && (
          <span className="absolute right-2 top-2 rounded-full bg-background/90 px-2 py-0.5 text-[0.7rem] text-muted-foreground">
            Tükendi
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1 transition-opacity group-hover/product-card:opacity-70">
        <p className="text-sm text-foreground">{product.name}</p>
        <PriceDisplay price={price.displayPrice} compareAtPrice={price.compareAtPrice} size="sm" />
      </div>
    </Link>
  )
}

export { ProductCard }
