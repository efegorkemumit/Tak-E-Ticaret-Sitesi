"use client"

import type { ReactNode } from "react"
import type { PublicOrderDto } from "@/lib/commerce/order-lookup"
import { getPaymentMethodLabel, getPaymentStatusLabel } from "@/lib/order-status-labels"
import { getOrderStatusLabel } from "@/components/admin/status-labels"
import { formatPriceTRY } from "@/lib/format"
import { BankTransferDetails } from "@/components/checkout/bank-transfer-details"

/**
 * VIDEO 09 — sipariş sorgulama sonucu.
 *
 * PII SINIRI: müşteri adı, adresi, telefonu ve sipariş satırları BİLİNÇLİ
 * OLARAK gösterilmez — `PublicOrderDto` bu alanları zaten taşımaz, burada da
 * uydurulmaz/tamamlanmaz. Gösterilenler yalnızca siparişin durumunu ve (varsa)
 * ödeme talimatını anlamak için gerekli asgari bilgidir (D015'in amacı: sipariş
 * numarası tahmin ederek başkasının kişisel verisine ulaşılamaması).
 *
 * `getOrderStatusLabel` kaynağı: `lib/order-status-labels.ts` bugün yalnızca
 * `paymentMethod`/`paymentStatus` eşlemelerini içeriyor; `orderStatus` etiketi
 * projede TEK bir yerde tanımlı (`components/admin/status-labels.ts`, saf bir
 * metin eşlemesi, hiçbir sunucu/DB bağımlılığı yok). İkinci bir kopya açmak
 * yerine o tek kaynak tüketiliyor — bu eşleme ileride paylaşılan
 * `lib/order-status-labels.ts`'e taşınırsa buradaki import tek satırda
 * güncellenir.
 */
function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm break-words text-foreground sm:text-right">{children}</dd>
    </div>
  )
}

/**
 * Sunucudan ISO metin olarak gelen tarih. Bu component yalnızca kullanıcı
 * sorgulama yaptıktan sonra (client'ta) render edildiği için yerel saat
 * biçimlendirmesi bir SSR/hydration uyuşmazlığı yaratmaz.
 */
function formatOrderDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "long" }).format(date)
}

function OrderLookupResultView({ order }: { order: PublicOrderDto }) {
  return (
    <div className="flex flex-col gap-6">
      <section className="flex w-full flex-col gap-4 rounded-md border border-border p-4 text-left">
        <h2 className="font-display text-section-title text-foreground lg:text-section-title-lg">
          Sipariş Bilgileri
        </h2>

        <dl className="flex flex-col gap-2">
          <DetailRow label="Sipariş No">
            <span className="font-mono select-all">{order.orderNumber}</span>
          </DetailRow>
          <DetailRow label="Sipariş Durumu">{getOrderStatusLabel(order.orderStatus)}</DetailRow>
          <DetailRow label="Ödeme Durumu">{getPaymentStatusLabel(order.paymentStatus)}</DetailRow>
          <DetailRow label="Ödeme Yöntemi">{getPaymentMethodLabel(order.paymentMethod)}</DetailRow>
          {/* Para birimi D003 gereği tek: TRY. `order.currency` kayıt amaçlı
              taşınır, biçimlendirme projenin tek yardımcısıyla yapılır. */}
          <DetailRow label="Toplam">
            <span className="tabular-nums">{formatPriceTRY(Number(order.total))}</span>
          </DetailRow>
          <DetailRow label="Sipariş Tarihi">{formatOrderDate(order.createdAt)}</DetailRow>
        </dl>
      </section>

      {order.bankTransfer && (
        <BankTransferDetails
          bankName={order.bankTransfer.bankName}
          accountHolder={order.bankTransfer.accountHolder}
          ibanFormatted={order.bankTransfer.ibanFormatted}
          orderNumber={order.orderNumber}
          description={order.bankTransfer.description}
          // `reservationWindowHours` geçilmez: bu DTO rezervasyon süresini
          // taşımıyor, varsayılan bir süre uydurulmaz (bkz. BankTransferDetails).
        />
      )}
    </div>
  )
}

export { OrderLookupResultView }
