import { listCategoriesForAdmin, listCollectionsForAdmin } from "@/lib/admin"
import { ProductForm } from "@/components/admin/product-form"
import { createProductAction } from "../actions"

export const dynamic = "force-dynamic"

export default async function NewAdminProductPage() {
  const [categories, collections] = await Promise.all([listCategoriesForAdmin(), listCollectionsForAdmin()])

  return (
    <div className="mx-auto max-w-[1200px]">
      <ProductForm
        mode="create"
        pageTitle="Yeni Ürün"
        pageDescription="Oluşturduktan sonra varyant/görsel ekleyebileceğiniz sayfaya yönlendirilirsiniz."
        categories={categories}
        collections={collections}
        action={createProductAction}
      />
    </div>
  )
}
