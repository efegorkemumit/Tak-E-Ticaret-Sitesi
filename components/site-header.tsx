import Link from "next/link"
import { Container } from "@/components/container"
import { SiteHeaderNav } from "@/components/site-header-nav"
import { MobileNav } from "./mobile-nav"
import { CartDrawer } from "./cart/cart-drawer"

/**
 * `docs/COMPONENT_INVENTORY.md` #7 — navigasyon iskeleti. Sunucu component:
 * gerçek etkileşim yalnızca mobil menüde (`MobileNav`), sepette
 * (`CartDrawer`) ve aktif-link vurgusunda (`SiteHeaderNav`) — üçü de ayrı
 * client component.
 *
 * VIDEO 08 STEP 2 — üç bölgeli dengeli yerleşim (marka / nav / aksiyonlar),
 * `Container` (tek konteyner kaynağı, bkz. `components/container.tsx`) ve
 * ortak `SiteHeaderNav` aktif-sayfa göstergesiyle (audit ADD #2). Yükseklik
 * bilinçli olarak abartılmadı (`h-16`) — güç, artan boşluk/tipografi
 * ağırlığından geliyor, yükseklikten değil.
 *
 * Marka adı hâlâ OPEN (`docs/OPEN_QUESTIONS.md` #1) — brand-ui'nin
 * `app/layout.tsx` metadata'sıyla aynı `[Marka Adı]` placeholder'ı kullanılır.
 */
const NAV_LINKS = [
  { label: "Ana Sayfa", href: "/" },
  { label: "Koleksiyonlar", href: "/koleksiyonlar" },
  { label: "Ürünler", href: "/urunler" },
]

function SiteHeader() {
  return (
    <header className="border-b border-border">
      <Container className="grid h-16 grid-cols-[1fr_auto_1fr] items-center">
        <Link
          href="/"
          className="w-fit font-display text-lg tracking-tight text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
        >
          [Marka Adı]
        </Link>

        <SiteHeaderNav links={NAV_LINKS.slice(1)} />

        <div className="flex items-center justify-end gap-1">
          <CartDrawer />
          <MobileNav links={NAV_LINKS} />
        </div>
      </Container>
    </header>
  )
}

export { SiteHeader }
