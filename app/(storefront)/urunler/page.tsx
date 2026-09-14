import type { Metadata } from "next"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Container } from "@/components/container"
import { ProductListingToolbar } from "@/components/product/product-listing-toolbar"
import { getCategories, getPublishedProducts } from "@/lib/commerce/catalog"

export const metadata: Metadata = {
  title: "Tüm Ürünler",
  description: "Gümüş kolye, yüzük, bileklik ve küpe modellerini keşfedin.",
}

// Katalog gerçek DB'den geliyor, build-time'da dondurulamaz.
export const dynamic = "force-dynamic"

export default async function AllProductsPage() {
  const [products, categories] = await Promise.all([getPublishedProducts(), getCategories()])

  return (
    <Container className="py-10 lg:py-16">
      <Breadcrumb className="mb-8" items={[{ label: "Ana Sayfa", href: "/" }, { label: "Ürünler" }]} />

      <div className="mb-10 flex flex-col gap-2">
        <h1 className="font-display text-page-title text-foreground lg:text-page-title-lg">Tüm Ürünler</h1>
        <p className="text-metadata text-muted-foreground lg:text-metadata-lg">{products.length} ürün</p>
      </div>

      <ProductListingToolbar products={products} categories={categories} />
    </Container>
  )
}
