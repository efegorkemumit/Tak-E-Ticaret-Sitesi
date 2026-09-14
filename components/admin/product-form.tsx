"use client"

import { useState, useTransition } from "react"
import { createProductSchema, updateProductSchema } from "@/lib/admin/schemas"
import { Input } from "@/components/ui/input"
import { FormField } from "@/components/ui/form-field"
import { Button } from "@/components/ui/button"
import { AdminTextarea } from "@/components/admin/textarea"
import { AdminSelect } from "@/components/admin/select"
import { AdminCheckbox } from "@/components/admin/checkbox"
import { getProductStatusLabel } from "@/components/admin/status-labels"
import { AdminFormSection } from "@/components/admin/form-section"
import { AdminPageHeader } from "@/components/admin/page-header"
import type { AdminActionFailure } from "@/app/admin/(protected)/products/actions"

const STATUS_ITEMS = [
  { value: "DRAFT" as const, label: getProductStatusLabel("DRAFT") },
  { value: "PUBLISHED" as const, label: getProductStatusLabel("PUBLISHED") },
  { value: "ARCHIVED" as const, label: getProductStatusLabel("ARCHIVED") },
]

const FORM_ID = "product-basic-form"

export interface ProductFormInitialValues {
  id: string
  name: string
  slug: string
  description: string | null
  careInfo: string | null
  giftPackagingAvailable: boolean
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
  categoryId: string
  collectionIds: string[]
}

/**
 * Ürünün temel bilgileri (varyant/görsel/açıklayıcı öznitelik YÖNETİMİ bu
 * formda DEĞİL — `products/[id]` sayfasının ayrı bölümlerinde, kendi
 * Server Action'larıyla). `collectionIds` D023 gereği TAM DEĞİŞTİRME
 * (replace-all) semantiğiyle gönderilir — form her zaman güncel tam listeyi
 * gönderir (bkz. `lib/admin/products.ts`).
 *
 * VIDEO 08 STEP 3 (part 2) — iki sütunlu düzen (`docs/DESIGN_DIRECTION.md`
 * "Form Deseni"): sol/ana sütun (~2fr) "içerik girme" alanları (Temel
 * Bilgiler, Ürün Detayları), sağ/yan sütun (sabit 360px) "meta/karar"
 * alanları (Organizasyon, Yayın Durumu). Varyantlar/Görseller/Açıklayıcı
 * Öznitelikler BİLİNÇLİ OLARAK bu grid'in DIŞINDA, sayfa seviyesinde tam
 * genişlikte kalıyor — kendi ayrı tabloları/Server Action'ları var, dar bir
 * 2fr sütuna sıkıştırmak (ör. varyant tablosu) kullanılabilirliği bozardı.
 *
 * Kaydet aksiyonu artık `<form>` içine GÖMÜLÜ DEĞİL — sayfa başlığının
 * (`AdminPageHeader`) sağında, `form={FORM_ID}` HTML özniteliğiyle DOM'da
 * `<form>`'un DIŞINDA ama işlevsel olarak ona bağlı bir buton (standart,
 * geçerli HTML5 — ayrı bir state-lifting mekanizması gerekmedi, `isPending`
 * aynı component'in local state'i). `<768px` için EK bir `sticky bottom-0`
 * kopya buton (spec'in kesin isteği).
 *
 * BİLİNÇLİ SADELEŞTİRME: spec'in "'Taslak Olarak Kaydet' secondary +
 * 'Yayınla' primary" iki-butonlu önerisi UYGULANMADI — bu, "Yayın Durumu"
 * bölümündeki mevcut `Durum` seçiciyle (DRAFT/PUBLISHED/ARCHIVED, D021'in
 * gerçek yaşam döngüsü) hangisinin öncelikli olacağı gibi YENİ bir iş kuralı
 * gerektirirdi (görev talimatı: iş mantığına dokunma). Tek "Kaydet" butonu,
 * seçicideki durumu kullanır — audit'in asıl şikâyeti (buton sayfanın
 * ortasında kayboluyordu) bu YERLEŞİM değişikliğiyle zaten tam çözülüyor.
 */
function ProductForm({
  mode,
  pageTitle,
  pageDescription,
  categories,
  collections,
  initialValues,
  action,
}: {
  mode: "create" | "edit"
  pageTitle: string
  pageDescription?: string
  categories: { id: string; name: string }[]
  collections: { id: string; name: string }[]
  initialValues?: ProductFormInitialValues
  action: (input: unknown) => Promise<AdminActionFailure | undefined>
}) {
  const [name, setName] = useState(initialValues?.name ?? "")
  const [slug, setSlug] = useState(initialValues?.slug ?? "")
  const [description, setDescription] = useState(initialValues?.description ?? "")
  const [careInfo, setCareInfo] = useState(initialValues?.careInfo ?? "")
  const [giftPackagingAvailable, setGiftPackagingAvailable] = useState(initialValues?.giftPackagingAvailable ?? false)
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED" | "ARCHIVED">(initialValues?.status ?? "DRAFT")
  const [categoryId, setCategoryId] = useState(initialValues?.categoryId ?? "")
  const [collectionIds, setCollectionIds] = useState<string[]>(initialValues?.collectionIds ?? [])
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function toggleCollection(id: string) {
    setCollectionIds((current) => (current.includes(id) ? current.filter((c) => c !== id) : [...current, id]))
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    const base = { name, slug, description, careInfo, giftPackagingAvailable, status, categoryId, collectionIds }
    const payload = mode === "edit" ? { ...base, id: initialValues!.id } : base
    const schema = mode === "edit" ? updateProductSchema : createProductSchema
    const parsed = schema.safeParse(payload)
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
      if (result && !result.success) setFormError(result.error.message)
      // create'te `action` başarıda `redirect()` çağırır; edit'te sayfada kalınır.
    })
  }

  const saveLabel = isPending ? "Kaydediliyor…" : mode === "create" ? "Ürün Oluştur" : "Değişiklikleri Kaydet"

  return (
    <div className="flex flex-col gap-6 pb-20 md:pb-0">
      <AdminPageHeader
        title={pageTitle}
        description={pageDescription}
        action={
          <Button type="submit" form={FORM_ID} disabled={isPending} className="min-h-11 w-fit">
            {saveLabel}
          </Button>
        }
      />

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      {/* DÜZELTME (final inceleme) — `items-start` eklendi: varsayılan grid
          `align-items: stretch` her iki sütunu da satırın en uzun sütununa
          eşit yüksekliğe geriyordu; sağ sütun (Organizasyon + Yayın Durumu)
          soldan kısa olduğunda "Yayın Durumu" kartından sonra ~200px boş
          bant kalıyordu (`product-edit-1440` bulgusu). `items-start` her
          sütunu kendi içeriği kadar yükseklikte bırakır. */}
      <form
        id={FORM_ID}
        onSubmit={handleSubmit}
        noValidate
        className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_360px]"
      >
        <div className="flex flex-col gap-6">
          <AdminFormSection title="Temel Bilgiler">
            <FormField label="Ürün Adı" error={fieldErrors.name}>
              {(props) => <Input {...props} value={name} onChange={(e) => setName(e.target.value)} autoFocus />}
            </FormField>
            <FormField label="Slug" error={fieldErrors.slug}>
              {(props) => (
                <Input
                  {...props}
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder={mode === "create" ? "Boş bırakılırsa isimden otomatik oluşturulur" : undefined}
                />
              )}
            </FormField>
          </AdminFormSection>

          <AdminFormSection title="Ürün Detayları">
            <FormField label="Açıklama (opsiyonel)" error={fieldErrors.description}>
              {(props) => <AdminTextarea {...props} value={description} onChange={(e) => setDescription(e.target.value)} />}
            </FormField>
            <FormField label="Bakım Bilgisi (opsiyonel)" error={fieldErrors.careInfo}>
              {(props) => <AdminTextarea {...props} value={careInfo} onChange={(e) => setCareInfo(e.target.value)} />}
            </FormField>
            <AdminCheckbox
              id="giftPackagingAvailable"
              label="Hediye paketleme mevcut"
              checked={giftPackagingAvailable}
              onCheckedChange={setGiftPackagingAvailable}
            />
          </AdminFormSection>
        </div>

        <div className="flex flex-col gap-6">
          <AdminFormSection title="Organizasyon" description="Ürünün bağlı olduğu kategori ve koleksiyonlar.">
            <FormField label="Kategori" error={fieldErrors.categoryId}>
              {(props) => (
                <AdminSelect
                  {...props}
                  value={categoryId}
                  onValueChange={setCategoryId}
                  placeholder="Kategori seçin"
                  items={categories.map((c) => ({ value: c.id, label: c.name }))}
                />
              )}
            </FormField>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm text-foreground">Koleksiyonlar (opsiyonel)</span>
              {collections.length === 0 ? (
                <p className="text-sm text-muted-foreground">Henüz koleksiyon yok.</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {collections.map((collection) => (
                    <AdminCheckbox
                      key={collection.id}
                      id={`collection-${collection.id}`}
                      label={collection.name}
                      checked={collectionIds.includes(collection.id)}
                      onCheckedChange={() => toggleCollection(collection.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </AdminFormSection>

          <AdminFormSection title="Yayın Durumu">
            <FormField label="Durum" error={fieldErrors.status}>
              {(props) => <AdminSelect {...props} value={status} onValueChange={setStatus} items={STATUS_ITEMS} />}
            </FormField>
          </AdminFormSection>
        </div>
      </form>

      {/* `docs/DESIGN_DIRECTION.md`: "<768px'te aynı aksiyonlar EK olarak
          ekranın altına sabitlenen ikinci bir bar'da tekrarlanır." */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-background p-4 md:hidden">
        <Button type="submit" form={FORM_ID} disabled={isPending} className="min-h-11 w-full">
          {saveLabel}
        </Button>
      </div>
    </div>
  )
}

export { ProductForm }
