import type { Metadata } from "next"
import type { ReactNode } from "react"

// Admin paneli asla arama motorlarınca indekslenmemeli — login/setup sayfaları dahil.
export const metadata: Metadata = {
  title: { template: "%s — Admin Paneli", default: "Admin Paneli" },
  robots: { index: false, follow: false },
}

/**
 * VIDEO 07 WAVE B-2a — bu layout artık BİLİNÇLİ OLARAK minimal: yalnızca
 * `/admin/*` için ortak metadata'yı taşır. `AdminShell` (sidebar/topbar) ve
 * auth guard buradan `app/admin/(protected)/layout.tsx`'e taşındı — aksi
 * halde login/setup sayfaları da korumalı shell'in İÇİNDE kalır ve kimse
 * giriş yapamazdı (guard, henüz giriş yapmamış kullanıcıyı login'e
 * yönlendirirken login'in KENDİSİNİ de korumaya çalışırdı).
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return children
}
