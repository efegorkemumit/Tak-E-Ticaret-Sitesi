"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useCart } from "@/lib/cart/cart-context"
import { getOrCreateIdempotencyKey, clearIdempotencyKey } from "@/lib/checkout/idempotency"
import { storeOrderResult } from "@/lib/checkout/order-result-storage"
import { submitCheckoutOrder } from "@/lib/commerce/checkout-action"
import { checkoutInputSchema } from "@/lib/commerce/checkout-schema"
import { PaymentMethod } from "@/lib/generated/prisma/enums"
import { formatPriceTRY } from "@/lib/format"
import { Input } from "@/components/ui/input"
import { FormField } from "@/components/ui/form-field"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { CartSummary } from "@/components/cart/cart-summary"
import { PaymentMethodSelector } from "./payment-method-selector"

interface FormValues {
  fullName: string
  phone: string
  email: string
  addressLine: string
  city: string
  district: string
  postalCode: string
  giftPackagingSelected: boolean
  paymentMethod: string
}

const INITIAL_VALUES: FormValues = {
  fullName: "",
  phone: "",
  email: "",
  addressLine: "",
  city: "",
  district: "",
  postalCode: "",
  giftPackagingSelected: false,
  paymentMethod: PaymentMethod.BANK_TRANSFER,
}

/**
 * VIDEO 06 STEP 5 — guest checkout formu (D004, üyelik yok). Client-side
 * doğrulama commerce'in `checkoutInputSchema`'sıyla (`lib/commerce/checkout-schema.ts`)
 * BİREBİR aynı Zod şeması üzerinden yapılır — mantık iki yerde ayrı ayrı
 * yazılmaz, yalnızca UX için erken/anlık geri bildirim sağlar. Asıl
 * doğrulama, `submitCheckoutOrder` çağrıldığında sunucu tarafında tekrar
 * yapılır (client validasyonu asla tek güvence değildir).
 */
function CheckoutForm() {
  const { lines, subtotal, itemCount, clearCart, isHydrated } = useCart()
  const router = useRouter()
  const toast = useToast()

  const [values, setValues] = useState<FormValues>(INITIAL_VALUES)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const showGiftPackaging = useMemo(
    () => lines.some((line) => line.giftPackagingAvailable),
    [lines]
  )

  // Idempotency key: sayfa mount'unda (buton tıklamasında DEĞİL) üretilir;
  // sepet imzası değişmediği sürece aynı kalır (bkz. lib/checkout/idempotency.ts).
  // `getOrCreateIdempotencyKey` sessionStorage'ı kendi içinde önce OKUYUP
  // yalnızca imza değiştiyse YAZDIĞI için (bkz. o dosyadaki yorum) idempotent
  // bir fonksiyondur — render sırasında doğrudan çağrılması güvenlidir,
  // `useEffect` + `setState` kombinasyonuna göre gereksiz bir render adımı
  // eklemez.
  const idempotencyKey =
    isHydrated && lines.length > 0 ? getOrCreateIdempotencyKey(lines) : null

  function updateField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (isSubmitting || !idempotencyKey) return

    setSubmitError(null)

    const payload = {
      items: lines.map((line) => ({ variantId: line.variantId, quantity: line.quantity })),
      orderIdempotencyKey: idempotencyKey,
      contact: {
        fullName: values.fullName,
        phone: values.phone,
        email: values.email,
      },
      deliveryAddress: {
        addressLine: values.addressLine,
        city: values.city,
        district: values.district,
        postalCode: values.postalCode,
        country: "TR" as const,
      },
      giftPackagingSelected: showGiftPackaging ? values.giftPackagingSelected : false,
      paymentMethod: values.paymentMethod,
    }

    const parsed = checkoutInputSchema.safeParse(payload)
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        nextErrors[issue.path.join(".")] = issue.message
      }
      setFieldErrors(nextErrors)
      return
    }
    setFieldErrors({})

    setIsSubmitting(true)
    try {
      const result = await submitCheckoutOrder(parsed.data)
      if (!result.success) {
        setSubmitError(result.error.message)
        toast.add({ title: "Sipariş oluşturulamadı", description: result.error.message, type: "error" })
        // Aynı idempotency key korunur — kullanıcı tekrar denediğinde bu, D017
        // gereği aynı deneme sayılır (yeni bir sipariş/stok düşümü oluşmaz).
        return
      }

      storeOrderResult(result.order)
      clearCart()
      clearIdempotencyKey()
      router.push("/siparis-basarili")
    } catch {
      setSubmitError("Beklenmeyen bir hata oluştu, lütfen tekrar deneyin.")
      toast.add({
        title: "Sipariş oluşturulamadı",
        description: "Beklenmeyen bir hata oluştu, lütfen tekrar deneyin.",
        type: "error",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isHydrated && lines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="font-display text-xl text-foreground">Sepetiniz boş</p>
        <p className="text-sm text-muted-foreground">
          Ödeme adımına geçmeden önce sepetinize ürün eklemelisiniz.
        </p>
        <Link href="/urunler" className="text-sm text-foreground underline underline-offset-4">
          Ürünlere göz at
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-10 lg:grid-cols-[1fr_20rem]" noValidate>
      <div className="flex flex-col gap-8">
        <section className="flex flex-col gap-4">
          <h2 className="font-display text-xl text-foreground">İletişim Bilgileri</h2>
          <FormField label="Ad Soyad" error={fieldErrors["contact.fullName"]}>
            {(props) => (
              <Input
                {...props}
                value={values.fullName}
                onChange={(e) => updateField("fullName", e.target.value)}
                autoComplete="name"
              />
            )}
          </FormField>
          <FormField label="Telefon" error={fieldErrors["contact.phone"]}>
            {(props) => (
              <Input
                {...props}
                type="tel"
                value={values.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                autoComplete="tel"
              />
            )}
          </FormField>
          <FormField label="E-posta" error={fieldErrors["contact.email"]}>
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
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="font-display text-xl text-foreground">Teslimat Adresi</h2>
          <FormField label="Adres" error={fieldErrors["deliveryAddress.addressLine"]}>
            {(props) => (
              <Input
                {...props}
                value={values.addressLine}
                onChange={(e) => updateField("addressLine", e.target.value)}
                autoComplete="street-address"
              />
            )}
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="İl" error={fieldErrors["deliveryAddress.city"]}>
              {(props) => (
                <Input
                  {...props}
                  value={values.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  autoComplete="address-level1"
                />
              )}
            </FormField>
            <FormField label="İlçe" error={fieldErrors["deliveryAddress.district"]}>
              {(props) => (
                <Input
                  {...props}
                  value={values.district}
                  onChange={(e) => updateField("district", e.target.value)}
                  autoComplete="address-level2"
                />
              )}
            </FormField>
          </div>
          <FormField label="Posta Kodu" error={fieldErrors["deliveryAddress.postalCode"]}>
            {(props) => (
              <Input
                {...props}
                value={values.postalCode}
                onChange={(e) => updateField("postalCode", e.target.value)}
                autoComplete="postal-code"
              />
            )}
          </FormField>
          <p className="text-xs text-muted-foreground">Ülke: Türkiye</p>

          {showGiftPackaging && (
            <label className="flex min-h-11 items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                className="size-4"
                checked={values.giftPackagingSelected}
                onChange={(e) => updateField("giftPackagingSelected", e.target.checked)}
              />
              Hediye paketi istiyorum
            </label>
          )}
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="font-display text-xl text-foreground">Ödeme Yöntemi</h2>
          <PaymentMethodSelector
            value={values.paymentMethod}
            onValueChange={(value) => updateField("paymentMethod", value)}
          />
          {fieldErrors.paymentMethod && (
            <p className="text-xs text-destructive">{fieldErrors.paymentMethod}</p>
          )}
        </section>
      </div>

      <aside className="flex h-fit flex-col gap-4 lg:sticky lg:top-6">
        <h2 className="font-display text-xl text-foreground">Sipariş Özeti</h2>
        <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
          {lines.map((line) => (
            <li key={line.variantId} className="flex justify-between gap-2">
              <span>
                {line.productName}
                {line.attributeSummary ? ` (${line.attributeSummary})` : ""} × {line.quantity}
              </span>
              <span>{formatPriceTRY(Number(line.unitPrice) * line.quantity)}</span>
            </li>
          ))}
        </ul>
        <CartSummary subtotal={subtotal} itemCount={itemCount} />

        {submitError && <p className="text-sm text-destructive">{submitError}</p>}

        {/* min-h-11 (44px) — bkz. product-purchase-panel.tsx'teki aynı not. */}
        <Button type="submit" size="lg" disabled={isSubmitting || !idempotencyKey} className="min-h-11 w-full">
          {isSubmitting ? "Sipariş Oluşturuluyor…" : "Siparişi Tamamla"}
        </Button>
      </aside>
    </form>
  )
}

export { CheckoutForm }
