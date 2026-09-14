import type { ReactNode } from "react"
import { AdminSidebar } from "./admin-sidebar"
import { AdminTopbar } from "./admin-topbar"
import { AdminContainer } from "./admin-container"

/**
 * `app/admin/layout.tsx`'in render ettiği iskelet — sidebar (masaüstü) +
 * topbar (mobil menü tetikleyicisi dahil) + içerik alanı. Kendisi Server
 * Component'tir (yalnızca `AdminSidebar`/`AdminTopbar`/`AdminMobileNav`
 * gerçek etkileşim gerektirdiği için client).
 *
 * NOT: `(storefront)`/`admin` route group refactor'ünden bu yana bu shell,
 * `app/admin/layout.tsx` → `app/admin/(protected)/layout.tsx` zincirinde
 * public `SiteHeader`/`SiteFooter`'dan TAMAMEN izole render edilir — admin
 * sayfalarında artık public site chrome'u görünmez (bkz. `app/layout.tsx`'in
 * yalnızca html/body/font sağladığı ince kök layout).
 *
 * VIDEO 08 STEP 3 — `<main>` artık `AdminContainer`'a sarılı: TEK noktadan
 * uygulanan max-width + padding, sayfa başına ayrı ayrı yazılmıyor.
 */
function AdminShell({
  children,
  adminEmail,
  logoutSlot,
}: {
  children: ReactNode
  adminEmail?: string
  logoutSlot?: ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar adminEmail={adminEmail} logoutSlot={logoutSlot} />
        <main className="flex-1 overflow-x-auto p-6 xl:p-8">
          <AdminContainer>{children}</AdminContainer>
        </main>
      </div>
    </div>
  )
}

export { AdminShell }
