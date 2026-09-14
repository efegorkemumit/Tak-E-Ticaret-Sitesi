import { listCategoriesForAdmin, listCollectionsForAdmin } from "@/lib/admin"
import { AdminPageHeader } from "@/components/admin/page-header"
import { ProductForm } from "@/components/admin/product-form"
import { createProductAction } from "../actions"

export const dynamic = "force-dynamic"

export default async function NewAdminProductPage() {
  const [categories, collections] = await Promise.all([listCategoriesForAdmin(), listCollectionsForAdmin()])

  return (
    <div>
      <AdminPageHeader title="Yeni Ürün" description="Oluşturduktan sonra varyant/görsel ekleyebileceğiniz sayfaya yönlendirilirsiniz." />
      <ProductForm mode="create" categories={categories} collections={collections} action={createProductAction} />
    </div>
  )
}
