import { useId } from "react"
import { cn } from "cn"

/**
 * `docs/COMPONENT_INVENTORY.md` #9 — label doğru `htmlFor`/`id` ile
 * ilişkilendirilir, hata mesajı `aria-describedby` ile alanla bağlanır
 * (erişilebilirlik gereksinimi #11).
 */
function FormField({
  label,
  error,
  className,
  children,
}: {
  label: string
  error?: string
  className?: string
  children: (props: { id: string; "aria-describedby"?: string; "aria-invalid"?: boolean }) => React.ReactNode
}) {
  const id = useId()
  const errorId = `${id}-error`

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm text-foreground">
        {label}
      </label>
      {children({
        id,
        "aria-describedby": error ? errorId : undefined,
        "aria-invalid": Boolean(error),
      })}
      {error && (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

export { FormField }
