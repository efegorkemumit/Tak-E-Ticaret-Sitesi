import type { Metadata } from "next"
import { Container } from "@/components/container"
import { CheckoutForm } from "@/components/checkout/checkout-form"

export const metadata: Metadata = {
  title: "Ödeme",
}

/**
 * Sepet tamamen client-side (D022) olduğu için bu sayfanın sunucuda
 * çekeceği bir veri yok — tüm gerçek iş `CheckoutForm` client component'inde.
 * Bu sayfa yalnızca sunucu tarafında sabit başlık/düzeni sağlar.
 *
 * VIDEO 08 STEP 2 (part 2) — `CheckoutForm` kendi içinde ZATEN masaüstünde
 * iki kolonlu (form + sticky sipariş özeti, `lg:grid-cols-[1fr_20rem]`) bir
 * grid kuruyordu; `size="narrow"` (768px, tek-kolon akışlar için) bu grid'i
 * fazlaca sıkıştırırdı. Bu yüzden `size="page"` (site konteyneriyle AYNI
 * kaynak) kullanılır, ama iki kolonun kendisi ayrıca `max-w-5xl` ile
 * sınırlanır — aksi halde 1400px'lik tam konteynerde form/özet aşırı
 * gerilip dengesiz görünürdü. Bu, YENİ bir rakip "site container" DEĞİL;
 * yalnızca bu akışa özgü, tek yerde tanımlı bir iç sınır.
 */
export default function CheckoutPage() {
  return (
    <Container className="py-10 lg:py-16">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-8 font-display text-page-title text-foreground lg:text-page-title-lg">Ödeme</h1>
        <CheckoutForm />
      </div>
    </Container>
  )
}
