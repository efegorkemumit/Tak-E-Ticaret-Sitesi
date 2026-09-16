"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Landmark } from "lucide-react"
import { Input } from "@/components/ui/input"
import { FormField } from "@/components/ui/form-field"
import { Button } from "@/components/ui/button"
import { AdminSelect } from "@/components/admin/select"
import { getOrderStatusLabel, getPaymentMethodLabel, getAdminPaymentStatusLabel } from "@/components/admin/status-labels"

const ORDER_STATUS_ITEMS = ["PAYMENT_PENDING", "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"].map((s) => ({
  value: s,
  label: getOrderStatusLabel(s),
}))
const PAYMENT_METHOD_ITEMS = ["SHOPIER", "BANK_TRANSFER"].map((m) => ({ value: m, label: getPaymentMethodLabel(m) }))
/**
 * Etiketler `getAdminPaymentStatusLabel`'dan gelir, `getPaymentStatusLabel`'dan
 * DEĞİL — bkz. `status-labels.ts`'teki gerekçe: "Ödeme Durumu" filtresi tam
 * olarak "Sipariş Durumu" filtresinin yanında duruyor ve paylaşılan etiket
 * PENDING için "Ödeme bekleniyor" diyor; bu, komşu listedeki
 * `PAYMENT_PENDING` ("Ödeme Bekleniyor") ile neredeyse birebir aynı metin
 * olurdu. Tablodaki `PaymentStatusBadge` de aynı admin etiketini kullanıyor.
 */
const PAYMENT_STATUS_ITEMS = ["PENDING", "CONFIRMED", "FAILED"].map((s) => ({
  value: s,
  label: getAdminPaymentStatusLabel(s),
}))

/**
 * Filtreler GET query param'larına yazılır (`router.push`) — sunucu bileşeni
 * (`orders/page.tsx`) bu param'ları `listOrdersForAdmin`'e geçirir. Bir
 * Server Action GEREKMEZ; bu salt bir okuma/navigasyon işlemidir.
 */
function OrderFilterForm({
  initialOrderNumber,
  initialOrderStatus,
  initialPaymentMethod,
  initialPaymentStatus,
}: {
  initialOrderNumber: string
  initialOrderStatus: string
  initialPaymentMethod: string
  initialPaymentStatus: string
}) {
  const router = useRouter()
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber)
  const [orderStatus, setOrderStatus] = useState(initialOrderStatus)
  const [paymentMethod, setPaymentMethod] = useState(initialPaymentMethod)
  const [paymentStatus, setPaymentStatus] = useState(initialPaymentStatus)

  /**
   * VIDEO 09 — "havale kuyruğu": admin'in her gün yaptığı iş, ödemesi hâlâ
   * beklenen HAVALE siparişlerini görüp onaylamaktır (D007). Bu, iki ayrı
   * dropdown'la kurulabilen ama sürekli tekrarlanan bir filtredir; tek tıkla
   * sunuluyor. Aktiflik URL'den GELEN değerlere göre belirlenir (henüz
   * uygulanmamış dropdown seçimlerine göre değil) — rozet, ekrandaki LİSTENİN
   * gerçekten o filtreyle geldiğini söylemeli.
   */
  const bankTransferQueueActive = initialPaymentMethod === "BANK_TRANSFER" && initialPaymentStatus === "PENDING"

  function pushQuery(next: { orderNumber?: string; orderStatus?: string; paymentMethod?: string; paymentStatus?: string }) {
    const query = new URLSearchParams()
    if (next.orderNumber) query.set("orderNumber", next.orderNumber)
    if (next.orderStatus) query.set("orderStatus", next.orderStatus)
    if (next.paymentMethod) query.set("paymentMethod", next.paymentMethod)
    if (next.paymentStatus) query.set("paymentStatus", next.paymentStatus)
    router.push(`/admin/orders${query.size > 0 ? `?${query.toString()}` : ""}`)
  }

  function applyFilters(event: React.FormEvent) {
    event.preventDefault()
    pushQuery({ orderNumber: orderNumber.trim(), orderStatus, paymentMethod, paymentStatus })
  }

  function clearFilters() {
    setOrderNumber("")
    setOrderStatus("")
    setPaymentMethod("")
    setPaymentStatus("")
    router.push("/admin/orders")
  }

  /** Hızlı filtre aktifken TEKRAR tıklamak onu kaldırır (aç/kapa). */
  function toggleBankTransferQueue() {
    if (bankTransferQueueActive) {
      clearFilters()
      return
    }
    setOrderNumber("")
    setOrderStatus("")
    setPaymentMethod("BANK_TRANSFER")
    setPaymentStatus("PENDING")
    pushQuery({ paymentMethod: "BANK_TRANSFER", paymentStatus: "PENDING" })
  }

  return (
    <div className="mb-6 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant={bankTransferQueueActive ? "default" : "outline"}
          aria-pressed={bankTransferQueueActive}
          className="min-h-11"
          onClick={toggleBankTransferQueue}
        >
          <Landmark className="size-4" aria-hidden="true" />
          Havale Bekleyenler
        </Button>
        {bankTransferQueueActive && (
          <p className="text-admin-helper text-muted-foreground">
            Ödemesi onay bekleyen havale siparişleri listeleniyor. Kaldırmak için tekrar tıklayın.
          </p>
        )}
      </div>

      <form onSubmit={applyFilters} className="flex flex-wrap items-end gap-3">
        <FormField label="Sipariş No" className="w-48">
          {(props) => <Input {...props} value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} />}
        </FormField>
        <FormField label="Sipariş Durumu" className="w-48">
          {(props) => (
            <AdminSelect {...props} value={orderStatus} onValueChange={setOrderStatus} items={ORDER_STATUS_ITEMS} placeholder="Tümü" />
          )}
        </FormField>
        <FormField label="Ödeme Yöntemi" className="w-48">
          {(props) => (
            <AdminSelect
              {...props}
              value={paymentMethod}
              onValueChange={setPaymentMethod}
              items={PAYMENT_METHOD_ITEMS}
              placeholder="Tümü"
            />
          )}
        </FormField>
        <FormField label="Ödeme Durumu" className="w-48">
          {(props) => (
            <AdminSelect
              {...props}
              value={paymentStatus}
              onValueChange={setPaymentStatus}
              items={PAYMENT_STATUS_ITEMS}
              placeholder="Tümü"
            />
          )}
        </FormField>
        {/* DÜZELTME (final inceleme) — `flex-wrap` altında butonlar tek tek
            sarılırsa "Temizle" tek başına öksüz bir satıra düşüyordu
            (`orders-1024`/`orders-768`). İki buton artık `shrink-0` bir grup
            olarak BİRLİKTE sarılıyor, ayrı ayrı değil. */}
        <div className="flex shrink-0 gap-3">
          <Button type="submit" className="min-h-11">
            Filtrele
          </Button>
          <Button type="button" variant="outline" className="min-h-11" onClick={clearFilters}>
            Temizle
          </Button>
        </div>
      </form>
    </div>
  )
}

export { OrderFilterForm }
