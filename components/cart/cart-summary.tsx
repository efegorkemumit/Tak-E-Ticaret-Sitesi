import { formatPriceTRY } from "@/lib/format"

/**
 * `docs/COMPONENT_INVENTORY.md` #6 — çerçevesiz, `Card` içine alınmaz.
 * `subtotal` yalnızca bir ÖNİZLEMEDİR (`docs/ARCHITECTURE.md` §4.1) — nihai
 * tutar checkout sonucunda sunucudan gelir, burada bunu açıkça belirtiyoruz.
 */
function CartSummary({ subtotal, itemCount }: { subtotal: number; itemCount: number }) {
  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Ara toplam ({itemCount} ürün)</span>
        <span className="text-foreground">{formatPriceTRY(subtotal)}</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Kargo ücreti ve nihai toplam ödeme adımında hesaplanır.
      </p>
    </div>
  )
}

export { CartSummary }
