import { redirect } from "next/navigation"
import { getCurrentAdmin } from "@/lib/auth"
import { AdminShell } from "@/components/admin/admin-shell"
import { LogoutButton } from "@/components/admin/logout-button"
import { logoutAction } from "./actions"

/**
 * VIDEO 07 WAVE B-2a — gerçek admin ekranlarının (`(protected)` route
 * group'u, URL'e yansımaz) kendi shell + auth guard'ı.
 *
 * ÖNEMLİ: bu yalnızca bir UX katmanıdır (yetkisiz kullanıcıyı login'e
 * yönlendirir). Asıl güvenlik sınırı, commerce'in yazdığı ve Wave B-2b'deki
 * her admin domain servisinin çağıracağı `requireAdmin()`'dir — bu layout'un
 * redirect'ine güvenip mutasyonlarda ayrıca kontrol atlanmamalı.
 */
export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const admin = await getCurrentAdmin()
  if (!admin) redirect("/admin/login")

  return (
    <AdminShell adminEmail={admin.email} logoutSlot={<LogoutButton action={logoutAction} />}>
      {children}
    </AdminShell>
  )
}
