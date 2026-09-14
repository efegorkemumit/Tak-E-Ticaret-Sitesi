"use client"

import { useState } from "react"
import Link from "next/link"
import { ShoppingBag } from "lucide-react"
import { useCart } from "@/lib/cart/cart-context"
import { Drawer, DrawerTrigger, DrawerContent, DrawerTitle } from "@/components/ui/drawer"
import { buttonVariants } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { cn } from "cn"
import { CartLineItem } from "./cart-line-item"
import { CartSummary } from "./cart-summary"

/**
 * `docs/COMPONENT_INVENTORY.md` #13 (Drawer) + #6 (CartLineItem/CartSummary)
 * — mobil + masaüstü için ortak bir sepet çekmecesi. `MobileNav`'la aynı
 * pattern (trigger + content aynı client component'te), gerçek açık/kapalı
 * state'i olduğu için client component.
 *
 * NAV LİNKLERİ İÇİN `DrawerClose`/`DrawerCloseLink` KULLANILMIYOR: bkz.
 * `mobile-nav.tsx`'teki aynı notun tam metni — `DrawerClose` kavramsal
 * olarak her zaman `role="button"` üretir, gerçek `role="link"` asla
 * üretemez. `Drawer` burada da CONTROLLED tutulup düz `<Link onClick=...>`
 * kullanılıyor.
 */
function CartDrawer() {
  const { lines, itemCount, subtotal, isHydrated } = useCart()
  const [open, setOpen] = useState(false)

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      {/* size-11 (44px): asgari dokunma hedefi. */}
      <DrawerTrigger
        aria-label={`Sepet, ${itemCount} ürün`}
        className="relative inline-flex size-11 items-center justify-center rounded-md text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ShoppingBag className="size-5" />
        {isHydrated && itemCount > 0 && (
          <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-foreground text-[0.65rem] text-background">
            {itemCount > 9 ? "9+" : itemCount}
          </span>
        )}
      </DrawerTrigger>
      <DrawerContent side="right">
        <DrawerTitle>Sepetim</DrawerTitle>

        {!isHydrated || lines.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag className="size-8" />}
            title="Sepetiniz boş"
            description="Beğendiğiniz ürünleri sepete ekleyerek alışverişe başlayabilirsiniz."
            action={
              <Link
                href="/urunler"
                onClick={() => setOpen(false)}
                className="text-sm text-foreground underline underline-offset-4"
              >
                Ürünlere göz at
              </Link>
            }
          />
        ) : (
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
            <div className="flex-1 divide-y divide-border overflow-y-auto">
              {lines.map((line) => (
                <CartLineItem key={line.variantId} line={line} />
              ))}
            </div>

            <CartSummary subtotal={subtotal} itemCount={itemCount} />

            <div className="flex flex-col gap-2">
              <Link
                href="/checkout"
                onClick={() => setOpen(false)}
                // min-h-11 (44px) — bkz. product-purchase-panel.tsx'teki aynı not.
                className={cn(buttonVariants({ size: "lg" }), "min-h-11 w-full")}
              >
                Ödemeye Geç
              </Link>
              <Link
                href="/sepet"
                onClick={() => setOpen(false)}
                className="text-center text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
              >
                Sepeti Görüntüle
              </Link>
            </div>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  )
}

export { CartDrawer }
