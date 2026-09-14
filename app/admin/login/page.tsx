import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { adminExists } from "@/lib/auth"
import { LoginForm } from "@/components/admin/login-form"
import { loginAction } from "./actions"

export const metadata: Metadata = { title: "Giriş Yap" }

// `adminExists()` her istekte YENİDEN kontrol edilmeli — build-time'da
// dondurulursa (statik prerender), bir admin sonradan oluşturulduğunda bu
// sayfa hâlâ eski durumu gösterip yanlış yönlendirme yapabilir.
export const dynamic = "force-dynamic"

/**
 * Bilinçli olarak `AdminShell`'in (sidebar/topbar) DIŞINDA — `app/admin/layout.tsx`
 * artık minimal, `(protected)` route group'una girmediği için bu sayfa
 * shell'siz, sade bir giriş ekranı olarak kalır.
 */
export default async function AdminLoginPage() {
  // Sistem hiç kurulmamışsa (`adminExists()` false) login formu göstermek
  // anlamsız — kurulum akışına yönlendir.
  if (!(await adminExists())) {
    redirect("/admin/setup")
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 px-4">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl text-foreground">Admin Girişi</h1>
        <p className="text-sm text-muted-foreground">Yönetim paneline erişmek için giriş yapın.</p>
      </div>
      <LoginForm action={loginAction} />
    </div>
  )
}
