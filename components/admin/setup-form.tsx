"use client"

import { useState, useTransition } from "react"
import { setupInputSchema } from "@/lib/auth/schemas"
import { Input } from "@/components/ui/input"
import { FormField } from "@/components/ui/form-field"
import { Button } from "@/components/ui/button"
import type { SetupActionFailure } from "@/app/admin/setup/actions"

/**
 * `confirmPassword` yalnızca CLIENT-taraflı bir UX kontrolüdür (yazım hatası
 * yakalamak için) — `setupInputSchema`'da yoktur, sunucuya asla gönderilmez.
 */
function SetupForm({ action }: { action: (input: unknown) => Promise<SetupActionFailure | undefined> }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (password !== confirmPassword) {
      setFieldErrors({ confirmPassword: "Parolalar eşleşmiyor." })
      return
    }

    const payload = { email, password }
    const parsed = setupInputSchema.safeParse(payload)
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        nextErrors[issue.path.join(".")] = issue.message
      }
      setFieldErrors(nextErrors)
      return
    }
    setFieldErrors({})
    setFormError(null)

    startTransition(async () => {
      const result = await action(parsed.data)
      if (result && !result.success) {
        setFormError(result.error.message)
      }
      // Başarıda `action` kendi içinde `redirect()` çağırır — buraya hiç dönmez.
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <FormField label="E-posta" error={fieldErrors.email}>
        {(props) => (
          <Input
            {...props}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            autoFocus
          />
        )}
      </FormField>
      <FormField label="Parola" error={fieldErrors.password}>
        {(props) => (
          <Input
            {...props}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        )}
      </FormField>
      <FormField label="Parola (Tekrar)" error={fieldErrors.confirmPassword}>
        {(props) => (
          <Input
            {...props}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
        )}
      </FormField>

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <Button type="submit" disabled={isPending} className="min-h-11 w-full">
        {isPending ? "Hesap oluşturuluyor…" : "Hesap Oluştur"}
      </Button>
    </form>
  )
}

export { SetupForm }
