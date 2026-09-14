import Link from "next/link"
import { Layers } from "lucide-react"
import { cn } from "cn"
import { listCollectionsForAdmin } from "@/lib/admin"
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

export const dynamic = "force-dynamic"

/** D023 çoktan-çoğa — bir ürün birden fazla koleksiyonda olabilir. Silme YOK, yalnızca listele/oluştur/düzenle. */
export default async function AdminCollectionsPage() {
  const collections = await listCollectionsForAdmin()

  return (
    <div>
      <AdminPageHeader
        title="Koleksiyonlar"
        description="Ürünlerin çoklu olarak bağlanabildiği tematik gruplar."
        action={
          <Link href="/admin/collections/new" className={cn(buttonVariants(), "min-h-11")}>
            Yeni Koleksiyon
          </Link>
        }
      />

      <DataTable>
        <DataTableHead>
          <DataTableRow>
            <DataTableHeadCell>Ad</DataTableHeadCell>
            <DataTableHeadCell>Slug</DataTableHeadCell>
            <DataTableHeadCell>Ürün Sayısı</DataTableHeadCell>
            <DataTableHeadCell />
          </DataTableRow>
        </DataTableHead>
        <DataTableBody>
          {collections.length === 0 ? (
            <tr>
              <td colSpan={4}>
                <EmptyState
                  icon={<Layers className="size-8" />}
                  title="Henüz koleksiyon yok"
                  description="İlk koleksiyonu oluşturarak ürünleri gruplandırmaya başlayabilirsiniz."
                  className="py-10"
                />
              </td>
            </tr>
          ) : (
            collections.map((collection) => (
              <DataTableRow key={collection.id}>
                <DataTableCell>{collection.name}</DataTableCell>
                <DataTableCell className="text-muted-foreground">{collection.slug}</DataTableCell>
                <DataTableCell>{collection.productCount}</DataTableCell>
                <DataTableCell className="text-right">
                  <Link
                    href={`/admin/collections/${collection.id}`}
                    className="text-sm underline-offset-4 hover:underline"
                  >
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
