"use client"

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { Check } from "lucide-react"
import { cn } from "cn"

/**
 * Admin'e özgü Checkbox primitive'i — aynı gerekçe (`select.tsx`/
 * `confirm-dialog.tsx`): `components/ui/*` bu tur için salt okunur.
 * Koleksiyon çoklu seçimi ve "Hediye paketleme mevcut" gibi tekil
 * boolean alanlar için kullanılır. 44px dokunma hedefi (`size-11` sarmalayıcı
 * `<label>`) — checkbox'ın kendisi küçük ama tıklanabilir alanı geniş.
 */
function AdminCheckbox({
  id,
  checked,
  onCheckedChange,
  label,
  disabled,
}: {
  id?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label: string
  disabled?: boolean
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex min-h-11 w-fit cursor-pointer items-center gap-2.5 text-sm text-foreground select-none",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <CheckboxPrimitive.Root
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-[0.25rem] border border-border bg-background outline-none transition-colors",
          "hover:border-foreground/40",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "data-[checked]:border-foreground data-[checked]:bg-foreground data-[checked]:text-background"
        )}
      >
        <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
          <Check className="size-3.5" />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {label}
    </label>
  )
}

export { AdminCheckbox }
