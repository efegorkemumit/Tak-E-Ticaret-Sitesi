import type { ReactNode } from "react"
import { cn } from "cn"

/**
 * VIDEO 08 STEP 3 (part 2) — `docs/DESIGN_DIRECTION.md`'nin "Form Deseni"
 * anatomisiyle BİREBİR: her bölüm gerçek bir KART (`surface` zemin, `border`,
 * `rounded-lg`, başlık + ince `border-b` ayracı + 24px iç boşluk) — bir
 * işlevsel gruplama sınırı, dekorasyon değil.
 */
function AdminFormSection({
  title,
  description,
  className,
  children,
}: {
  title: string
  description?: string
  className?: string
  children: ReactNode
}) {
  return (
    <section className={cn("rounded-lg border border-border bg-surface p-6", className)}>
      <div className="mb-4 flex flex-col gap-1 border-b border-border pb-4">
        <h3 className="text-admin-section-title font-semibold text-foreground">{title}</h3>
        {description && <p className="text-admin-helper text-muted-foreground">{description}</p>}
      </div>
      <div className="flex flex-col gap-5">{children}</div>
    </section>
  )
}

export { AdminFormSection }
