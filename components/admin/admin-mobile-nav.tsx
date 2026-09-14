"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { cn } from "cn"
import { Drawer, DrawerTrigger, DrawerContent, DrawerTitle } from "@/components/ui/drawer"
import { ADMIN_NAV_GROUPS, isNavItemActive } from "./nav-items"

/**
 * `lg:` altında sidebar'ın yerini alan çekmece navigasyonu. Storefront'ta
 * öğrenilen dersler burada uygulandı:
 * - `Drawer.Content` zaten `Drawer.Viewport` içinde render ediyor
 *   (`components/ui/drawer.tsx`), ayrıca bir şey yapmaya gerek yok.
 * - Nav linkleri `DrawerClose render={<Link/>}` ile SARILMADI — bu,
 *   erişilebilirlik ağacında `role="button"` üretip linki bozuyordu
 *   (qa'nın storefront'ta bulduğu bug). Bunun yerine `Drawer` controlled
 *   (`open`/`onOpenChange`) tutulup düz `<Link onClick={() => setOpen(false)}>`
 *   kullanılıyor — gerçek `role="link"`.
 *
 * VIDEO 08 STEP 3 — masaüstü sidebar'la aynı ikon + grup yapısı (`ADMIN_NAV_GROUPS`).
 */
function AdminMobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      {/* size-11 (44px): asgari dokunma hedefi. */}
      <DrawerTrigger
        aria-label="Menüyü aç"
        className="inline-flex size-11 items-center justify-center rounded-md text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
      >
        <Menu className="size-5" />
      </DrawerTrigger>
      <DrawerContent side="left">
        <DrawerTitle>Admin Menü</DrawerTitle>
        <div className="flex flex-col gap-5">
          {ADMIN_NAV_GROUPS.map((group, groupIndex) => (
            <nav
              key={group.label ?? `group-${groupIndex}`}
              aria-label={group.label ?? "Admin navigasyonu"}
              className="flex flex-col gap-1"
            >
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
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-base transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      active ? "bg-foreground text-background" : "text-foreground hover:bg-surface-muted"
                    )}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

export { AdminMobileNav }
