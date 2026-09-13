import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group"
import { Radio as RadioPrimitive } from "@base-ui/react/radio"
import { cn } from "cn"

/**
 * Genel amaçlı, stilsiz-yakın bir RadioGroup primitive'i (shadcn/ui pattern'iyle
 * tutarlı). Tekli seçim gerektiren her yerde (ör. varyant/öznitelik seçimi,
 * ödeme yöntemi seçimi) kullanılabilir — görsel stil tüketen component'e aittir,
 * burada yalnızca layout/erişilebilirlik iskeleti verilir.
 */
function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive>) {
  return (
    <RadioGroupPrimitive
      data-slot="radio-group"
      className={cn("flex flex-wrap gap-2", className)}
      {...props}
    />
  )
}

function RadioGroupItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof RadioPrimitive.Root>) {
  return (
    <RadioPrimitive.Root
      data-slot="radio-group-item"
      className={cn(
        // min-h-11 (44px): "Açık Alan" MOBILE APPROACH'ın (docs/DESIGN_DIRECTION.md)
        // öznitelik seçenekleri için istediği asgari dokunma hedefi yüksekliği.
        "flex min-h-11 cursor-pointer select-none items-center justify-center rounded-full border border-border px-4 text-sm text-foreground transition-colors",
        "hover:border-foreground/40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "data-[checked]:border-foreground data-[checked]:bg-foreground data-[checked]:text-background",
        "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40 data-[disabled]:hover:border-border",
        className
      )}
      {...props}
    >
      {children}
    </RadioPrimitive.Root>
  )
}

export { RadioGroup, RadioGroupItem }
