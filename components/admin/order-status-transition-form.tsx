"use client"

import { useState, useTransition } from "react"
import { getAllowedNextOrderStatuses } from "@/lib/admin/order-status"
import { updateOrderStatusSchema } from "@/lib/admin/schemas"
import { Input } from "@/components/ui/input"
import { FormField } from "@/components/ui/form-field"
import { Button } from "@/components/ui/button"
import { AdminSelect } from "@/components/admin/select"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { getOrderStatusLabel } from "@/components/admin/status-labels"
import type { AdminActionFailure } from "@/app/admin/(protected)/orders/actions"

type OrderStatus = "PAYMENT_PENDING" | "PREPARING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "RETURNED"

/**
 * Geçiş kuralları OTORİTER kaynaktan (`lib/admin/order-status.ts`,
 * Prisma'ya bağımlı değil) DOĞRUDAN import edilir — burada KEYFİ bir kural
 * tekrarlanmaz, dropdown yalnızca `getAllowedNextOrderStatuses`'in izin
 * verdiği hedefleri listeler. `CANCELLED` hedefi geri dönüşü zor bir eylem
 * olduğu için `ConfirmDialog` ister (D029'daki "arşivleme onay ister"
 * deseniyle tutarlı). `paymentStatus` bu formda YOKTUR — D026 sert kuralı.
 */
function OrderStatusTransitionForm({
  orderId,
  currentStatus,
  action,
}: {
  orderId: string
  currentStatus: OrderStatus
  action: (input: unknown, orderId: string) => Promise<AdminActionFailure | undefined>
}) {
  const allowedNext = getAllowedNextOrderStatuses(currentStatus)
  const [targetStatus, setTargetStatus] = useState<OrderStatus | "">("")
  const [shippingCarrier, setShippingCarrier] = useState("")
  const [trackingNumber, setTrackingNumber] = useState("")
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (allowedNext.length === 0) {
    return <p className="text-sm text-muted-foreground">Bu sipariş nihai bir durumda — başka bir duruma geçiş yapılamaz.</p>
  }

  function submitTransition() {
    const parsed = updateOrderStatusSchema.safeParse({
      orderId,
      targetStatus,
      shippingCarrier: shippingCarrier || undefined,
      trackingNumber: trackingNumber || undefined,
    })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Geçersiz girdi.")
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await action(parsed.data, orderId)
      if (result && !result.success) {
        setError(result.error.message)
        return
      }
      setTargetStatus("")
      setShippingCarrier("")
      setTrackingNumber("")
    })
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!targetStatus) {
      setError("Lütfen bir hedef durum seçin.")
      return
    }
    if (targetStatus === "CANCELLED") {
      setConfirmOpen(true)
      return
    }
    submitTransition()
  }

  return (
    <>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <FormField label="Yeni Durum" className="w-56">
          {(props) => (
            <AdminSelect
              {...props}
              value={targetStatus}
              onValueChange={(value) => setTargetStatus(value as OrderStatus)}
              items={allowedNext.map((status) => ({ value: status, label: getOrderStatusLabel(status) }))}
              placeholder="Durum seçin"
            />
          )}
        </FormField>

        {targetStatus === "SHIPPED" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Kargo Firması (opsiyonel)">
              {(props) => <Input {...props} value={shippingCarrier} onChange={(e) => setShippingCarrier(e.target.value)} />}
            </FormField>
            <FormField label="Takip Numarası (opsiyonel)">
              {(props) => <Input {...props} value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} />}
            </FormField>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={isPending} className="min-h-11 w-fit">
          {isPending ? "Güncelleniyor…" : "Durumu Güncelle"}
        </Button>
      </form>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Siparişi iptal et"
        description="Bu sipariş iptal edilecek ve aktif stok rezervasyonları serbest bırakılacak. Bu işlem geri alınamaz."
        confirmLabel="Siparişi İptal Et"
        destructive
        onConfirm={submitTransition}
      />
    </>
  )
}

export { OrderStatusTransitionForm }
