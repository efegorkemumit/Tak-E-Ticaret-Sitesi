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
import type { AdminActionFailure } from "@/app/admin/(protected)/products/actions"

const STATUS_ITEMS = [
  { value: "DRAFT" as const, label: getProductStatusLabel("DRAFT") },
  { value: "PUBLISHED" as const, label: getProductStatusLabel("PUBLISHED") },
  { value: "ARCHIVED" as const, label: getProductStatusLabel("ARCHIVED") },
]

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
 */
function ProductForm({
  mode,
  categories,
  collections,
  initialValues,
  action,
}: {
  mode: "create" | "edit"
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

  return (
    <form onSubmit={handleSubmit} noValidate className="flex max-w-2xl flex-col gap-4">
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

      <div className="grid gap-4 sm:grid-cols-2">
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
        <FormField label="Durum" error={fieldErrors.status}>
          {(props) => <AdminSelect {...props} value={status} onValueChange={setStatus} items={STATUS_ITEMS} />}
        </FormField>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-foreground">Koleksiyonlar (opsiyonel, çoklu seçilebilir)</span>
        {collections.length === 0 ? (
          <p className="text-sm text-muted-foreground">Henüz koleksiyon yok.</p>
        ) : (
          <div className="flex flex-wrap gap-x-4 gap-y-1">
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

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <Button type="submit" disabled={isPending} className="min-h-11 w-fit">
        {isPending ? "Kaydediliyor…" : mode === "create" ? "Ürün Oluştur" : "Değişiklikleri Kaydet"}
      </Button>
    </form>
  )
}

export { ProductForm }
