"use client"

import { useState, useTransition } from "react"
import { orderPaymentActionSchema } from "@/lib/admin/schemas"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import type { AdminActionFailure } from "@/app/admin/(protected)/orders/actions"

type PaymentAction = (input: unknown, orderId: string) => Promise<AdminActionFailure | undefined>

/**
 * VIDEO 09 — D026 GEVŞETİLDİ: `paymentStatus` artık panelden yönetilebiliyor,
 * ama YALNIZCA havale/EFT için (D007 — manuel onay). Shopier bir ödeme
 * sağlayıcısı değil AYRI bir satış kanalı olduğu için (D030) buradan
 * yönetilmez.
 *
 * `orderStatus` bu aksiyonlarla OTOMATİK değişmez: ödeme onayı siparişi
 * "Hazırlanıyor"a ÇEKMEZ — bu, admin'in kendi kararıdır ve sipariş kartındaki
 * durum formundan yapılır. Ödeme reddi ise siparişi iptal eder; bunu da
 * servis katmanı yapar, buradaki metin yalnızca sonucu anlatır.
 */
function OrderPaymentActions({
  orderId,
  paymentMethod,
  paymentStatus,
  confirmAction,
  rejectAction,
}: {
  orderId: string
  paymentMethod: string
  paymentStatus: string
  confirmAction: PaymentAction
  rejectAction: PaymentAction
}) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const isBankTransfer = paymentMethod === "BANK_TRANSFER"
  const isPendingPayment = paymentStatus === "PENDING"

  function run(action: PaymentAction) {
    // Tek alanlı da olsa client-taraflı ön doğrulama, diğer admin
    // formlarıyla tutarlılık için yapılır; sunucu aynı şemayı yeniden
    // çalıştırır ve asıl otorite odur.
    const parsed = orderPaymentActionSchema.safeParse({ orderId })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Geçersiz girdi.")
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await action(parsed.data, orderId)
      if (result && !result.success) setError(result.error.message)
    })
  }

  if (!isBankTransfer) {
    return (
      <p className="text-sm text-muted-foreground">
        Shopier kanalından yapılan satışlar bu panelden yönetilmez.
      </p>
    )
  }

  if (!isPendingPayment) {
    return (
      <p className="text-sm text-muted-foreground">
        {paymentStatus === "CONFIRMED"
          ? "Bu siparişin ödemesi onaylandı."
          : paymentStatus === "FAILED"
            ? "Bu siparişin ödemesi reddedildi."
            : "Bu siparişin ödemesi için bir işlem yapılamaz."}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Havale tutarı hesabınıza geçtiyse ödemeyi onaylayın. Onay, sipariş durumunu değiştirmez.
      </p>

      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={isPending} className="min-h-11" onClick={() => setConfirmOpen(true)}>
          {isPending ? "İşleniyor…" : "Ödemeyi Onayla"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          className="min-h-11"
          onClick={() => setRejectOpen(true)}
        >
          Ödemeyi Reddet
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Ödemeyi onayla"
        description="Bu siparişin ödemesi onaylanacak, ayrılan stok kalıcı olarak düşülecek. Sipariş durumu değişmez."
        confirmLabel="Ödemeyi Onayla"
        destructive={false}
        onConfirm={() => run(confirmAction)}
      />

      <ConfirmDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title="Ödemeyi reddet"
        description="Bu siparişin ödemesi reddedilecek, sipariş iptal edilecek ve ayrılan stok serbest bırakılacak."
        confirmLabel="Ödemeyi Reddet"
        destructive
        onConfirm={() => run(rejectAction)}
      />
    </div>
  )
}

export { OrderPaymentActions }
