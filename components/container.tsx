import type { ReactNode } from "react"
import { cn } from "cn"

/**
 * VIDEO 08 STEP 2 — tek konteyner kaynağı. Öncesinde her sayfa kendi
 * `mx-auto max-w-Nxl px-4 sm:px-6`'ını elle yazıyordu (audit bulgusu: header/
 * footer/sayfa içeriği üç farklı genişlikte, 1920px'de tutarsız sol kenarlar).
 * `size="page"` (varsayılan) header/footer/tüm katalog sayfalarında;
 * `size="narrow"` yalnızca sepet/sipariş-sonucu gibi tek-kolon, form-ağırlıklı
 * akışlarda kullanılır — genişlikler `app/globals.css`'teki `--container-*`
 * token'larından gelir, burada BİR DAHA rakam yazılmaz. Padding skalası
 * `docs/DESIGN_DIRECTION.md`'nin "Ek: Storefront Redesign Spesifikasyonu"
 * bölümüyle BİREBİR: 16px → 24px (`sm:`) → 40px (`lg:`) → 64px (`xl:`).
 */
function Container({
  size = "page",
  className,
  children,
}: {
  size?: "page" | "narrow"
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-10 xl:px-16",
        size === "page" ? "max-w-page" : "max-w-narrow",
        className
      )}
    >
      {children}
    </div>
  )
}

export { Container }
