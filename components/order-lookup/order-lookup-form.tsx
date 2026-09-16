"use client"

import { useState, useTransition } from "react"
import { lookupOrderAction } from "@/app/(storefront)/siparis-sorgula/actions"
import { orderLookupSchema } from "@/lib/commerce/order-lookup-schema"
import type { PublicOrderDto } from "@/lib/commerce/order-lookup"
import { Input } from "@/components/ui/input"
import { FormField } from "@/components/ui/form-field"
import { Button } from "@/components/ui/button"
import { OrderLookupResultView } from "./order-lookup-result"

/**
 * VIDEO 09 — public sipariş sorgulama formu (D004: üyelik yok, D015: sipariş
 * numarası + e-posta).
 *
 * Client-side doğrulama, sunucunun kullandığı `orderLookupSchema`'nın TA
 * KENDİSİDİR (checkout formundaki aynı desen) — kural iki yerde ayrı ayrı
 * yazılmaz, buradaki `safeParse` yalnızca erken/anlık geri bildirim içindir.
 * Asıl doğrulama her zaman sunucuda tekrarlanır.
 *
 * GÜVENLİK: Sunucudan gelen hata mesajı OLDUĞU GİBİ gösterilir. "Sipariş
 * numarası var ama e-posta yanlış" gibi bir ayrım BURADA ASLA üretilmez —
 * böyle bir ayrım, sipariş numarası deneyerek müşteri e-postası doğrulamaya
 * (account enumeration) izin verirdi.
 */
function OrderLookupForm() {
  const [values, setValues] = useState({ orderNumber: "", email: "" })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [order, setOrder] = useState<PublicOrderDto | null>(null)
  const [isSubmitting, startTransition] = useTransition()

  function updateField(key: "orderNumber" | "email", value: string) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (isSubmitting) return

    setLookupError(null)

    const parsed = orderLookupSchema.safeParse(values)
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        nextErrors[issue.path.join(".")] = issue.message
      }
      setFieldErrors(nextErrors)
      setOrder(null)
      return
    }
    setFieldErrors({})

    startTransition(async () => {
      try {
        const result = await lookupOrderAction(parsed.data)
        if (!result.success) {
          setOrder(null)
          setLookupError(result.error.message)
          return
        }
        setOrder(result.order)
      } catch {
        setOrder(null)
        setLookupError("Beklenmeyen bir hata oluştu, lütfen tekrar deneyin.")
      }
    })
  }

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <FormField label="Sipariş Numarası" error={fieldErrors.orderNumber}>
          {(props) => (
            <Input
              {...props}
              value={values.orderNumber}
              onChange={(e) => updateField("orderNumber", e.target.value)}
              placeholder="ORD-…"
              autoComplete="off"
              spellCheck={false}
            />
          )}
        </FormField>

        <FormField label="E-posta" error={fieldErrors.email}>
          {(props) => (
            <Input
              {...props}
              type="email"
              value={values.email}
              onChange={(e) => updateField("email", e.target.value)}
              autoComplete="email"
            />
          )}
        </FormField>

        {/* min-h-11 (44px) — bkz. product-purchase-panel.tsx'teki aynı not. */}
        <Button type="submit" size="lg" disabled={isSubmitting} className="min-h-11 w-full sm:w-auto sm:self-start sm:px-6">
          {isSubmitting ? "Sorgulanıyor…" : "Siparişi Sorgula"}
        </Button>
      </form>

      {/* Sonuç ve hata aynı canlı bölgede duyurulur: ekran okuyucu kullanıcısı,
          sorgulamanın sonucunu odağı kaybetmeden öğrenir. */}
      <div aria-live="polite">
        {lookupError && <p className="text-sm text-destructive">{lookupError}</p>}
        {order && <OrderLookupResultView order={order} />}
      </div>
    </div>
  )
}

export { OrderLookupForm }
