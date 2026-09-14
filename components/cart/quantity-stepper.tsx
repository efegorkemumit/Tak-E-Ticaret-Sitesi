"use client"

import { Minus, Plus } from "lucide-react"
import { cn } from "cn"

/**
 * `docs/COMPONENT_INVENTORY.md` #5 — sepette ve ürün detayında adet seçimi.
 * Sade, minimal ikon; shadcn `Button` ikon varyantı yerine burada doğrudan
 * küçük, kendi stilini taşıyan bir kompozisyon (Açık Alan'ın çerçevesiz/sade
 * ilkesiyle tutarlı). Minimum 1 — 1'in altına inilemez (satır silme ayrı bir
 * eylemdir, adet azaltarak silme YAPILMAZ).
 */
function QuantityStepper({
  quantity,
  onChange,
  max,
  disabled,
}: {
  quantity: number
  onChange: (next: number) => void
  max?: number
  disabled?: boolean
}) {
  const canDecrement = !disabled && quantity > 1
  const canIncrement = !disabled && (max === undefined || quantity < max)

  return (
    <div className="inline-flex items-center gap-1">
      <button
        type="button"
        aria-label="Adedi azalt"
        disabled={!canDecrement}
        onClick={() => onChange(quantity - 1)}
        className={cn(
          // size-11 (44px): asgari dokunma hedefi.
          "inline-flex size-11 items-center justify-center rounded-md border border-border text-foreground transition-colors",
          "hover:border-foreground/40",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border"
        )}
      >
        <Minus className="size-3.5" />
      </button>
      <span className="w-8 text-center text-sm tabular-nums text-foreground" aria-live="polite">
        {quantity}
      </span>
      <button
        type="button"
        aria-label="Adedi artır"
        disabled={!canIncrement}
        onClick={() => onChange(quantity + 1)}
        className={cn(
          // size-11 (44px): asgari dokunma hedefi.
          "inline-flex size-11 items-center justify-center rounded-md border border-border text-foreground transition-colors",
          "hover:border-foreground/40",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border"
        )}
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  )
}

export { QuantityStepper }
