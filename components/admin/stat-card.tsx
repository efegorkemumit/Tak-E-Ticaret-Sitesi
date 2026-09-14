/**
 * Dashboard'daki metrik kartları. `value` kasıtlı olarak `string` (gerçek
 * sayı değil) — Wave A'da hiçbir gerçek sorguya bağlı değiliz, bu yüzden
 * `app/admin/page.tsx` buraya her zaman `"—"` gibi açıkça yer tutucu bir
 * değer geçer, asla uydurulmuş bir rakam DEĞİL (bkz. o dosyadaki not).
 */
function StatCard({
  label,
  value,
  caption,
}: {
  label: string
  value: string
  caption?: string
}) {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-border p-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-display text-3xl text-foreground">{value}</span>
      {caption && <span className="text-xs text-muted-foreground">{caption}</span>}
    </div>
  )
}

export { StatCard }
