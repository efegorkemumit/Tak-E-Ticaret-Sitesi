"use client"

import { usePathname } from "next/navigation"
import type { ReactNode } from "react"
import { getActiveNavLabel } from "./nav-items"
import { AdminMobileNav } from "./admin-mobile-nav"

/**
 * Kalıcı üst şerit — mobil menü tetikleyicisi + mevcut bölüm adı (path'ten
 * türetilir, her sayfaya ayrı prop geçmeye gerek yok) + admin e-postası/çıkış
 * için slot'lar.
 *
 * `adminEmail`/`logoutSlot` BİLİNÇLİ OLARAK opsiyonel prop — auth henüz
 * bağlanmadı (Wave B). Sağlanmazlarsa o alan hiç render edilmez; sahte bir
 * e-posta veya işlevsiz bir "Çıkış Yap" butonu GÖSTERİLMEZ (bkz.
 * `app/admin/layout.tsx`'teki not).
 */
function AdminTopbar({
  adminEmail,
  logoutSlot,
}: {
  adminEmail?: string
  logoutSlot?: ReactNode
}) {
  const pathname = usePathname()
  const sectionLabel = getActiveNavLabel(pathname)

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <AdminMobileNav />
        <h1 className="text-sm font-medium text-foreground">{sectionLabel}</h1>
      </div>
      {(adminEmail || logoutSlot) && (
        <div className="flex items-center gap-3">
          {adminEmail && <span className="text-sm text-muted-foreground">{adminEmail}</span>}
          {logoutSlot}
        </div>
      )}
    </header>
  )
}

export { AdminTopbar }
