import type { LucideIcon } from "lucide-react"
import { cn } from "cn"

/**
 * Dashboard KPI kartı — `docs/DESIGN_DIRECTION.md`'nin "KPI Kart Anatomisi"
 * BİREBİR: solda 40px ikon kutusu + sağda dikey stack (değer üstte 30px/600
 * `tabular-nums`, etiket altta 13px/500). `tone="warning"` yalnızca eylem
 * gerektiren KPI'lar için (ör. "Stokta Tükenen Varyant") — nötr bir
 * sayaçla (ör. "Toplam Sipariş") AYNI ağırlıkta gösterilmez (audit bulgusu).
 *
 * **Kesin yasak (spec):** sahte trend yüzdesi veya sahte/örnek sparkline
 * YOK — bu component'te böyle bir prop/slot BİLİNÇLİ OLARAK yok, gerçek
 * zaman-serisi veri gelmeden eklenmeyecek.
 */
function StatCard({
  label,
  value,
  caption,
  icon: Icon,
  tone = "neutral",
}: {
  label: string
  value: string
  caption?: string
  icon: LucideIcon
  tone?: "neutral" | "warning"
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-surface p-5">
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-md",
          tone === "warning" ? "bg-warning/10 text-warning" : "bg-surface-muted text-muted-foreground"
        )}
      >
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-0.5">
        <span className="text-admin-kpi-value font-semibold text-foreground tabular-nums">{value}</span>
        <span className="text-admin-kpi-label text-muted-foreground">{label}</span>
        {caption && <span className="text-admin-helper text-muted-foreground">{caption}</span>}
      </div>
    </div>
  )
}

export { StatCard }
