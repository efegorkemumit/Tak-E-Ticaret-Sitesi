"use client"

import { useState, useTransition } from "react"
import { updateSiteSettingsSchema } from "@/lib/settings/schemas"
import { formatIbanForDisplay } from "@/lib/settings/iban"
import { renderTransferDescription } from "@/lib/settings/transfer-description"
import {
  ORDER_NUMBER_PLACEHOLDER,
  DEFAULT_TRANSFER_DESCRIPTION_TEMPLATE,
  DEFAULT_RESERVATION_WINDOW_HOURS,
} from "@/lib/settings/constants"
import { Input } from "@/components/ui/input"
import { FormField } from "@/components/ui/form-field"
import { Button } from "@/components/ui/button"
import { AdminFormSection } from "@/components/admin/form-section"
import type { AdminActionFailure } from "@/app/admin/(protected)/settings/actions"

/**
 * Canlı önizlemede kullanılan ÖRNEK sipariş numarası. Biçim
 * `lib/commerce/order-number.ts`'teki gerçek üretimle (`ORD-YYYYMMDD-XXXXXX`)
 * aynıdır ki admin, banka ekstresinde göreceği açıklamanın gerçek şeklini
 * görsün.
 */
const SAMPLE_ORDER_NUMBER = "ORD-20260916-A1B2C3"

/**
 * `SiteSettingsDto`'nun client tarafındaki KOPYASI. `lib/settings/service.ts`
 * sunucu-taraflı (Prisma zinciri) olduğu için buradan import EDİLMEZ —
 * `product-descriptive-attributes-section.tsx`'teki aynı disiplin.
 */
interface SiteSettingsFormValues {
  bankName: string
  accountHolder: string
  iban: string
  ibanFormatted: string
  transferDescriptionTemplate: string
  reservationWindowHours: number
}

/**
 * Havale/EFT bilgileri (D006/D007) + rezervasyon penceresi (D018).
 *
 * Client-taraflı ön doğrulama `updateSiteSettingsSchema` ile yapılır —
 * `product-form.tsx`'teki `safeParse` → `fieldErrors` → `FormField error`
 * deseninin aynısı. Bu YALNIZCA kullanıcı deneyimi içindir: sunucu
 * (`updateSiteSettings`) aynı şemayı kendisi yeniden çalıştırır.
 *
 * Kaydet butonu formun ALTINDA (ürün formundaki gibi başlıkta DEĞİL):
 * ürün formunda butonun başlığa taşınma gerekçesi, sayfanın çok bölümlü ve
 * uzun olması yüzünden butonun ortada kaybolmasıydı; bu form tek ekrana
 * sığdığı için aynı sorun yok ve sipariş detayındaki
 * (`OrderStatusTransitionForm`) mevcut "form + altında aksiyon" deseniyle
 * tutarlı kalıyor.
 */
function SiteSettingsForm({
  initialValues,
  action,
}: {
  /** Ayar satırı HİÇ kurulmadıysa `null` — form varsayılanlarla açılır. */
  initialValues: SiteSettingsFormValues | null
  action: (input: unknown) => Promise<AdminActionFailure | undefined>
}) {
  const [bankName, setBankName] = useState(initialValues?.bankName ?? "")
  const [accountHolder, setAccountHolder] = useState(initialValues?.accountHolder ?? "")
  // Alan GÖSTERİM biçimiyle (4'lü gruplu) doldurulur; kullanıcı boşluklu
  // yazabilir — şema girdiyi zaten kanonikleştiriyor (bkz. `iban.ts`).
  const [iban, setIban] = useState(initialValues?.ibanFormatted ?? "")
  const [transferDescriptionTemplate, setTransferDescriptionTemplate] = useState(
    initialValues?.transferDescriptionTemplate ?? DEFAULT_TRANSFER_DESCRIPTION_TEMPLATE
  )
  const [reservationWindowHours, setReservationWindowHours] = useState(
    String(initialValues?.reservationWindowHours ?? DEFAULT_RESERVATION_WINDOW_HOURS)
  )
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  const templatePreview = renderTransferDescription(transferDescriptionTemplate, SAMPLE_ORDER_NUMBER)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSaved(false)

    // Boş/sayı olmayan girdiyi ÖNCE burada yakalıyoruz: `Number("")` → `NaN`
    // ve zod'un `z.number()` için ürettiği tip hatası mesajı İngilizce'dir
    // (D002). Şemadaki diğer tüm mesajlar Türkçe sabitler olduğu için tek
    // istisnayı burada kapatıyoruz.
    const hours = Number(reservationWindowHours.trim())
    if (reservationWindowHours.trim() === "" || Number.isNaN(hours)) {
      setFieldErrors({ reservationWindowHours: "Bekleme süresi için bir sayı girin." })
      return
    }

    const parsed = updateSiteSettingsSchema.safeParse({
      bankName,
      accountHolder,
      iban,
      transferDescriptionTemplate,
      reservationWindowHours: hours,
    })
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {}
      for (const issue of parsed.error.issues) nextErrors[issue.path.join(".")] = issue.message
      setFieldErrors(nextErrors)
      return
    }
    setFieldErrors({})
    setFormError(null)

    startTransition(async () => {
      const result = await action(parsed.data)
      if (result && !result.success) {
        setFormError(result.error.message)
        return
      }
      // Şemanın ÇIKTISI kanonik IBAN'dır (transform) — kaydettikten sonra
      // alanı gruplanmış hâline çeviriyoruz ki admin, DB'ye ne yazıldığını
      // ve müşterinin ne göreceğini birebir görsün.
      setIban(formatIbanForDisplay(parsed.data.iban))
      setSaved(true)
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_360px]">
      <div className="flex flex-col gap-6">
        <AdminFormSection
          title="Havale / EFT Bilgileri"
          description="Müşteri havale ile ödeme seçtiğinde bu bilgiler sipariş özet ekranında gösterilir."
        >
          <FormField label="Banka Adı" error={fieldErrors.bankName}>
            {(props) => <Input {...props} value={bankName} onChange={(e) => setBankName(e.target.value)} />}
          </FormField>

          <FormField label="Hesap Sahibi" error={fieldErrors.accountHolder}>
            {(props) => <Input {...props} value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} />}
          </FormField>

          <div className="flex flex-col gap-1.5">
            <FormField label="IBAN" error={fieldErrors.iban}>
              {(props) => (
                <Input
                  {...props}
                  value={iban}
                  onChange={(e) => setIban(e.target.value)}
                  placeholder="TR00 0000 0000 0000 0000 0000 00"
                  autoComplete="off"
                  spellCheck={false}
                  className="font-mono tabular-nums"
                />
              )}
            </FormField>
            <p className="text-admin-helper text-muted-foreground">
              Boşluklu yazabilirsiniz; kaydedildiğinde 4&apos;lü gruplar hâlinde gösterilir. IBAN&apos;ın sağlama
              toplamı kontrol edilir — tek haneli bir yazım hatası bile reddedilir.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <FormField label="Havale Açıklama Şablonu" error={fieldErrors.transferDescriptionTemplate}>
              {(props) => (
                <Input
                  {...props}
                  value={transferDescriptionTemplate}
                  onChange={(e) => setTransferDescriptionTemplate(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                />
              )}
            </FormField>
            <p className="text-admin-helper text-muted-foreground">
              <code className="font-mono">{ORDER_NUMBER_PLACEHOLDER}</code> yer tutucusu, müşteriye gösterilirken
              sipariş numarasıyla değiştirilir. Şablon bu yer tutucuyu İÇERMEK ZORUNDADIR — aksi halde her siparişin
              açıklaması aynı olur ve ödemeyi siparişle eşleştiremezsiniz.
            </p>
            <p className="text-admin-helper text-muted-foreground">
              Önizleme: <span className="font-mono text-foreground">{templatePreview}</span>
            </p>
          </div>
        </AdminFormSection>
      </div>

      <div className="flex flex-col gap-6">
        <AdminFormSection title="Sipariş Bekleme Süresi">
          <div className="flex flex-col gap-1.5">
            <FormField label="Rezervasyon Süresi (saat)" error={fieldErrors.reservationWindowHours}>
              {(props) => (
                <Input
                  {...props}
                  type="number"
                  min={1}
                  max={720}
                  step={1}
                  inputMode="numeric"
                  value={reservationWindowHours}
                  onChange={(e) => setReservationWindowHours(e.target.value)}
                  className="tabular-nums"
                />
              )}
            </FormField>
            <p className="text-admin-helper text-muted-foreground">
              Havale ödemesi bu süre içinde onaylanmazsa sipariş iptal edilir ve ayrılan stok serbest bırakılır (D018).
            </p>
          </div>
        </AdminFormSection>
      </div>

      {/* Aksiyon satırı grid'in DIŞINDA değil, tam genişlikte son satırında —
          iki sütun da kaydedilen aynı formun parçası. */}
      <div className="flex flex-col gap-2 lg:col-span-2">
        {formError && <p className="text-sm text-destructive">{formError}</p>}
        {saved && <p className="text-sm text-success">Ayarlar kaydedildi.</p>}
        <Button type="submit" disabled={isPending} className="min-h-11 w-fit">
          {isPending ? "Kaydediliyor…" : "Ayarları Kaydet"}
        </Button>
      </div>
    </form>
  )
}

export { SiteSettingsForm }
