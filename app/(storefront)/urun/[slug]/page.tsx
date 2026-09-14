import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { ProductGallery } from "@/components/product/product-gallery"
import { ProductPurchasePanel } from "@/components/product/product-purchase-panel"
import { ProductInfoAccordion } from "@/components/product/product-info-accordion"
import { getCategoryBySlug, getProductBySlug } from "@/lib/commerce/catalog"
import { getPlaceholderImage } from "@/lib/placeholder-image"

// Gerçek DB'den okunan bir katalog build-time'da bilinemez/statik
// dondurulamaz (admin ürün ekleyip durumunu değiştirebilir, D021 PUBLISHED/
// DRAFT/ARCHIVED ayrımı canlı olmalı) — bu yüzden `generateStaticParams`
// kullanılmıyor, sayfa her istekte sunucuda render edilir.
export const dynamic = "force-dynamic"

export async function generateMetadata(
  { params }: PageProps<"/urun/[slug]">
): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return {}
  return {
    title: product.name,
    description: product.description ?? undefined,
  }
}

export default async function ProductDetailPage({ params }: PageProps<"/urun/[slug]">) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) notFound()

  const category = await getCategoryBySlug(product.categorySlug)
  // Ürünün hiç görseli yoksa (henüz fotoğraf yüklenmemiş) yerel placeholder'a
  // düşülür; `ProductGallery` her iki durumda da aynı `isPlaceholder` rozet
  // mantığını kullanır.
  const images = product.images.length > 0 ? product.images : [getPlaceholderImage(product.name)]

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
        <ProductGallery images={images} productName={product.name} />

        <div className="flex flex-col gap-8 lg:max-w-sm">
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-3xl text-foreground">{product.name}</h1>
          </div>

          <ProductPurchasePanel product={product} />

          <ProductInfoAccordion
            description={product.description}
            descriptiveAttributes={product.descriptiveAttributes}
            careInfo={product.careInfo}
          />
        </div>
      </div>
    </div>
  )
}
