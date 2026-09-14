import type { ReactNode } from "react"
import { cn } from "cn"

/**
 * VIDEO 08 STEP 3 — admin'in kendi içerik konteyneri. Genişlik brand-ui'nin
 * kesinleştirdiği değer: 1520px (1400-1600 aralığının ortası — storefront'un
 * 1400'ünden bilinçli olarak biraz geniş, admin tabloları daha fazla yatay
 * alana ihtiyaç duyar). Storefront'un `components/container.tsx`'ine
 * dokunulmadı — bağımsız dosya, tek bir paylaşılan genişlik zorunlu değil.
 * `AdminShell`'in `<main>`'inde TEK noktadan uygulanır.
 */
function AdminContainer({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-[1520px]", className)}>{children}</div>
}

export { AdminContainer }
