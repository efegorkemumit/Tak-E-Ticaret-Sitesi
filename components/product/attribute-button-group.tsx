"use client"

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

/**
 * `docs/COMPONENT_INVENTORY.md` #4 — renk swatch YOK, düz metin buton.
 * Gerçek etkileşim (seçim state'i) burada olduğu için client component.
 * Stokta olmayan bir değer, seçilebilir ama devre dışı (tıklanamaz, görsel
 * olarak soluk) gösterilir — tamamen gizlenmez, müşteri o kombinasyonun
 * var olduğunu ama şu an alınamayacağını görür.
 *
 * `label`, `AttributeDefinition.label`'dan (`lib/commerce/catalog.ts` →
 * `CatalogAttributeDto.label`) doğrudan gelir — sabit bir Türkçe çeviri
 * tablosuna ihtiyaç kalmadı (`type` artık serbest bir `string`, OPEN #4).
 */
function AttributeButtonGroup({
  type,
  label,
  options,
  value,
  onValueChange,
  disabledOptions,
}: {
  type: string
  label: string
  options: string[]
  value: string | undefined
  onValueChange: (value: string) => void
  disabledOptions?: string[]
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <RadioGroup
        value={value}
        onValueChange={(next) => onValueChange(String(next))}
        aria-label={label}
        name={type}
      >
        {options.map((option) => (
          <RadioGroupItem
            key={option}
            value={option}
            disabled={disabledOptions?.includes(option)}
          >
            {option}
          </RadioGroupItem>
        ))}
      </RadioGroup>
    </div>
  )
}

export { AttributeButtonGroup }
