import type { Metadata } from "next"
import { CheckoutForm } from "@/components/checkout/checkout-form"

export const metadata: Metadata = {
  title: "Ödeme",
}

/**
 * Sepet tamamen client-side (D022) olduğu için bu sayfanın sunucuda
 * çekeceği bir veri yok — tüm gerçek iş `CheckoutForm` client component'inde.
 * Bu sayfa yalnızca sunucu tarafında sabit başlık/düzeni sağlar.
 */
export default function CheckoutPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="mb-8 font-display text-3xl text-foreground">Ödeme</h1>
      <CheckoutForm />
    </div>
  )
}
