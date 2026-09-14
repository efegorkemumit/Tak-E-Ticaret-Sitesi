import Link from "next/link"
import { Layers } from "lucide-react"
import { cn } from "cn"
import { listCollectionsForAdmin } from "@/lib/admin"
import { AdminPageHeader } from "@/components/admin/page-header"
import {
  DataTable,
  DataTableHead,
  DataTableBody,
  DataTableClickableRow,
  DataTableHeadCell,
  DataTableCell,
} from "@/components/admin/data-table"
import { AdminMobileRecordCard } from "@/components/admin/mobile-record-card"
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

      {collections.length === 0 ? (
        <DataTable>
          <DataTableBody>
            <tr>
              <td>
                <EmptyState
                  icon={<Layers className="size-8" />}
                  title="Henüz koleksiyon yok"
                  description="İlk koleksiyonu oluşturarak ürünleri gruplandırmaya başlayabilirsiniz."
                  className="py-10"
                />
              </td>
            </tr>
          </DataTableBody>
        </DataTable>
      ) : (
        <>
          <DataTable className="hidden lg:block">
            <DataTableHead>
              <tr>
                <DataTableHeadCell>Ad</DataTableHeadCell>
                <DataTableHeadCell className="w-px whitespace-nowrap">Slug</DataTableHeadCell>
                <DataTableHeadCell className="w-px whitespace-nowrap text-right">Ürün Sayısı</DataTableHeadCell>
                <DataTableHeadCell />
              </tr>
            </DataTableHead>
            <DataTableBody>
              {collections.map((collection) => (
                <DataTableClickableRow key={collection.id} href={`/admin/collections/${collection.id}`}>
                  <DataTableCell className="font-medium">{collection.name}</DataTableCell>
                  <DataTableCell className="whitespace-nowrap text-muted-foreground">{collection.slug}</DataTableCell>
                  <DataTableCell className="text-right tabular-nums">{collection.productCount}</DataTableCell>
                </DataTableClickableRow>
              ))}
            </DataTableBody>
          </DataTable>

          <div className="flex flex-col gap-2 lg:hidden">
            {collections.map((collection) => (
              <AdminMobileRecordCard
                key={collection.id}
                href={`/admin/collections/${collection.id}`}
                title={collection.name}
                meta={collection.slug}
                value={`${collection.productCount} ürün`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
