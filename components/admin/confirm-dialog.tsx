"use client"

import { Dialog } from "@base-ui/react/dialog"
import { cn } from "cn"
import { Button, buttonVariants } from "@/components/ui/button"

/**
 * Yıkıcı/arşivleme işlemleri için onay diyaloğu (D029 — kalıcı silme yok,
 * yalnızca ARCHIVED'a geçiş; ama arşivleme de "geri dönüşü kolay olmayan"
 * bir eylem olduğu için onay ister). `components/ui/*` YALNIZCA okuma
 * amaçlıydı (dosya sahipliği sınırı) — bu yüzden Dialog primitive'i burada,
 * admin'e özgü, kendi başına kuruldu; genel bir `components/ui/dialog.tsx`
 * eklenmedi.
 *
 * Controlled component: açık/kapalı state'i ve onay callback'i çağırana ait.
 */
function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Onayla",
  cancelLabel = "Vazgeç",
  destructive = true,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-foreground/30" />
        <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <Dialog.Popup className="flex w-full max-w-sm flex-col gap-4 rounded-md border border-border bg-background p-6 shadow-xl outline-none">
            <div className="flex flex-col gap-1.5">
              <Dialog.Title className="font-display text-lg text-foreground">{title}</Dialog.Title>
              {description && (
                <Dialog.Description className="text-sm text-muted-foreground">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Dialog.Close
                className={cn(buttonVariants({ variant: "outline" }), "min-h-11")}
              >
                {cancelLabel}
              </Dialog.Close>
              <Button
                variant={destructive ? "destructive" : "default"}
                className="min-h-11"
                onClick={() => {
                  onConfirm()
                  onOpenChange(false)
                }}
              >
                {confirmLabel}
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export { ConfirmDialog }
