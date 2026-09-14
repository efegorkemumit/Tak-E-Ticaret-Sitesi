"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "cn"
import { ADMIN_NAV_ITEMS, isNavItemActive } from "./nav-items"

/**
 * Kalıcı masaüstü sidebar — `lg:` (1024px) ve üzeri görünür, altında
 * `AdminMobileNav`'a bırakır. İş odaklı/yoğun görünüm: sade renk, animasyon
 * yok, aktif öğe net bir arka plan/metin kontrastıyla belli.
 */
function AdminSidebar() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Admin navigasyonu"
      className="hidden w-56 shrink-0 flex-col gap-1 border-r border-border p-4 lg:flex"
    >
      {ADMIN_NAV_ITEMS.map((item) => {
        const active = isNavItemActive(pathname, item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-2 text-sm transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-foreground text-background"
                : "text-foreground/80 hover:bg-surface-muted hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

export { AdminSidebar }
