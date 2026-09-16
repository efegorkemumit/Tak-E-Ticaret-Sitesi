import { getSiteSettings } from "@/lib/settings/service"
import { AdminPageHeader } from "@/components/admin/page-header"
import { SiteSettingsForm } from "@/components/admin/site-settings-form"
import { updateSiteSettingsAction } from "./actions"

export const dynamic = "force-dynamic"

/**
 * VIDEO 09 — site ayarları: havale/EFT hesap bilgileri (D006/D007) ve
 * rezervasyon bekleme süresi (D018). Bu değerler müşteriye gösterilen
 * ödeme talimatını ve stok serbest bırakma zamanlamasını doğrudan
 * belirlediği için ürün düzenleme sayfasıyla AYNI form deseni
 * (`AdminPageHeader` + `AdminFormSection`, `max-w-[1200px]`) kullanılır.
 *
 * `getSiteSettings()` ayar HİÇ kurulmadıysa `null` döner — form o durumda
 * boş/varsayılan değerlerle açılır (bkz. `SiteSettingsForm`).
 */
export default async function AdminSettingsPage() {
  const settings = await getSiteSettings()

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
      <AdminPageHeader
        title="Site Ayarları"
        description="Havale/EFT hesap bilgileri ve sipariş bekleme süresi. Bu bilgiler müşterinin ödeme ekranında birebir gösterilir."
      />

      <SiteSettingsForm initialValues={settings} action={updateSiteSettingsAction} />
    </div>
  )
}
