"use client"

import { useState, useTransition } from "react"
import { X } from "lucide-react"
import { createDescriptiveAttributeSchema } from "@/lib/admin/schemas"
import { FormField } from "@/components/ui/form-field"
import { Button } from "@/components/ui/button"
import { AdminSelect } from "@/components/admin/select"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import type { AdminActionFailure } from "@/app/admin/(protected)/products/actions"

interface DescriptiveAttribute {
  id: string
  attributeDefinitionId: string
  type: string
  label: string
  attributeValueId: string
  value: string
}

interface AttributeDefinition {
  id: string
  key: string
  label: string
  values: { id: string; value: string }[]
}

/**
 * D020 — AÇIKLAYICI/spec öznitelikler (`ProductAttributeValue`), varyant
 * seçimiyle (D019/D020, `ProductVariantsSection`) KARIŞTIRILMAZ: bir değer
 * burada birden fazla kez eklenebilir (şemada bu ikili için unique kısıt
 * yok, bkz. `lib/admin/products.ts`).
 *
 * KALDIRMA satırın kendi `id`'sine (`AdminDescriptiveAttributeDto.id`,
 * commerce'in eklediği `ProductAttributeValue.id`) bağlıdır — `(definitionId,
 * valueId)` çiftine veya listedeki index'e ASLA bağlanmaz: D020 gereği aynı
 * tanım için birden fazla satır olabilir (ör. bir ürün hem "Zirkon" hem
 * "İnci" taşıyabilir), çift/index üzerinden silmek yanlış satırı silebilir.
 */
function ProductDescriptiveAttributesSection({
  productId,
  descriptiveAttributes,
  attributeDefinitions,
  addAction,
  removeAction,
}: {
  productId: string
  descriptiveAttributes: DescriptiveAttribute[]
  attributeDefinitions: AttributeDefinition[]
  addAction: (input: unknown) => Promise<AdminActionFailure | undefined>
  removeAction: (productAttributeValueId: string, productId: string) => Promise<AdminActionFailure | undefined>
}) {
  const [removeTarget, setRemoveTarget] = useState<DescriptiveAttribute | null>(null)
  const [removeError, setRemoveError] = useState<string | null>(null)
  const [isRemoving, startRemoveTransition] = useTransition()

  function handleRemove() {
    if (!removeTarget) return
    setRemoveError(null)
    startRemoveTransition(async () => {
      const result = await removeAction(removeTarget.id, productId)
      if (result && !result.success) setRemoveError(result.error.message)
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {removeError && <p className="text-sm text-destructive">{removeError}</p>}

      {descriptiveAttributes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Henüz açıklayıcı öznitelik eklenmedi.</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {descriptiveAttributes.map((attribute) => (
            <li
              key={attribute.id}
              className="flex items-center gap-1.5 rounded-full border border-border py-1 pr-1 pl-3 text-sm text-foreground"
            >
              <span>
                {attribute.label}: {attribute.value}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`${attribute.label}: ${attribute.value} özniteliğini kaldır`}
                disabled={isRemoving}
                onClick={() => setRemoveTarget(attribute)}
              >
                <X className="size-3" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <AddDescriptiveAttributeForm productId={productId} attributeDefinitions={attributeDefinitions} action={addAction} />

      <ConfirmDialog
        open={removeTarget !== null}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        title="Açıklayıcı özniteliği kaldır"
        description={
          removeTarget ? `"${removeTarget.label}: ${removeTarget.value}" bu üründen kaldırılacak.` : undefined
        }
        confirmLabel="Kaldır"
        destructive
        onConfirm={handleRemove}
      />
    </div>
  )
}

function AddDescriptiveAttributeForm({
  productId,
  attributeDefinitions,
  action,
}: {
  productId: string
  attributeDefinitions: AttributeDefinition[]
  action: (input: unknown) => Promise<AdminActionFailure | undefined>
}) {
  const [attributeDefinitionId, setAttributeDefinitionId] = useState("")
  const [attributeValueId, setAttributeValueId] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const selectedDefinition = attributeDefinitions.find((def) => def.id === attributeDefinitionId)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const parsed = createDescriptiveAttributeSchema.safeParse({ productId, attributeDefinitionId, attributeValueId })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Geçersiz girdi.")
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await action(parsed.data)
      if (result && !result.success) {
        setError(result.error.message)
        return
      }
      setAttributeDefinitionId("")
      setAttributeValueId("")
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-wrap items-end gap-3">
      <FormField label="Öznitelik Tipi" className="w-48">
        {(props) => (
          <AdminSelect
            {...props}
            value={attributeDefinitionId}
            onValueChange={(value) => {
              setAttributeDefinitionId(value)
              setAttributeValueId("")
            }}
            items={attributeDefinitions.map((def) => ({ value: def.id, label: def.label }))}
          />
        )}
      </FormField>
      <FormField label="Değer" className="w-48">
        {(props) => (
          <AdminSelect
            {...props}
            value={attributeValueId}
            onValueChange={setAttributeValueId}
            items={(selectedDefinition?.values ?? []).map((v) => ({ value: v.id, label: v.value }))}
            disabled={!selectedDefinition}
          />
        )}
      </FormField>
      <Button type="submit" disabled={isPending} className="min-h-11">
        {isPending ? "Ekleniyor…" : "Öznitelik Ekle"}
      </Button>
      {error && <p className="w-full text-sm text-destructive">{error}</p>}
    </form>
  )
}

export { ProductDescriptiveAttributesSection }
