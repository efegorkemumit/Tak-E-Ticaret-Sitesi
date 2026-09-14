"use client"

import { useFormStatus } from "react-dom"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * `AdminTopbar`'ın `logoutSlot`'una geçirilir. Bir `<form action={...}>` —
 * gerçek POST tabanlı Server Action çağrısı (GET link DEĞİL, bkz.
 * `app/admin/(protected)/actions.ts`'teki not).
 *
 * DÜZELTME (final QA) — 375px'te sağdaki avatar+buton kümesi metin
 * etiketiyle ("Çıkış Yap") çok yer kaplıyor, bu da breadcrumb'ı kısa
 * etiketlerde bile gereksiz kesmeye zorluyordu (`AdminTopbar`'daki
 * `min-w-0`/`shrink-0` dengesi — sağ küme büyüdükçe sola daha az yer
 * kalıyor). Metin `sm:` altında `sr-only` (erişilebilir isim GERÇEKTEN
 * hâlâ var, yalnızca görsel olarak gizli) — buton ikon-only'ye düşüyor,
 * ~60px geri kazanılıyor.
 */
function LogoutSubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="ghost" className="min-h-11" disabled={pending}>
      <LogOut className="size-4" aria-hidden="true" />
      <span className="sr-only sm:not-sr-only">{pending ? "Çıkış yapılıyor…" : "Çıkış Yap"}</span>
    </Button>
  )
}

function LogoutButton({ action }: { action: () => Promise<never> }) {
  return (
    <form action={action}>
      <LogoutSubmitButton />
    </form>
  )
}

export { LogoutButton }
