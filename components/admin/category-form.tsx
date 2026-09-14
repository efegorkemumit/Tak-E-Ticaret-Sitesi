"use client"

import { useState, useTransition } from "react"
import { createCategorySchema, updateCategorySchema } from "@/lib/admin/schemas"
import { Input } from "@/components/ui/input"
import { FormField } from "@/components/ui/form-field"
import { Button } from "@/components/ui/button"
import { AdminTextarea } from "@/components/admin/textarea"
import { AdminFormSection } from "@/components/admin/form-section"
import type { CategoryActionFailure } from "@/app/admin/(protected)/categories/actions"

/**
 * `LoginForm`/`SetupForm` deseniyle aynı: client-side ön doğrulama GERÇEK
 * Zod şemasıyla (`lib/admin/schemas.ts`, doğrudan import — barrel değil),
 * asıl doğrulama her zaman sunucuda (`lib/admin/categories.ts`) tekrar
 * yapılır. `slug` alanı create'te boş bırakılabilir (serviste isimden
 * türetilir), edit'te zorunludur.
 */
function CategoryForm({
  mode,
  initialValues,
  action,
}: {
  mode: "create" | "edit"
  initialValues?: { id: string; name: string; slug: string; description: string | null }
  action: (input: unknown) => Promise<CategoryActionFailure | undefined>
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
    const schema = mode === "edit" ? updateCategorySchema : createCategorySchema
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
    <form onSubmit={handleSubmit} noValidate className="max-w-lg">
      <AdminFormSection title="Kategori Bilgileri">
        <FormField label="Kategori Adı" error={fieldErrors.name}>
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
          {isPending ? "Kaydediliyor…" : mode === "create" ? "Kategori Oluştur" : "Değişiklikleri Kaydet"}
        </Button>
      </AdminFormSection>
    </form>
  )
}

export { CategoryForm }
