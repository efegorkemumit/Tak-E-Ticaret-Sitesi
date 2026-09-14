import type { ReactNode } from "react"

/**
 * Her admin sayfasının kendi içerik alanının başında kullanacağı başlık
 * satırı (ör. "Ürünler" + sağda "Yeni Ürün Ekle" butonu). `AdminTopbar`'daki
 * kalıcı üst şeritten AYRIDIR — o yalnızca bölüm adını gösteren ince bir
 * şerit, bu ise sayfanın kendi H1'i + opsiyonel aksiyon/açıklama alanı.
 */
function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-2xl text-foreground">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  )
}

export { AdminPageHeader }
