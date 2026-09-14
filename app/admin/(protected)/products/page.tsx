import Link from "next/link"
import { Gem } from "lucide-react"
import { cn } from "cn"
import { listProductsForAdmin } from "@/lib/admin"
import { AdminPageHeader } from "@/components/admin/page-header"
import {
  DataTable,
  DataTableHead,
  DataTableBody,
  DataTableRow,
  DataTableHeadCell,
  DataTableCell,
} from "@/components/admin/data-table"
import { EmptyState } from "@/components/ui/empty-state"
import { buttonVariants } from "@/components/ui/button"
import { getProductStatusLabel } from "@/components/admin/status-labels"
import { formatAdminDate } from "@/components/admin/format"

export const dynamic = "force-dynamic"

/** Admin listesi TÜM durumları (DRAFT/PUBLISHED/ARCHIVED) gösterir — D021'in storefront görünürlük filtresi burada UYGULANMAZ. */
export default async function AdminProductsPage() {
  const products = await listProductsForAdmin()

  return (
    <div>
      <AdminPageHeader
        title="Ürünler"
        description="Tüm durumlardaki (taslak/yayında/arşivlenmiş) ürünler."
        action={
          <Link href="/admin/products/new" className={cn(buttonVariants(), "min-h-11")}>
            Yeni Ürün
          </Link>
        }
      />

      <DataTable>
        <DataTableHead>
          <DataTableRow>
            <DataTableHeadCell>Ad</DataTableHeadCell>
            <DataTableHeadCell>Kategori</DataTableHeadCell>
            <DataTableHeadCell>Durum</DataTableHeadCell>
            <DataTableHeadCell>Varyant Sayısı</DataTableHeadCell>
            <DataTableHeadCell>Oluşturulma</DataTableHeadCell>
            <DataTableHeadCell />
          </DataTableRow>
        </DataTableHead>
        <DataTableBody>
          {products.length === 0 ? (
            <tr>
              <td colSpan={6}>
                <EmptyState
                  icon={<Gem className="size-8" />}
                  title="Henüz ürün yok"
                  description="İlk ürününüzü oluşturarak kataloğu başlatabilirsiniz."
                  className="py-10"
                />
              </td>
            </tr>
          ) : (
            products.map((product) => (
              <DataTableRow key={product.id}>
                <DataTableCell>{product.name}</DataTableCell>
                <DataTableCell className="text-muted-foreground">{product.categoryName}</DataTableCell>
                <DataTableCell>{getProductStatusLabel(product.status)}</DataTableCell>
                <DataTableCell>{product.variantCount}</DataTableCell>
                <DataTableCell className="text-muted-foreground">{formatAdminDate(product.createdAt)}</DataTableCell>
                <DataTableCell className="text-right">
                  <Link href={`/admin/products/${product.id}`} className="text-sm underline-offset-4 hover:underline">
                    Düzenle
                  </Link>
                </DataTableCell>
              </DataTableRow>
            ))
          )}
        </DataTableBody>
      </DataTable>
    </div>
  )
}
