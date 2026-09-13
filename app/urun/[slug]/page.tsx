import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { ProductGallery } from "@/components/product/product-gallery"
import { ProductPurchasePanel } from "@/components/product/product-purchase-panel"
import { ProductInfoAccordion } from "@/components/product/product-info-accordion"
import {
  getAllProducts,
  getCategoryBySlug,
  getConstantAttributes,
  getProductBySlug,
} from "@/lib/catalog"

export function generateStaticParams() {
  return getAllProducts().map((product) => ({ slug: product.slug }))
}

export async function generateMetadata(
  { params }: PageProps<"/urun/[slug]">
): Promise<Metadata> {
  const { slug } = await params
  const product = getProductBySlug(slug)
  if (!product) return {}
  return {
    title: product.name,
    description: product.careInfo,
  }
}

export default async function ProductDetailPage({ params }: PageProps<"/urun/[slug]">) {
  const { slug } = await params
  const product = getProductBySlug(slug)
  if (!product) notFound()

  const primaryCategorySlug = product.categories[0]
  const category = primaryCategorySlug ? getCategoryBySlug(primaryCategorySlug) : undefined
  const constantAttributes = getConstantAttributes(product)

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Breadcrumb
        className="mb-8"
        items={[
          { label: "Ana Sayfa", href: "/" },
          { label: "Ürünler", href: "/urunler" },
          ...(category ? [{ label: category.name, href: `/kategori/${category.slug}` }] : []),
          { label: product.name },
        ]}
      />

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <ProductGallery images={product.images} productName={product.name} />

        <div className="flex flex-col gap-8 lg:max-w-sm">
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-3xl text-foreground">{product.name}</h1>
          </div>

          <ProductPurchasePanel product={product} />

          <ProductInfoAccordion constantAttributes={constantAttributes} careInfo={product.careInfo} />
        </div>
      </div>
    </div>
  )
}
