"use client"

import { useState, useTransition } from "react"
import { createVariantSchema, updateVariantSchema, updateVariantStockSchema } from "@/lib/admin/schemas"
import { formatPriceTRY } from "@/lib/format"
import { Input } from "@/components/ui/input"
import { FormField } from "@/components/ui/form-field"
import { Button } from "@/components/ui/button"
import { AdminSelect } from "@/components/admin/select"
import {
  DataTable,
  DataTableHead,
  DataTableBody,
  DataTableRow,
  DataTableHeadCell,
  DataTableCell,
} from "@/components/admin/data-table"
import type { AdminActionFailure, suggestVariantSkuAction } from "@/app/admin/(protected)/products/actions"

interface AttributeSelection {
  attributeDefinitionId: string
  type: string
  label: string
  attributeValueId: string
  value: string
}

interface VariantDto {
  id: string
  sku: string
  price: string
  stockQuantity: number
  reservedQuantity: number
  availableQuantity: number
  attributes: AttributeSelection[]
}

interface AttributeDefinition {
  id: string
  key: string
  label: string
  values: { id: string; value: string }[]
}

/**
 * D019/D020/D027 — SKU/fiyat/stok yalnızca Variant seviyesinde; öznitelik
 * seçimi (`selectableAttributes`) her tip için TEK değer. Bir varyant
 * oluşturulduktan sonra öznitelik seçimi/stok bu ekrandan DEĞİL, ayrı
 * formlardan (SKU/fiyat `updateVariant`, stok `updateVariantStock`)
 * değiştirilir — `lib/admin/variants.ts`'in kendisi de bu ayrımı yapıyor.
 * Varyant SİLME YOK (D029 + burada zaten hiç sunulmayan bir fonksiyon).
 */
function ProductVariantsSection({
  productId,
  variants,
  attributeDefinitions,
  createVariantAction,
  updateVariantAction,
  updateVariantStockAction,
  suggestSkuAction,
}: {
  productId: string
  variants: VariantDto[]
  attributeDefinitions: AttributeDefinition[]
  createVariantAction: (input: unknown) => Promise<AdminActionFailure | undefined>
  updateVariantAction: (input: unknown, productId: string) => Promise<AdminActionFailure | undefined>
  updateVariantStockAction: (input: unknown, productId: string) => Promise<AdminActionFailure | undefined>
  suggestSkuAction: typeof suggestVariantSkuAction
}) {
  return (
    <div className="flex flex-col gap-4">
      {variants.length > 0 && (
        <DataTable>
          <DataTableHead>
            <DataTableRow>
              <DataTableHeadCell className="w-px whitespace-nowrap">SKU</DataTableHeadCell>
              <DataTableHeadCell>Öznitelikler</DataTableHeadCell>
              <DataTableHeadCell className="w-px whitespace-nowrap text-right">Fiyat</DataTableHeadCell>
              <DataTableHeadCell className="w-px whitespace-nowrap">Fiziksel Stok</DataTableHeadCell>
              <DataTableHeadCell className="w-px whitespace-nowrap text-right">Rezerve</DataTableHeadCell>
              <DataTableHeadCell className="w-px whitespace-nowrap text-right">Kullanılabilir</DataTableHeadCell>
              <DataTableHeadCell className="w-px whitespace-nowrap">İşlem</DataTableHeadCell>
            </DataTableRow>
          </DataTableHead>
          <DataTableBody>
            {variants.map((variant) => (
              <VariantRow
                key={variant.id}
                productId={productId}
                variant={variant}
                updateVariantAction={updateVariantAction}
                updateVariantStockAction={updateVariantStockAction}
              />
            ))}
          </DataTableBody>
        </DataTable>
      )}

      <div className="rounded-md border border-border p-4">
        <h3 className="mb-3 text-sm font-medium text-foreground">Yeni Varyant Ekle</h3>
        <NewVariantForm
          productId={productId}
          attributeDefinitions={attributeDefinitions}
          action={createVariantAction}
          suggestSkuAction={suggestSkuAction}
        />
      </div>
    </div>
  )
}

function VariantRow({
  productId,
  variant,
  updateVariantAction,
  updateVariantStockAction,
}: {
  productId: string
  variant: VariantDto
  updateVariantAction: (input: unknown, productId: string) => Promise<AdminActionFailure | undefined>
  updateVariantStockAction: (input: unknown, productId: string) => Promise<AdminActionFailure | undefined>
}) {
  const [isEditingBasics, setIsEditingBasics] = useState(false)
  const [sku, setSku] = useState(variant.sku)
  const [price, setPrice] = useState(variant.price)
  const [basicsError, setBasicsError] = useState<string | null>(null)
  const [isBasicsPending, startBasicsTransition] = useTransition()

  const [stockQuantity, setStockQuantity] = useState(String(variant.stockQuantity))
  const [stockError, setStockError] = useState<string | null>(null)
  const [isStockPending, startStockTransition] = useTransition()

  function handleSaveBasics() {
    // `productId` route parametresinden gelen prop'tur (client girdisi/varsayımı DEĞİL) —
    // IDOR düzeltmesi (security bulgusu C-2) sunucuda `id`+`productId` eşleşmesini zaten
    // yeniden doğruluyor, bu yalnızca doğru kaynağı iletiyor.
    const parsed = updateVariantSchema.safeParse({ id: variant.id, productId, sku, price })
    if (!parsed.success) {
      setBasicsError(parsed.error.issues[0]?.message ?? "Geçersiz girdi.")
      return
    }
    setBasicsError(null)
    startBasicsTransition(async () => {
      const result = await updateVariantAction(parsed.data, productId)
      if (result && !result.success) {
        setBasicsError(result.error.message)
        return
      }
      setIsEditingBasics(false)
    })
  }

  function handleSaveStock() {
    const parsedQuantity = Number(stockQuantity)
    const parsed = updateVariantStockSchema.safeParse({ variantId: variant.id, productId, stockQuantity: parsedQuantity })
    if (!parsed.success) {
      setStockError(parsed.error.issues[0]?.message ?? "Geçersiz girdi.")
      return
    }
    setStockError(null)
    startStockTransition(async () => {
      const result = await updateVariantStockAction(parsed.data, productId)
      if (result && !result.success) setStockError(result.error.message)
    })
  }

  return (
    <DataTableRow>
      {/* DÜZELTME (final inceleme) — `whitespace-nowrap` eksikti, gerçekçi
          uzunlukta bir SKU (`DEMO-ARCHIVED-001`) üç satıra bölünüyor, boş
          "Öznitelikler" sütunu da bu yüzden gereksiz geniş kalıyordu. */}
      <DataTableCell className="whitespace-nowrap font-medium">
        {isEditingBasics ? (
          <div className="flex flex-col gap-1">
            <Input value={sku} onChange={(e) => setSku(e.target.value)} aria-label="SKU" className="h-9 w-40" />
          </div>
        ) : (
          variant.sku
        )}
      </DataTableCell>
      <DataTableCell className="text-muted-foreground">
        {variant.attributes.length === 0
          ? "—"
          : variant.attributes.map((a) => `${a.label}: ${a.value}`).join(", ")}
      </DataTableCell>
      <DataTableCell className="text-right">
        {isEditingBasics ? (
          <Input value={price} onChange={(e) => setPrice(e.target.value)} aria-label="Fiyat" className="h-9 w-28" />
        ) : (
          <span className="font-medium tabular-nums">{formatPriceTRY(Number(variant.price))}</span>
        )}
      </DataTableCell>
      <DataTableCell>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSaveStock()
          }}
          className="flex items-center gap-1.5"
        >
          <Input
            type="number"
            min={0}
            value={stockQuantity}
            onChange={(e) => setStockQuantity(e.target.value)}
            aria-label={`${variant.sku} fiziksel stok`}
            className="h-9 w-20"
          />
          <Button type="submit" variant="outline" size="sm" disabled={isStockPending} className="h-9">
            Güncelle
          </Button>
        </form>
        {stockError && <p className="mt-1 text-xs text-destructive">{stockError}</p>}
      </DataTableCell>
      <DataTableCell className="text-right tabular-nums text-muted-foreground">{variant.reservedQuantity}</DataTableCell>
      <DataTableCell className="text-right font-medium tabular-nums">{variant.availableQuantity}</DataTableCell>
      <DataTableCell>
        {isEditingBasics ? (
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" disabled={isBasicsPending} onClick={handleSaveBasics} className="h-9">
              Kaydet
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() => {
                setIsEditingBasics(false)
                setSku(variant.sku)
                setPrice(variant.price)
                setBasicsError(null)
              }}
            >
              Vazgeç
            </Button>
          </div>
        ) : (
          <Button type="button" variant="ghost" size="sm" className="h-9 whitespace-nowrap" onClick={() => setIsEditingBasics(true)}>
            SKU/fiyat düzenle
          </Button>
        )}
        {basicsError && <p className="mt-1 text-xs text-destructive">{basicsError}</p>}
      </DataTableCell>
    </DataTableRow>
  )
}

function NewVariantForm({
  productId,
  attributeDefinitions,
  action,
  suggestSkuAction,
}: {
  productId: string
  attributeDefinitions: AttributeDefinition[]
  action: (input: unknown) => Promise<AdminActionFailure | undefined>
  suggestSkuAction: typeof suggestVariantSkuAction
}) {
  const [sku, setSku] = useState("")
  const [price, setPrice] = useState("")
  const [stockQuantity, setStockQuantity] = useState("0")
  const [selections, setSelections] = useState<Record<string, string>>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isSuggesting, startSuggestTransition] = useTransition()

  function handleSuggestSku() {
    startSuggestTransition(async () => {
      const suggestion = await suggestSkuAction(productId)
      if (suggestion) setSku(suggestion)
    })
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    const selectableAttributes = attributeDefinitions
      .filter((def) => selections[def.id])
      .map((def) => ({ attributeDefinitionId: def.id, attributeValueId: selections[def.id] }))

    const payload = { productId, sku, price, stockQuantity: Number(stockQuantity), selectableAttributes }
    const parsed = createVariantSchema.safeParse(payload)
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
      setSku("")
      setPrice("")
      setStockQuantity("0")
      setSelections({})
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label="SKU" error={fieldErrors.sku}>
          {(props) => (
            <div className="flex gap-1.5">
              <Input {...props} value={sku} onChange={(e) => setSku(e.target.value)} />
              <Button type="button" variant="outline" disabled={isSuggesting} onClick={handleSuggestSku} className="min-h-11 shrink-0">
                Öner
              </Button>
            </div>
          )}
        </FormField>
        <FormField label="Fiyat (TRY)" error={fieldErrors.price}>
          {(props) => <Input {...props} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="450.00" />}
        </FormField>
        <FormField label="Fiziksel Stok" error={fieldErrors.stockQuantity}>
          {(props) => (
            <Input {...props} type="number" min={0} value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} />
          )}
        </FormField>
      </div>

      {attributeDefinitions.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          {attributeDefinitions.map((def) => (
            <FormField key={def.id} label={`${def.label} (opsiyonel)`}>
              {(props) => (
                <AdminSelect
                  {...props}
                  value={selections[def.id] ?? ""}
                  onValueChange={(value) => setSelections((current) => ({ ...current, [def.id]: value }))}
                  placeholder="Seçilmedi"
                  items={def.values.map((v) => ({ value: v.id, label: v.value }))}
                  disabled={def.values.length === 0}
                />
              )}
            </FormField>
          ))}
        </div>
      )}

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <Button type="submit" disabled={isPending} className="min-h-11 w-fit">
        {isPending ? "Ekleniyor…" : "Varyant Ekle"}
      </Button>
    </form>
  )
}

export { ProductVariantsSection }
