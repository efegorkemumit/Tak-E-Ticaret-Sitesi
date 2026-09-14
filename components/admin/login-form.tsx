"use client"

import { useState, useTransition } from "react"
import { loginInputSchema } from "@/lib/auth/schemas"
import { Input } from "@/components/ui/input"
import { FormField } from "@/components/ui/form-field"
import { Button } from "@/components/ui/button"
import type { LoginActionFailure } from "@/app/admin/login/actions"

/**
 * Client-side ön doğrulama commerce'in GERÇEK `loginInputSchema`'sıyla
 * (`lib/auth/schemas.ts`) yapılır — checkout formundaki desenin (bkz.
 * `components/checkout/checkout-form.tsx`) aynısı. Asıl doğrulama/kimlik
 * kontrolü her zaman sunucuda (`loginAction` → `loginAdmin`) tekrar yapılır.
 *
 * Hata mesajı KASITLI OLARAK jenerik — `loginAdmin` zaten tek bir
 * `INVALID_CREDENTIALS` kodu/mesajı döndürüyor (e-posta enumeration'a karşı),
 * burada "e-posta bulunamadı"/"parola yanlış" diye AYRIŞTIRILMAZ, sunucudan
 * gelen mesaj olduğu gibi gösterilir.
 */
function LoginForm({ action }: { action: (input: unknown) => Promise<LoginActionFailure | undefined> }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const payload = { email, password }
    const parsed = loginInputSchema.safeParse(payload)
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
            autoComplete="current-password"
          />
        )}
      </FormField>

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <Button type="submit" disabled={isPending} className="min-h-11 w-full">
        {isPending ? "Giriş yapılıyor…" : "Giriş Yap"}
      </Button>
    </form>
  )
}

export { LoginForm }
