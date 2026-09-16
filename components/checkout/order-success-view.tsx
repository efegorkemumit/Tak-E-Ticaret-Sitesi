"use client"

import Link from "next/link"
import { readOrderResult } from "@/lib/checkout/order-result-storage"
import { getPaymentMethodLabel, getPaymentStatusLabel } from "@/lib/order-status-labels"
import { formatPriceTRY } from "@/lib/format"
import { EmptyState } from "@/components/ui/empty-state"
import { useIsClient } from "@/lib/use-is-client"
import { BankTransferDetails } from "@/components/checkout/bank-transfer-details"
import { renderTransferDescription } from "@/lib/settings/transfer-description"
import type { SiteSettingsDto } from "@/lib/settings/service"

/**
 * VIDEO 06 STEP 5 madde 9 — yalnızca orderNumber, total, paymentMethod,
 * paymentStatus (nötr "ödeme bekleniyor" ifadesiyle) gösterir. Shopier
 * URL/webhook/sahte ödeme sonucu YOK.
 *
 * VIDEO 09 — havale/EFT siparişlerinde artık GERÇEK banka bilgisi gösterilir.
 * Bilgi bu component'te değil, sayfanın (server component) `getSiteSettings()`
 * çağrısında okunur ve `siteSettings` prop'uyla buraya geçilir; bu component
 * client kalır çünkü sipariş özetinin kendisi hâlâ yalnızca bu sekmenin
 * `sessionStorage`'ında (D022 — sunucuda oturum/sorgu kaydı yok).
 *
 * Sipariş sonucu sunucuda kalıcı bir oturum kaydı olmadığı için yalnızca bu
 * sekmenin `sessionStorage`'ından okunur — bkz. `lib/checkout/order-result-storage.ts`.
 * Kalıcı erişim için `/siparis-sorgula` (sipariş no + e-posta, D015) linki verilir.
 *
 * `readOrderResult()` saf bir okuma (yan etkisi yok) olduğu için `useState`/
 * `useEffect` yerine doğrudan render sırasında, `useIsClient` ile SSR/hydration
 * uyuşmazlığı önlenerek çağrılır.
 */
function OrderSuccessView({ siteSettings }: { siteSettings: SiteSettingsDto | null }) {
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

  const isBankTransfer = order.paymentMethod === "BANK_TRANSFER"

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

      {isBankTransfer &&
        (siteSettings ? (
          <BankTransferDetails
            bankName={siteSettings.bankName}
            accountHolder={siteSettings.accountHolder}
            ibanFormatted={siteSettings.ibanFormatted}
            orderNumber={order.orderNumber}
            description={renderTransferDescription(
              siteSettings.transferDescriptionTemplate,
              order.orderNumber
            )}
            reservationWindowHours={siteSettings.reservationWindowHours}
          />
        ) : (
          /* Ayar hiç kurulmamış (veya okunamadı): SAHTE/PLACEHOLDER IBAN
             GÖSTERİLMEZ. Yanlış bir hesaba yapılan havale geri döndürülemez bir
             müşteri zararıdır — bu yüzden bilinçli olarak nötr bir yönlendirme
             verilir. Bkz. `app/(storefront)/siparis-basarili/page.tsx`. */
          <p className="w-full rounded-md border border-border p-4 text-left text-sm text-muted-foreground">
            Banka bilgileri henüz tanımlanmamış. Lütfen bizimle iletişime geçin.
          </p>
        ))}

      <div className="flex flex-col items-center gap-2">
        <Link
          href="/siparis-sorgula"
          className="text-sm text-foreground underline underline-offset-4"
        >
          Siparişinizi sorgulamak için tıklayın
        </Link>
        <Link href="/" className="text-sm text-foreground underline underline-offset-4">
          Ana sayfaya dön
        </Link>
      </div>
    </div>
  )
}

export { OrderSuccessView }
