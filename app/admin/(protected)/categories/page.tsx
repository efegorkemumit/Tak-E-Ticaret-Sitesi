import Link from "next/link"
import { Tag } from "lucide-react"
import { listCategoriesForAdmin } from "@/lib/admin"
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
import { cn } from "cn"

export const dynamic = "force-dynamic"

/** Silme YOK (D029 + FK kısıtı, bkz. `lib/admin/categories.ts`) — yalnızca listele/oluştur/düzenle. */
export default async function AdminCategoriesPage() {
  const categories = await listCategoriesForAdmin()

  return (
    <div>
      <AdminPageHeader
        title="Kategoriler"
        description="Ürünlerin bağlı olduğu tekil kategori ağacı (bir ürün — bir kategori)."
        action={
          <Link href="/admin/categories/new" className={cn(buttonVariants(), "min-h-11")}>
            Yeni Kategori
          </Link>
        }
      />

      {categories.length === 0 ? (
        <DataTable>
          <DataTableBody>
            <tr>
              <td>
                <EmptyState
                  icon={<Tag className="size-8" />}
                  title="Henüz kategori yok"
                  description="İlk kategoriyi oluşturarak ürün eklemeye başlayabilirsiniz."
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
              {categories.map((category) => (
                <DataTableClickableRow key={category.id} href={`/admin/categories/${category.id}`}>
                  <DataTableCell className="font-medium">{category.name}</DataTableCell>
                  <DataTableCell className="whitespace-nowrap text-muted-foreground">{category.slug}</DataTableCell>
                  <DataTableCell className="text-right tabular-nums">{category.productCount}</DataTableCell>
                </DataTableClickableRow>
              ))}
            </DataTableBody>
          </DataTable>

          <div className="flex flex-col gap-2 lg:hidden">
            {categories.map((category) => (
              <AdminMobileRecordCard
                key={category.id}
                href={`/admin/categories/${category.id}`}
                title={category.name}
                meta={category.slug}
                value={`${category.productCount} ürün`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
