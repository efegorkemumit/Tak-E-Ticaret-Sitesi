import { notFound } from "next/navigation"
import { listCategoriesForAdmin } from "@/lib/admin"
import { AdminPageHeader } from "@/components/admin/page-header"
import { CategoryForm } from "@/components/admin/category-form"
import { updateCategoryAction } from "../actions"

export const dynamic = "force-dynamic"

/**
 * `lib/admin/categories.ts`'te bir `getCategoryForAdmin(id)` YOK (yalnızca
 * liste + create/update) — bu yüzden edit formunu doldurmak için mevcut
 * `listCategoriesForAdmin()` çağrılıp id'ye göre bulunuyor. Kategori sayısı
 * bir mücevher butiği kataloğu için küçük olacağından bu fazladan sorgu
 * kabul edilebilir bir maliyet.
 */
export default async function EditAdminCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const categories = await listCategoriesForAdmin()
  const category = categories.find((c) => c.id === id)
  if (!category) notFound()

  return (
    <div>
      <AdminPageHeader title={category.name} description="Kategori bilgilerini düzenle." />
      <CategoryForm mode="edit" initialValues={category} action={updateCategoryAction} />
    </div>
  )
}
