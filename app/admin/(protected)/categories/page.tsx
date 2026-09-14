import Link from "next/link"
import { Tag } from "lucide-react"
import { listCategoriesForAdmin } from "@/lib/admin"
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
          {categories.length === 0 ? (
            <tr>
              <td colSpan={4}>
                <EmptyState
                  icon={<Tag className="size-8" />}
                  title="Henüz kategori yok"
                  description="İlk kategoriyi oluşturarak ürün eklemeye başlayabilirsiniz."
                  className="py-10"
                />
              </td>
            </tr>
          ) : (
            categories.map((category) => (
              <DataTableRow key={category.id}>
                <DataTableCell>{category.name}</DataTableCell>
                <DataTableCell className="text-muted-foreground">{category.slug}</DataTableCell>
                <DataTableCell>{category.productCount}</DataTableCell>
                <DataTableCell className="text-right">
                  <Link
                    href={`/admin/categories/${category.id}`}
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
