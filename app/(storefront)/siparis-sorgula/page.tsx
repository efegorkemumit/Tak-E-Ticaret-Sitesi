import type { Metadata } from "next"
import { Container } from "@/components/container"
import { OrderLookupForm } from "@/components/order-lookup/order-lookup-form"

export const metadata: Metadata = {
  title: "Sipariş Sorgula",
  // Kişiye özel bir sorgulama yüzeyi — arama motorlarında indekslenmez.
  robots: { index: false },
}

/**
 * VIDEO 09 — D004 (üyelik yok) gereği müşterinin siparişine tek erişim yolu.
 * D015: yalnızca (tahmin edilebilir) sipariş numarasına güvenilmez, e-posta ek
 * doğrulama alanıdır — kuralın kendisi `lib/commerce/order-lookup.ts`'te,
 * burada değil.
 *
 * Sayfa server component'tir ve hiçbir veri çekmez; tüm etkileşim (form +
 * sonuç) `OrderLookupForm` client component'indedir.
 */
export default function OrderLookupPage() {
  return (
    <Container size="narrow" className="py-10 lg:py-16">
      <h1 className="font-display text-page-title text-foreground lg:text-page-title-lg">
        Sipariş Sorgula
      </h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Sipariş numaranız ve siparişi verirken kullandığınız e-posta adresiyle siparişinizin
        durumunu görüntüleyebilirsiniz.
      </p>

      <div className="mt-8">
        <OrderLookupForm />
      </div>
    </Container>
  )
}
