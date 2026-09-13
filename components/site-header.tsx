import Link from "next/link"
import { ShoppingBag } from "lucide-react"
import { MobileNav } from "./mobile-nav"

/**
 * `docs/COMPONENT_INVENTORY.md` #7 — navigasyon iskeleti. Sunucu component:
 * gerçek etkileşim yalnızca mobil menüde (`MobileNav`, ayrı client component).
 * `app/layout.tsx`'e bağlıdır, route'ların kendi içine tekrar header eklemesi
 * gerekmez.
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
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="font-display text-lg tracking-tight text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
        >
          [Marka Adı]
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Ana navigasyon">
          {NAV_LINKS.slice(1).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-foreground/80 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <span
            aria-disabled="true"
            title="Sepet — bu aşamada demo amaçlıdır, yakında aktif olacaktır"
            className="inline-flex size-8 cursor-not-allowed items-center justify-center rounded-md text-muted-foreground"
          >
            <ShoppingBag className="size-5" />
          </span>
          <MobileNav links={NAV_LINKS} />
        </div>
      </div>
    </header>
  )
}

export { SiteHeader }
