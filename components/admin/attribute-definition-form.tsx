"use client"

import { useState, useTransition } from "react"
import { createAttributeDefinitionSchema } from "@/lib/admin/schemas"
import { Input } from "@/components/ui/input"
import { FormField } from "@/components/ui/form-field"
import { Button } from "@/components/ui/button"
import type { AttributeActionFailure } from "@/app/admin/(protected)/attributes/actions"

/**
 * D028 — yeni bir öznitelik TİPİ (ör. "materyal") oluşturur. Bu ekranda bir
 * düzenleme/silme YOK (bkz. `lib/admin/attributes.ts` dosya başı notu) —
 * yalnızca oluşturma. Başarıda `action` `revalidatePath` çağırdığı için
 * (redirect YOK) form burada elle sıfırlanır.
 */
function AttributeDefinitionForm({ action }: { action: (input: unknown) => Promise<AttributeActionFailure | undefined> }) {
  const [key, setKey] = useState("")
  const [label, setLabel] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const parsed = createAttributeDefinitionSchema.safeParse({ key, label })
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
      setKey("")
      setLabel("")
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-wrap items-end gap-3">
      <FormField label="Anahtar (ör. tasTuru)" error={fieldErrors.key} className="w-48">
        {(props) => <Input {...props} value={key} onChange={(e) => setKey(e.target.value)} />}
      </FormField>
      <FormField label="Etiket (ör. Taş Türü)" error={fieldErrors.label} className="w-56">
        {(props) => <Input {...props} value={label} onChange={(e) => setLabel(e.target.value)} />}
      </FormField>
      <Button type="submit" disabled={isPending} className="min-h-11">
        {isPending ? "Ekleniyor…" : "Öznitelik Tipi Ekle"}
      </Button>
      {formError && <p className="w-full text-sm text-destructive">{formError}</p>}
    </form>
  )
}

export { AttributeDefinitionForm }
