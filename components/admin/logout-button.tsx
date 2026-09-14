"use client"

import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"

/**
 * `AdminTopbar`'ın `logoutSlot`'una geçirilir. Bir `<form action={...}>` —
 * gerçek POST tabanlı Server Action çağrısı (GET link DEĞİL, bkz.
 * `app/admin/(protected)/actions.ts`'teki not).
 */
function LogoutSubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="ghost" className="min-h-11" disabled={pending}>
      {pending ? "Çıkış yapılıyor…" : "Çıkış Yap"}
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
