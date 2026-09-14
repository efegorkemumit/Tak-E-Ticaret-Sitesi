import { notFound } from "next/navigation"
import {
  getProductForAdmin,
  listCategoriesForAdmin,
  listCollectionsForAdmin,
  listAttributeDefinitionsForAdmin,
} from "@/lib/admin"
import { AdminPageHeader } from "@/components/admin/page-header"
import { ProductForm } from "@/components/admin/product-form"
import { ProductVariantsSection } from "@/components/admin/product-variants-section"
import { ProductImagesSection } from "@/components/admin/product-images-section"
import { ProductDescriptiveAttributesSection } from "@/components/admin/product-descriptive-attributes-section"
import {
  updateProductAction,
  createVariantAction,
  updateVariantAction,
  updateVariantStockAction,
  suggestVariantSkuAction,
  uploadProductImageAction,
  deleteProductImageAction,
  reorderProductImagesAction,
  setMainProductImageAction,
  addDescriptiveAttributeAction,
  removeDescriptiveAttributeAction,
} from "../actions"

export const dynamic = "force-dynamic"

/**
 * Ürünün TÜM yönetimi (temel bilgiler + varyant/stok + görsel + açıklayıcı
 * öznitelik) tek bir sayfada, ayrı bölümler halinde — team lead'in
 * talimatındaki ekran listesine karşılık gelir. Her bölüm kendi Server
 * Action'larını çağırır; sayfa yalnızca `getProductForAdmin` ile GÜNCEL
 * veriyi bir arada toplar.
 */
export default async function EditAdminProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [product, categories, collections, attributeDefinitions] = await Promise.all([
    getProductForAdmin(id),
    listCategoriesForAdmin(),
    listCollectionsForAdmin(),
    listAttributeDefinitionsForAdmin(),
  ])
  if (!product) notFound()

  return (
    <div className="flex flex-col gap-10">
      <div>
        <AdminPageHeader title={product.name} description="Temel bilgiler" />
        <ProductForm
          mode="edit"
          categories={categories}
          collections={collections}
          initialValues={product}
          action={updateProductAction}
        />
      </div>

      <section>
        <h3 className="mb-3 font-display text-lg text-foreground">Varyantlar ve Stok</h3>
        <ProductVariantsSection
          productId={product.id}
          variants={product.variants}
          attributeDefinitions={attributeDefinitions}
          createVariantAction={createVariantAction}
          updateVariantAction={updateVariantAction}
          updateVariantStockAction={updateVariantStockAction}
          suggestSkuAction={suggestVariantSkuAction}
        />
      </section>

      <section>
        <h3 className="mb-3 font-display text-lg text-foreground">Görseller</h3>
        <ProductImagesSection
          productId={product.id}
          images={product.images}
          uploadAction={uploadProductImageAction}
          deleteAction={deleteProductImageAction}
          reorderAction={reorderProductImagesAction}
          setMainAction={setMainProductImageAction}
        />
      </section>

      <section>
        <h3 className="mb-3 font-display text-lg text-foreground">Açıklayıcı Öznitelikler</h3>
        <ProductDescriptiveAttributesSection
          productId={product.id}
          descriptiveAttributes={product.descriptiveAttributes}
          attributeDefinitions={attributeDefinitions}
          addAction={addDescriptiveAttributeAction}
          removeAction={removeDescriptiveAttributeAction}
        />
      </section>
    </div>
  )
}
