"use client"

import Link from "next/link"
import { ShoppingBag } from "lucide-react"
import { useCart } from "@/lib/cart/cart-context"
import { CartLineItem } from "@/components/cart/cart-line-item"
import { CartSummary } from "@/components/cart/cart-summary"
import { EmptyState } from "@/components/ui/empty-state"
import { buttonVariants } from "@/components/ui/button"
import { Container } from "@/components/container"
import { cn } from "cn"

/**
 * Tam sayfa sepet görünümü — `CartDrawer` (hızlı erişim) ile aynı
 * component'leri (`CartLineItem`/`CartSummary`) paylaşır, yalnızca sayfa
 * düzeninde. Sepet tamamen client-side (D022) olduğu için bu sayfa da
 * baştan sona client component'tir — sunucudan çekilecek bir veri yok.
 */
export default function CartPage() {
  const { lines, itemCount, subtotal, isHydrated } = useCart()

  return (
    <Container size="narrow" className="py-10 lg:py-16">
      <h1 className="mb-8 font-display text-page-title text-foreground lg:text-page-title-lg">Sepetim</h1>

      {!isHydrated ? null : lines.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="size-8" />}
          title="Sepetiniz boş"
          description="Beğendiğiniz ürünleri sepete ekleyerek alışverişe başlayabilirsiniz."
          action={
            <Link href="/urunler" className={cn(buttonVariants({}), "min-h-11")}>
              Ürünlere göz at
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="divide-y divide-border">
            {lines.map((line) => (
              <CartLineItem key={line.variantId} line={line} />
            ))}
          </div>

          <CartSummary subtotal={subtotal} itemCount={itemCount} />

          <Link href="/checkout" className={cn(buttonVariants({ size: "lg" }), "min-h-11 w-full")}>
            Ödemeye Geç
          </Link>
        </div>
      )}
    </Container>
  )
}
