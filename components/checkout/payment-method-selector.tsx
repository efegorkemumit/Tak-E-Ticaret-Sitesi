"use client"

import { RadioGroup } from "@base-ui/react/radio-group"
import { Radio } from "@base-ui/react/radio"
import { cn } from "cn"
import { PaymentMethod } from "@/lib/generated/prisma/enums"

/**
 * `docs/COMPONENT_INVENTORY.md` #11 — jenerik radio/kart, Shopier'e özgü
 * hiçbir görünüm/davranış YOK (D009/D010). Ödeme yöntemi seçimi #4
 * (AttributeButtonGroup) ile aynı `ui/radio-group.tsx` pill stilini
 * kullanmak yerine daha büyük, satır/kart görünümlü seçenekler kullanır
 * (checkout'ta daha ciddi bir karar olduğu için görsel olarak ayrışır) —
 * bu yüzden `@base-ui/react`'in ham `RadioGroup`/`Radio` primitive'leri
 * doğrudan burada stillendirilir.
 */
const OPTIONS: { value: (typeof PaymentMethod)[keyof typeof PaymentMethod]; label: string; description: string }[] = [
  {
    value: PaymentMethod.BANK_TRANSFER,
    label: "Havale / EFT",
    description: "Sipariş sonrası gösterilecek hesap bilgilerine ödeme yapabilirsiniz.",
  },
  {
    value: PaymentMethod.SHOPIER,
    label: "Shopier",
    description: "Shopier üzerinden güvenli ödeme.",
  },
]

function PaymentMethodSelector({
  value,
  onValueChange,
}: {
  value: string
  onValueChange: (value: string) => void
}) {
  return (
    <RadioGroup
      value={value}
      onValueChange={(next) => onValueChange(String(next))}
      aria-label="Ödeme yöntemi"
      className="flex flex-col gap-2"
    >
      {OPTIONS.map((option) => (
        <Radio.Root
          key={option.value}
          value={option.value}
          className={cn(
            "flex min-h-11 cursor-pointer flex-col gap-0.5 rounded-md border border-border px-4 py-3 text-left transition-colors",
            "hover:border-foreground/40",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "data-[checked]:border-foreground"
          )}
        >
          <span className="text-sm font-medium text-foreground">{option.label}</span>
          <span className="text-xs text-muted-foreground">{option.description}</span>
        </Radio.Root>
      ))}
    </RadioGroup>
  )
}

export { PaymentMethodSelector }
