"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight } from "lucide-react"
import type { ReactNode } from "react"
import { getActiveNavItem } from "./nav-items"
import { AdminMobileNav } from "./admin-mobile-nav"

/**
 * Kalıcı üst şerit — mobil menü tetikleyicisi + gerçek bir breadcrumb (Admin
 * Paneli / mevcut bölüm) + admin e-postası/çıkış için slot'lar.
 *
 * VIDEO 08 STEP 3 düzeltmesi (audit bulgusu): önceden burada sayfanın kendi
 * `AdminPageHeader` başlığıyla (`h2`) BİREBİR AYNI kelimeyi tekrar eden düz
 * bir `h1` vardı (ör. "Ürünler" / "Ürünler"). İki seçenekten ("birini
 * kaldır" ya da "gerçek bir breadcrumb'a dönüştür") İKİNCİSİ seçildi —
 * bunun ek bir faydası var: ürün/sipariş DETAY sayfalarında (`/admin/
 * products/[id]`) orta segment ("Ürünler") artık listeye geri dönen GERÇEK
 * bir link — önceden eksik olan "listeye dönüş" işlevini de karşılıyor.
 * Segment yalnızca mevcut path segment'in href'iyle BİREBİR eşleştiğinde
 * (yani gerçekten o listenin kendisindeyken) tıklanamaz/"mevcut sayfa"
 * olarak işaretlenir.
 */
function AdminTopbar({
  adminEmail,
  logoutSlot,
}: {
  adminEmail?: string
  logoutSlot?: ReactNode
}) {
  const pathname = usePathname()
  const activeItem = getActiveNavItem(pathname)
  const isOnSectionRoot = activeItem ? pathname === activeItem.href : pathname === "/admin"

  const initial = adminEmail?.trim().charAt(0).toUpperCase()

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <AdminMobileNav />
        <nav aria-label="Konum" className="min-w-0">
          <ol className="flex min-w-0 items-center gap-1.5 text-admin-helper text-muted-foreground">
            <li className="flex shrink-0 items-center gap-1.5">
              <Link href="/admin" className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
                Admin Paneli
              </Link>
              {activeItem && activeItem.href !== "/admin" && <ChevronRight className="size-3.5" aria-hidden="true" />}
            </li>
            {activeItem && activeItem.href !== "/admin" && (
              <li className="min-w-0 truncate">
                {isOnSectionRoot ? (
                  <span aria-current="page" className="text-foreground">
                    {activeItem.label}
                  </span>
                ) : (
                  <Link
                    href={activeItem.href}
                    className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                  >
                    {activeItem.label}
                  </Link>
                )}
              </li>
            )}
          </ol>
        </nav>
      </div>
      {(adminEmail || logoutSlot) && (
        <div className="flex shrink-0 items-center gap-3">
          {initial && (
            <span
              aria-hidden="true"
              className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary"
            >
              {initial}
            </span>
          )}
          {adminEmail && <span className="hidden text-sm text-muted-foreground sm:inline">{adminEmail}</span>}
          {logoutSlot}
        </div>
      )}
    </header>
  )
}

export { AdminTopbar }
