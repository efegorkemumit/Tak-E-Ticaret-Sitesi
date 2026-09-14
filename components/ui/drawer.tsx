import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer"
import { X } from "lucide-react"
import { cn } from "cn"

/**
 * Mobil navigasyon/sepet gibi kenar çekmecesi ihtiyaçları için genel amaçlı
 * primitive (shadcn'in `Sheet`'ine karşılık gelir, bu projede Base UI'ın
 * `Drawer` primitive'i üzerine kurulmuştur).
 *
 * NAVİGASYON LİNKLERİ İÇİN `DrawerClose` KULLANMAYIN: `DrawerClose` Base
 * UI'da kavramsal olarak her zaman bir "buton"dur ("A button that closes the
 * drawer") — `nativeButton={false}` yalnızca "gerçek `<button>` mi yoksa
 * taklit mi" ayrımını yapar, "buton mu link mi" ayrımını YAPMAZ; sonuçta
 * `render={<Link/>}` ile bile erişilebilirlik ağacında her zaman
 * `role="button"` üretir, gerçek `role="link"` asla üretilemez (qa'nın
 * bulgusu, `node_modules/@base-ui/react/internals/types.d.ts`'te doğrulandı).
 * Gerçek bir navigasyon linki gerekiyorsa `Drawer`'ı controlled
 * (`open`/`onOpenChange`) tutup düz `<Link onClick={() => setOpen(false)}>`
 * kullanın — bkz. `components/mobile-nav.tsx`, `components/cart/cart-drawer.tsx`.
 */
const Drawer = DrawerPrimitive.Root
const DrawerTrigger = DrawerPrimitive.Trigger
const DrawerClose = DrawerPrimitive.Close

function DrawerPortal({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />
}

function DrawerBackdrop({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Backdrop>) {
  return (
    <DrawerPrimitive.Backdrop
      data-slot="drawer-backdrop"
      className={cn(
        "fixed inset-0 z-50 bg-foreground/30 transition-opacity duration-200",
        "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
        className
      )}
      {...props}
    />
  )
}

function DrawerContent({
  className,
  children,
  side = "right",
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Popup> & {
  side?: "left" | "right"
}) {
  return (
    <DrawerPortal>
      <DrawerBackdrop />
      {/* Base UI, swipe-to-dismiss ve touch scroll locking için Popup'ın bir
          Viewport içinde render edilmesini bekliyor (qa'nın bulduğu console
          uyarısı) — Popup'ın kendi `fixed` konumlandırması buradan
          etkilenmiyor, Viewport yalnızca davranışı sağlıyor. */}
      <DrawerPrimitive.Viewport>
        <DrawerPrimitive.Popup
          data-slot="drawer-content"
          className={cn(
            "fixed inset-y-0 z-50 flex w-full max-w-xs flex-col gap-4 bg-background p-6 shadow-xl outline-none transition-transform duration-200",
            side === "right" &&
              "right-0 data-[starting-style]:translate-x-full data-[ending-style]:translate-x-full",
            side === "left" &&
              "left-0 data-[starting-style]:-translate-x-full data-[ending-style]:-translate-x-full",
            className
          )}
          {...props}
        >
          {children}
          <DrawerClose
            aria-label="Menüyü kapat"
            className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-5" />
          </DrawerClose>
        </DrawerPrimitive.Popup>
      </DrawerPrimitive.Viewport>
    </DrawerPortal>
  )
}

function DrawerTitle({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn("font-display text-lg text-foreground", className)}
      {...props}
    />
  )
}

export {
  Drawer,
  DrawerTrigger,
  DrawerClose,
  DrawerPortal,
  DrawerBackdrop,
  DrawerContent,
  DrawerTitle,
}
