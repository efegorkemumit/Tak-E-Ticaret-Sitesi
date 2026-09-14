"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu } from "lucide-react"
import { Drawer, DrawerTrigger, DrawerContent, DrawerTitle } from "@/components/ui/drawer"

/**
 * `docs/COMPONENT_INVENTORY.md` #7 — mobil drawer navigasyonu. Gerçek
 * açık/kapalı state'i burada olduğu için client component
 * (`docs/ARCHITECTURE.md` server/client ayrım ilkesindeki istisnalardan biri).
 *
 * NAV LİNKLERİ İÇİN `DrawerClose`/`DrawerCloseLink` KULLANILMIYOR: qa'nın
 * bulduğu gibi `DrawerClose` kavramsal olarak her zaman bir "buton"dur
 * (Base UI'ın kendi tip tanımı: "A button that closes the drawer") —
 * `nativeButton={false}` yalnızca "gerçek `<button>` mi yoksa taklit mi"
 * ayrımını yapar, "buton mu link mi" ayrımını YAPMAZ; sonuç olarak
 * erişilebilirlik ağacında her zaman `role="button"` kalır, gerçek bir
 * `role="link"` asla üretilemez. Bu yüzden `Drawer` burada CONTROLLED
 * (`open`/`onOpenChange`) tutulur ve nav linkleri düz `<Link>` (gerçek `<a>`,
 * gerçek `role="link"`) olarak render edilir; tıklanınca `onClick` ile
 * drawer manuel kapatılır.
 */
function MobileNav({ links }: { links: { label: string; href: string }[] }) {
  const [open, setOpen] = useState(false)

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      {/* size-11 (44px): asgari dokunma hedefi. */}
      <DrawerTrigger
        aria-label="Menüyü aç"
        className="inline-flex size-11 items-center justify-center rounded-md text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
      >
        <Menu className="size-5" />
      </DrawerTrigger>
      <DrawerContent side="right">
        <DrawerTitle>Menü</DrawerTitle>
        <nav className="flex flex-col gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-2.5 text-base text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </DrawerContent>
    </Drawer>
  )
}

export { MobileNav }
