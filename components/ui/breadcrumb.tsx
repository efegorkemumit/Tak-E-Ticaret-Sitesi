import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { cn } from "cn"

/**
 * "Açık Alan" yönü gereği minimal/dekoratif olmayan bir konum göstergesi
 * (bkz. `docs/COMPONENT_INVENTORY.md` #8). shadcn'e özgü bir Base UI
 * primitive'i yoktur — saf semantik `nav`/`ol` işaretlemesidir.
 */
export interface BreadcrumbItem {
  label: string
  href?: string
}

function Breadcrumb({
  items,
  className,
}: {
  items: BreadcrumbItem[]
  className?: string
}) {
  return (
    <nav aria-label="Sayfa içi konum" className={cn("text-sm text-muted-foreground", className)}>
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? "page" : undefined} className="text-foreground">
                  {item.label}
                </span>
              )}
              {!isLast && <ChevronRight className="size-3.5" aria-hidden="true" />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export { Breadcrumb }
