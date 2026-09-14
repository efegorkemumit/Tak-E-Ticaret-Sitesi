import type { ReactNode } from "react"

/**
 * Her admin sayfasının kendi içerik alanının başında kullanacağı başlık
 * satırı (ör. "Ürünler" + sağda "Yeni Ürün Ekle" butonu). `AdminTopbar`'daki
 * kalıcı üst şeritten AYRIDIR — o yalnızca konum bilgisi veren ince bir
 * breadcrumb, bu ise sayfanın kendi H1'i + opsiyonel aksiyon/açıklama alanı.
 *
 * VIDEO 08 STEP 3 (part 2) — tipografi `docs/DESIGN_DIRECTION.md`'nin admin
 * tablosuyla BİREBİR: Page Title 24px/600, `font-display` (storefront'un
 * serif'i) admin'de HİÇ kullanılmaz.
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
        <h2 className="text-admin-page-title font-semibold text-foreground">{title}</h2>
        {description && <p className="text-admin-helper text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  )
}

export { AdminPageHeader }
