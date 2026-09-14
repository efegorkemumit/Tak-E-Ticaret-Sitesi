import { cn } from "cn"

/**
 * Admin'e özgü Textarea — `Input`'un (`components/ui/input.tsx`) çok
 * satırlı karşılığı, aynı dosya sahipliği gerekçesiyle burada. Ürün
 * açıklaması/bakım bilgisi gibi uzun metin alanları için.
 */
function AdminTextarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors",
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

export { AdminTextarea }
