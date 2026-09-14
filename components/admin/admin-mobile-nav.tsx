"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { cn } from "cn"
import { Drawer, DrawerTrigger, DrawerContent, DrawerTitle } from "@/components/ui/drawer"
import { ADMIN_NAV_ITEMS, isNavItemActive } from "./nav-items"

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
        <nav aria-label="Admin navigasyonu" className="flex flex-col gap-1">
          {ADMIN_NAV_ITEMS.map((item) => {
            const active = isNavItemActive(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-2.5 text-base transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-foreground text-background"
                    : "text-foreground hover:bg-surface-muted"
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </DrawerContent>
    </Drawer>
  )
}

export { AdminMobileNav }
