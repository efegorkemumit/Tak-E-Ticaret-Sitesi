import { AdminPageHeader } from "@/components/admin/page-header"
import { CategoryForm } from "@/components/admin/category-form"
import { createCategoryAction } from "../actions"

export default function NewAdminCategoryPage() {
  return (
    <div>
      <AdminPageHeader title="Yeni Kategori" />
      <CategoryForm mode="create" action={createCategoryAction} />
    </div>
  )
}
