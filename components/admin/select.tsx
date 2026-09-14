"use client"

import { Select as SelectPrimitive } from "@base-ui/react/select"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "cn"

/**
 * Admin'e özgü Select primitive'i — `components/ui/*` YALNIZCA okuma amaçlıydı
 * (dosya sahipliği sınırı, bkz. `confirm-dialog.tsx`'teki aynı gerekçe), bu
 * yüzden kategori/koleksiyon/öznitelik/durum seçimi gibi tekrarlayan admin
 * formu ihtiyaçları için `@base-ui/react/select` burada doğrudan kuruldu.
 *
 * `FormField`'ın (`components/ui/form-field.tsx`) `children` render-prop
 * imzasıyla (id/aria-describedby/aria-invalid) uyumlu, `Input`'la aynı
 * `h-11` dokunma hedefi ve hata stiliyle.
 */
function AdminSelect<Value extends string>({
  id,
  items,
  value,
  onValueChange,
  placeholder = "Seçin",
  disabled,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedby,
  className,
}: {
  id?: string
  items: { value: Value; label: string }[]
  value: Value | ""
  onValueChange: (value: Value) => void
  placeholder?: string
  disabled?: boolean
  "aria-invalid"?: boolean
  "aria-describedby"?: string
  className?: string
}) {
  return (
    <SelectPrimitive.Root
      items={items}
      value={value === "" ? null : value}
      onValueChange={(next) => {
        if (next !== null) onValueChange(next as Value)
      }}
      disabled={disabled}
    >
      <SelectPrimitive.Trigger
        id={id}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedby}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-2 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors",
          "hover:bg-surface-muted",
          "focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring",
          "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon className="text-muted-foreground">
          <ChevronDown className="size-4" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner className="z-50 outline-none" sideOffset={4}>
          <SelectPrimitive.Popup className="max-h-64 min-w-[var(--anchor-width)] overflow-auto rounded-md border border-border bg-background p-1 shadow-xl outline-none">
            <SelectPrimitive.List>
              {items.map((item) => (
                <SelectPrimitive.Item
                  key={item.value}
                  value={item.value}
                  className={cn(
                    "flex min-h-9 cursor-pointer items-center justify-between gap-2 rounded-sm px-2.5 text-sm text-foreground outline-none select-none",
                    "data-[highlighted]:bg-surface-muted"
                  )}
                >
                  <SelectPrimitive.ItemText>{item.label}</SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator>
                    <Check className="size-4" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.List>
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}

export { AdminSelect }
