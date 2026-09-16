import type { Metadata } from "next"
import { Container } from "@/components/container"
import { OrderSuccessView } from "@/components/checkout/order-success-view"
import { getSiteSettings } from "@/lib/settings/service"

export const metadata: Metadata = {
  title: "Sipariş Alındı",
  robots: { index: false },
}

// Banka/havale bilgisi veritabanındaki site ayarlarından okunur; admin bunu
// panelden değiştirebildiği için sayfa build-time'da dondurulamaz.
export const dynamic = "force-dynamic"

/**
 * VIDEO 09 — sipariş özeti hâlâ client tarafında (`sessionStorage`, D022)
 * okunur; bu sayfanın sunucudaki tek işi havale/EFT bilgisini (D018/D007) alıp
 * `OrderSuccessView`'a geçmektir.
 *
 * Ayar okuması bilinçli olarak yutuluyor: müşteri siparişini az önce verdi,
 * geçici bir veritabanı hatası bütün onay ekranını (sipariş numarası dahil)
 * 500'e düşürmemeli — `SiteFooter`'daki aynı graceful degradation ilkesi.
 * Her iki durumda da (ayar hiç kurulmamış / okunamadı) müşteriye gösterilen şey
 * aynı nötr metindir ve doğru aksiyonu söyler: bizimle iletişime geçin.
 * UYDURMA bir IBAN asla gösterilmez.
 */
export default async function OrderSuccessPage() {
  const siteSettings = await getSiteSettings().catch((error) => {
    console.error("OrderSuccessPage: getSiteSettings() başarısız oldu", error)
    return null
  })

  return (
    <Container size="narrow" className="py-10 lg:py-16">
      <OrderSuccessView siteSettings={siteSettings} />
    </Container>
  )
}
