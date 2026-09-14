import type { ReactNode } from "react"
import { cn } from "cn"

/**
 * Veri tablosu kabuğu (COMPONENT_INVENTORY'nin admin karşılığı) — Wave B'nin
 * her liste ekranında (Ürünler/Kategoriler/Siparişler vb.) yeniden
 * kullanacağı, sade/yoğun stillendirilmiş `<table>` primitive'leri. Sıralama/
 * sayfalama MANTIĞI içermez — yalnızca yapı ve görünüm.
 */
function DataTable({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto rounded-md border border-border", className)}>
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  )
}

function DataTableHead({ children }: { children: ReactNode }) {
  return <thead className="bg-surface-muted text-left text-xs text-muted-foreground">{children}</thead>
}

function DataTableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-border">{children}</tbody>
}

function DataTableRow({ children }: { children: ReactNode }) {
  return <tr className="hover:bg-surface-muted/60">{children}</tr>
}

function DataTableHeadCell({ children, className }: { children?: ReactNode; className?: string }) {
  return <th className={cn("px-4 py-2.5 font-medium", className)}>{children}</th>
}

function DataTableCell({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={cn("px-4 py-2.5 text-foreground", className)}>{children}</td>
}

export { DataTable, DataTableHead, DataTableBody, DataTableRow, DataTableHeadCell, DataTableCell }
