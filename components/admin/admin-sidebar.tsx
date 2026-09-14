"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "cn"
import { ADMIN_NAV_GROUPS, isNavItemActive } from "./nav-items"

/**
 * Kalıcı masaüstü sidebar — `lg:` (1024px) ve üzeri görünür, altında
 * `AdminMobileNav`'a bırakır.
 *
 * VIDEO 08 STEP 3 — brand-ui'nin kesinleştirdiği ölçüler:
 * genişlik 248px; üstte 64px marka bandı (32px monogram kare + "[Marka
 * Adı] Admin" 14px/600 — audit'in "sidebar doğrudan nav öğesiyle başlıyor"
 * bulgusunun düzeltmesi); nav öğeleri 40px yükseklik, 18px ikon + 14px/500
 * etiket; aktif öğe `primary/10` arka plan + `primary` metin + solda 3px
 * `primary` şerit (spec'in "accent" niyeti zaten `var(--primary)` — bkz.
 * `app/globals.css`'teki gerekçe notu, ayrı bir "accent" token'ı YOK).
 */
const SIDEBAR_WIDTH = "w-[248px]"

function AdminSidebar() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Admin navigasyonu"
      className={cn("hidden shrink-0 flex-col border-r border-border lg:flex", SIDEBAR_WIDTH)}
    >
      <div className="flex h-16 items-center gap-2.5 border-b border-border px-4">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-muted text-sm font-semibold text-primary">
          M
        </span>
        <span className="text-sm font-semibold text-foreground">[Marka Adı] Admin</span>
      </div>
      <div className="flex flex-col gap-5 overflow-y-auto p-3">
        {ADMIN_NAV_GROUPS.map((group, groupIndex) => (
          <div key={group.label ?? `group-${groupIndex}`} className="flex flex-col gap-0.5">
            {group.label && (
              <p className="px-3 pb-1 text-xs font-medium tracking-wide text-muted-foreground">{group.label}</p>
            )}
            {group.items.map((item) => {
              const active = isNavItemActive(pathname, item.href)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-10 items-center gap-2.5 rounded-md border-l-[3px] pl-2.5 pr-3 text-sm transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "border-primary bg-primary/10 font-medium text-primary"
                      : "border-transparent text-foreground/80 hover:bg-surface-muted hover:text-foreground"
                  )}
                >
                  <Icon className="size-[18px] shrink-0" aria-hidden="true" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}
      </div>
    </nav>
  )
}

export { AdminSidebar, SIDEBAR_WIDTH }
