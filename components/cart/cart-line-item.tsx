"use client"

import Image from "next/image"
import Link from "next/link"
import { X } from "lucide-react"
import type { CartLine } from "@/lib/cart/types"
import { useCart } from "@/lib/cart/cart-context"
import { PriceDisplay } from "@/components/product/price-display"
import { QuantityStepper } from "./quantity-stepper"

/**
 * `docs/COMPONENT_INVENTORY.md` #6 — çerçevesiz tutarlılık (Card içine
 * alınmaz), boşluk/`Separator`-benzeri bir üst çizgiyle gruplanır (bkz.
 * kullanıldığı yerdeki `divide-y`).
 */
function CartLineItem({ line }: { line: CartLine }) {
  const { setQuantity, removeItem } = useCart()

  return (
    <div className="flex gap-4 py-4">
      <Link
        href={`/urun/${line.productSlug}`}
        className="relative aspect-square size-20 shrink-0 overflow-hidden rounded-md bg-surface-muted outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Image
          src={line.image.url}
          alt={line.image.alt || line.productName}
          fill
          sizes="80px"
          className="object-cover"
          unoptimized={line.image.url.endsWith(".svg")}
        />
      </Link>

      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <Link
              href={`/urun/${line.productSlug}`}
              className="text-product-title font-medium text-foreground outline-none hover:opacity-70 focus-visible:ring-2 focus-visible:ring-ring rounded-sm lg:text-product-title-lg"
            >
              {line.productName}
            </Link>
            {line.attributeSummary && (
              <span className="text-metadata text-muted-foreground lg:text-metadata-lg">{line.attributeSummary}</span>
            )}
          </div>
          <button
            type="button"
            aria-label={`${line.productName} ürününü sepetten çıkar`}
            onClick={() => removeItem(line.variantId)}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-2">
          <QuantityStepper
            quantity={line.quantity}
            onChange={(next) => setQuantity(line.variantId, next)}
          />
          <PriceDisplay price={Number(line.unitPrice) * line.quantity} size="sm" />
        </div>
      </div>
    </div>
  )
}

export { CartLineItem }
