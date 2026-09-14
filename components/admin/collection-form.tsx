"use client"

import { useState, useTransition } from "react"
import { createCollectionSchema, updateCollectionSchema } from "@/lib/admin/schemas"
import { Input } from "@/components/ui/input"
import { FormField } from "@/components/ui/form-field"
import { Button } from "@/components/ui/button"
import { AdminTextarea } from "@/components/admin/textarea"
import type { CollectionActionFailure } from "@/app/admin/(protected)/collections/actions"

/** `CategoryForm`'la aynı desen — koleksiyon ↔ ürün ilişkisi burada değil, `ProductForm`'daki çoklu seçimde yönetilir (D023). */
function CollectionForm({
  mode,
  initialValues,
  action,
}: {
  mode: "create" | "edit"
  initialValues?: { id: string; name: string; slug: string; description: string | null }
  action: (input: unknown) => Promise<CollectionActionFailure | undefined>
}) {
  const [name, setName] = useState(initialValues?.name ?? "")
  const [slug, setSlug] = useState(initialValues?.slug ?? "")
  const [description, setDescription] = useState(initialValues?.description ?? "")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    const payload =
      mode === "edit"
        ? { id: initialValues!.id, name, slug, description }
        : { name, slug, description }
    const schema = mode === "edit" ? updateCollectionSchema : createCollectionSchema
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
      // Başarıda `action` kendi içinde `redirect()` çağırır — buraya hiç dönmez.
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex max-w-lg flex-col gap-4">
      <FormField label="Koleksiyon Adı" error={fieldErrors.name}>
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
      <FormField label="Açıklama (opsiyonel)" error={fieldErrors.description}>
        {(props) => <AdminTextarea {...props} value={description} onChange={(e) => setDescription(e.target.value)} />}
      </FormField>

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <Button type="submit" disabled={isPending} className="min-h-11 w-fit">
        {isPending ? "Kaydediliyor…" : mode === "create" ? "Koleksiyon Oluştur" : "Değişiklikleri Kaydet"}
      </Button>
    </form>
  )
}

export { CollectionForm }
