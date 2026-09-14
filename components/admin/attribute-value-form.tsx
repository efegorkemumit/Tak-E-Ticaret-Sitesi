"use client"

import { useState, useTransition } from "react"
import { createAttributeValueSchema } from "@/lib/admin/schemas"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { AttributeActionFailure } from "@/app/admin/(protected)/attributes/actions"

/** Bir öznitelik TİPİNE (ör. "Taş Türü") yeni bir DEĞER (ör. "Zümrüt") ekler. */
function AttributeValueForm({
  attributeDefinitionId,
  action,
}: {
  attributeDefinitionId: string
  action: (input: unknown) => Promise<AttributeActionFailure | undefined>
}) {
  const [value, setValue] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const parsed = createAttributeValueSchema.safeParse({ attributeDefinitionId, value })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Geçersiz değer.")
      return
    }
    setError(null)

    startTransition(async () => {
      const result = await action(parsed.data)
      if (result && !result.success) {
        setError(result.error.message)
        return
      }
      setValue("")
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex items-start gap-2">
      <div className="flex flex-col gap-1">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Yeni değer (ör. Zümrüt)"
          aria-label="Yeni öznitelik değeri"
          aria-invalid={Boolean(error)}
          className="w-48"
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
      <Button type="submit" variant="outline" disabled={isPending} className="min-h-11">
        {isPending ? "Ekleniyor…" : "Değer Ekle"}
      </Button>
    </form>
  )
}

export { AttributeValueForm }
