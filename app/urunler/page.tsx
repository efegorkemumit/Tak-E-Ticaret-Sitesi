import type { Metadata } from "next"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { ProductGrid } from "@/components/product/product-grid"
import { getAllCategories, getAllProducts } from "@/lib/catalog"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Tüm Ürünler",
  description: "Gümüş kolye, yüzük, bileklik ve küpe modellerini keşfedin.",
}

export default function AllProductsPage() {
  const products = getAllProducts()
  const categories = getAllCategories()

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Breadcrumb className="mb-8" items={[{ label: "Ana Sayfa", href: "/" }, { label: "Ürünler" }]} />

      <div className="mb-10 flex flex-col gap-4">
        <h1 className="font-display text-3xl text-foreground">Tüm Ürünler</h1>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/kategori/${category.slug}`}
              className="rounded-full border border-border px-3 py-1.5 text-sm text-foreground/80 transition-colors hover:border-foreground/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>

      <ProductGrid products={products} />
    </div>
  )
}
