"use client"

import { Toast as ToastPrimitive } from "@base-ui/react/toast"
import { X } from "lucide-react"
import { cn } from "cn"

/**
 * `docs/COMPONENT_INVENTORY.md` #14 — başarı/hata/uyarı bildirimi, sade/tek
 * amaçlı. Ayrı bir paket (ör. sonner) KURULMADI — `@base-ui/react` zaten bir
 * proje bağımlılığı ve kendi Toast primitive'ini sağlıyor, yeni bir
 * dependency eklemekten kaçınıldı.
 *
 * Kullanım: `app/layout.tsx`'te `<ToastProvider>` tüm ağacı sarar (içinde
 * `<ToastRegion />` render edilir); herhangi bir client component
 * `useToast().add({ title, description, type })` ile bildirim tetikler.
 */
const useToast = ToastPrimitive.useToastManager

function ToastRegion() {
  const { toasts } = useToast()
  return (
    <ToastPrimitive.Portal>
      <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 sm:bottom-6 sm:right-6">
        {toasts.map((toast) => (
          <ToastPrimitive.Root
            key={toast.id}
            toast={toast}
            className={cn(
              "relative flex flex-col gap-1 rounded-md border border-border bg-background p-4 pr-8 shadow-lg",
              "data-[starting-style]:translate-x-full data-[starting-style]:opacity-0",
              "data-[ending-style]:opacity-0",
              "transition-all duration-200",
              toast.type === "error" && "border-destructive/40"
            )}
          >
            {toast.title && (
              <ToastPrimitive.Title className="text-sm font-medium text-foreground">
                {toast.title}
              </ToastPrimitive.Title>
            )}
            {toast.description && (
              <ToastPrimitive.Description className="text-sm text-muted-foreground">
                {toast.description}
              </ToastPrimitive.Description>
            )}
            <ToastPrimitive.Close
              aria-label="Bildirimi kapat"
              className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-4" />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
      </ToastPrimitive.Viewport>
    </ToastPrimitive.Portal>
  )
}

function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <ToastPrimitive.Provider>
      {children}
      <ToastRegion />
    </ToastPrimitive.Provider>
  )
}

export { ToastProvider, useToast }
