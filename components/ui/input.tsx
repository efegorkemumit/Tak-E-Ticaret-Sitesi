import { cn } from "cn"

/**
 * `docs/COMPONENT_INVENTORY.md` #9 — 44px min dokunma hedefi (`h-11`), net
 * hata durumu (`aria-invalid` ile kırmızı halka). Native `<input>` üzerine
 * kurulu, ekstra bir primitive kütüphanesi gerekmiyor.
 */
function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      data-slot="input"
      className={cn(
        "flex h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors",
        "placeholder:text-muted-foreground",
        "focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring",
        "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
