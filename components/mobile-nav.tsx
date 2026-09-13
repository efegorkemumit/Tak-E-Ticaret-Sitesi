"use client"

import Link from "next/link"
import { Menu } from "lucide-react"
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer"

/**
 * `docs/COMPONENT_INVENTORY.md` #7 — mobil drawer navigasyonu. Gerçek
 * açık/kapalı state'i burada olduğu için client component
 * (`docs/ARCHITECTURE.md` server/client ayrım ilkesindeki istisnalardan biri).
 */
function MobileNav({ links }: { links: { label: string; href: string }[] }) {
  return (
    <Drawer>
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
            <DrawerClose
              key={link.href}
              render={<Link href={link.href} />}
              className="rounded-md px-2 py-2.5 text-base text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {link.label}
            </DrawerClose>
          ))}
        </nav>
      </DrawerContent>
    </Drawer>
  )
}

export { MobileNav }
