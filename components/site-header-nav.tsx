"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "cn"

/**
 * VIDEO 08 STEP 2 audit ADD #2 — aktif sayfa göstergesi. `usePathname`
 * gerektirdiği için `SiteHeader`'ın geri kalanından (server component)
 * izole, küçük bir client alt-bileşen — `MobileNav`/`CartDrawer`'la aynı
 * izolasyon ilkesi (yalnızca gerçekten etkileşim/route-farkındalığı
 * gerektiren parça client'a taşınır).
 *
 * "/urunler" ayrıca "/urun/[slug]" ve "/kategori/[slug]" için de aktif
 * sayılır — ikisi de kavramsal olarak ürün kataloğunun bir alt-görünümü
 * (detay/filtre), ayrı bir üst nav öğeleri değil.
 */
function isNavLinkActive(pathname: string, href: string): boolean {
  if (href === "/urunler") {
    return pathname === "/urunler" || pathname.startsWith("/urun/") || pathname.startsWith("/kategori/")
  }
  if (href === "/koleksiyonlar") {
    return pathname === "/koleksiyonlar" || pathname.startsWith("/koleksiyonlar/")
  }
  return pathname === href
}

function SiteHeaderNav({ links }: { links: { label: string; href: string }[] }) {
  const pathname = usePathname()

  return (
    <nav className="hidden items-center gap-8 md:flex" aria-label="Ana navigasyon">
      {links.map((link) => {
        const active = isNavLinkActive(pathname, link.href)
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm",
              "after:absolute after:inset-x-0 after:-bottom-[calc(0.25rem+1px)] after:h-px after:rounded-full after:transition-opacity",
              active
                ? "text-foreground after:bg-foreground after:opacity-100"
                : "text-foreground/80 after:bg-foreground after:opacity-0 hover:text-foreground hover:after:opacity-40"
            )}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}

export { SiteHeaderNav }
