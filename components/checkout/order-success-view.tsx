"use client"

import Link from "next/link"
import { readOrderResult } from "@/lib/checkout/order-result-storage"
import { getPaymentMethodLabel, getPaymentStatusLabel } from "@/lib/order-status-labels"
import { formatPriceTRY } from "@/lib/format"
import { EmptyState } from "@/components/ui/empty-state"
import { useIsClient } from "@/lib/use-is-client"

/**
 * VIDEO 06 STEP 5 madde 9 — yalnızca orderNumber, total, paymentMethod,
 * paymentStatus (nötr "ödeme bekleniyor" ifadesiyle) gösterir. Shopier
 * URL/webhook/sahte ödeme sonucu YOK; BANK_TRANSFER için IBAN/banka
 * fulfillment mantığı da YOK (Video 07'nin konusu) — yalnızca nötr durum.
 *
 * Sipariş sonucu sunucuda kalıcı bir oturum/sorgu kaydı olmadığı için
 * (D022, "order lookup public UI" bu turun kapsamı dışında) yalnızca bu
 * sekmenin `sessionStorage`'ından okunur — bkz. `lib/checkout/order-result-storage.ts`.
 *
 * `readOrderResult()` saf bir okuma (yan etkisi yok) olduğu için `useState`/
 * `useEffect` yerine doğrudan render sırasında, `useIsClient` ile SSR/hydration
 * uyuşmazlığı önlenerek çağrılır.
 */
function OrderSuccessView() {
  const isClient = useIsClient()

  if (!isClient) return null

  const order = readOrderResult()

  if (!order) {
    return (
      <EmptyState
        title="Görüntülenecek bir sipariş bulunamadı"
        description="Bu sayfayı doğrudan açmış olabilirsiniz. Sipariş vermek için ürünlerimize göz atabilirsiniz."
        action={
          <Link href="/urunler" className="text-sm text-foreground underline underline-offset-4">
            Ürünlere göz at
          </Link>
        }
      />
    )
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-16 text-center">
      <h1 className="font-display text-3xl text-foreground">Siparişiniz alındı</h1>
      <p className="text-sm text-muted-foreground">
        Sipariş numaranız: <span className="font-medium text-foreground">{order.orderNumber}</span>
      </p>

      <dl className="flex w-full flex-col gap-2 rounded-md border border-border p-4 text-left text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Toplam</dt>
          <dd className="text-foreground">{formatPriceTRY(Number(order.total))}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Ödeme Yöntemi</dt>
          <dd className="text-foreground">{getPaymentMethodLabel(order.paymentMethod)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Ödeme Durumu</dt>
          <dd className="text-foreground">{getPaymentStatusLabel(order.paymentStatus)}</dd>
        </div>
      </dl>

      <Link href="/" className="text-sm text-foreground underline underline-offset-4">
        Ana sayfaya dön
      </Link>
    </div>
  )
}

export { OrderSuccessView }
