import type { ReactNode } from "react"
import { cn } from "cn"

/**
 * Boş/hata durumları için düşük karmaşıklıklı, özel bir presentational
 * component (bkz. `docs/COMPONENT_INVENTORY.md` #15). Sipariş sorgulama gibi
 * güvenlik açısından hassas kullanımlarda `description` metninin JENERİK
 * kalması gerektiğini unutmayın (hangi alanın hatalı olduğunu belirtmemeli) —
 * bu kısıt burada zorlanmaz, tüketen component'in sorumluluğundadır.
 */
function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 px-6 py-16 text-center",
        className
      )}
    >
      {icon && <div className="text-muted-foreground">{icon}</div>}
      <p className="font-display text-xl text-foreground">{title}</p>
      {description && (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

export { EmptyState }
