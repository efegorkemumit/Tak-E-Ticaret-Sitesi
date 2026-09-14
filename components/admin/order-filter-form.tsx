"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { FormField } from "@/components/ui/form-field"
import { Button } from "@/components/ui/button"
import { AdminSelect } from "@/components/admin/select"
import { getOrderStatusLabel, getPaymentMethodLabel } from "@/components/admin/status-labels"

const ORDER_STATUS_ITEMS = ["PAYMENT_PENDING", "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"].map((s) => ({
  value: s,
  label: getOrderStatusLabel(s),
}))
const PAYMENT_METHOD_ITEMS = ["SHOPIER", "BANK_TRANSFER"].map((m) => ({ value: m, label: getPaymentMethodLabel(m) }))

/**
 * Filtreler GET query param'larına yazılır (`router.push`) — sunucu bileşeni
 * (`orders/page.tsx`) bu param'ları `listOrdersForAdmin`'e geçirir. Bir
 * Server Action GEREKMEZ; bu salt bir okuma/navigasyon işlemidir.
 */
function OrderFilterForm({
  initialOrderNumber,
  initialOrderStatus,
  initialPaymentMethod,
}: {
  initialOrderNumber: string
  initialOrderStatus: string
  initialPaymentMethod: string
}) {
  const router = useRouter()
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber)
  const [orderStatus, setOrderStatus] = useState(initialOrderStatus)
  const [paymentMethod, setPaymentMethod] = useState(initialPaymentMethod)

  function applyFilters(event: React.FormEvent) {
    event.preventDefault()
    const query = new URLSearchParams()
    if (orderNumber.trim()) query.set("orderNumber", orderNumber.trim())
    if (orderStatus) query.set("orderStatus", orderStatus)
    if (paymentMethod) query.set("paymentMethod", paymentMethod)
    router.push(`/admin/orders${query.size > 0 ? `?${query.toString()}` : ""}`)
  }

  function clearFilters() {
    setOrderNumber("")
    setOrderStatus("")
    setPaymentMethod("")
    router.push("/admin/orders")
  }

  return (
    <form onSubmit={applyFilters} className="mb-6 flex flex-wrap items-end gap-3">
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
  )
}

export { OrderFilterForm }
