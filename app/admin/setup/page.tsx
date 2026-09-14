import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { adminExists } from "@/lib/auth"
import { SetupForm } from "@/components/admin/setup-form"
import { setupAction } from "./actions"

export const metadata: Metadata = { title: "İlk Kurulum" }

// `adminExists()` her istekte YENİDEN kontrol edilmeli — bkz. login
// sayfasındaki aynı not.
export const dynamic = "force-dynamic"

/**
 * Tek seferlik kurulum ekranı — `adminExists()` true ise (bir admin zaten
 * varsa) bu sayfa KULLANILAMAZ, login'e yönlendirilir. Bu sayfadaki kontrol
 * yalnızca UX'tir; asıl güvenlik sınırı `setupAction` → `createFirstAdmin`'in
 * kendi Postgres advisory lock'lu transaction'ıdır (eşzamanlı iki isteğin iki
 * admin oluşturmasını engeller, bkz. `lib/auth/setup.ts`).
 */
export default async function AdminSetupPage() {
  if (await adminExists()) {
    redirect("/admin/login")
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 px-4">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl text-foreground">İlk Kurulum</h1>
        <p className="text-sm text-muted-foreground">
          Yönetim paneli için ilk admin hesabını oluşturun.
        </p>
      </div>
      <SetupForm action={setupAction} />
    </div>
  )
}
