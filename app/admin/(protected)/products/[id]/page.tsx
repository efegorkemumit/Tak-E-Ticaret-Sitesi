import { notFound } from "next/navigation"
import {
  getProductForAdmin,
  listCategoriesForAdmin,
  listCollectionsForAdmin,
  listAttributeDefinitionsForAdmin,
} from "@/lib/admin"
import { ProductForm } from "@/components/admin/product-form"
import { AdminFormSection } from "@/components/admin/form-section"
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
 * öznitelik) tek bir sayfada, ayrı bölümler halinde. Her bölüm kendi Server
 * Action'larını çağırır; sayfa yalnızca `getProductForAdmin` ile GÜNCEL
 * veriyi bir arada toplar.
 *
 * VIDEO 08 STEP 3 (part 2) — genişlik `max-w-[1200px]` (brand-ui'nin form
 * deseni spesifikasyonu). Sayfa başlığı artık `ProductForm`'un kendi içinde
 * (Kaydet butonuyla birlikte, header'da) render ediliyor — bkz. o dosyadaki
 * gerekçe notu.
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
    <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
      <ProductForm
        mode="edit"
        pageTitle={product.name}
        pageDescription="Ürün bilgilerini, varyantlarını ve görsellerini yönet."
        categories={categories}
        collections={collections}
        initialValues={product}
        action={updateProductAction}
      />

      <AdminFormSection title="Varyantlar, Fiyat ve Stok">
        <ProductVariantsSection
          productId={product.id}
          variants={product.variants}
          attributeDefinitions={attributeDefinitions}
          createVariantAction={createVariantAction}
          updateVariantAction={updateVariantAction}
          updateVariantStockAction={updateVariantStockAction}
          suggestSkuAction={suggestVariantSkuAction}
        />
      </AdminFormSection>

      <AdminFormSection title="Görseller">
        <ProductImagesSection
          productId={product.id}
          images={product.images}
          uploadAction={uploadProductImageAction}
          deleteAction={deleteProductImageAction}
          reorderAction={reorderProductImagesAction}
          setMainAction={setMainProductImageAction}
        />
      </AdminFormSection>

      <AdminFormSection title="Açıklayıcı Öznitelikler">
        <ProductDescriptiveAttributesSection
          productId={product.id}
          descriptiveAttributes={product.descriptiveAttributes}
          attributeDefinitions={attributeDefinitions}
          addAction={addDescriptiveAttributeAction}
          removeAction={removeDescriptiveAttributeAction}
        />
      </AdminFormSection>
    </div>
  )
}
