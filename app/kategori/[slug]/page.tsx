import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { ProductGrid } from "@/components/product/product-grid"
import { getAllCategories, getCategoryBySlug, getProductsByCategorySlug } from "@/lib/catalog"

export function generateStaticParams() {
  return getAllCategories().map((category) => ({ slug: category.slug }))
}

export async function generateMetadata(
  { params }: PageProps<"/kategori/[slug]">
): Promise<Metadata> {
  const { slug } = await params
  const category = getCategoryBySlug(slug)
  if (!category) return {}
  return { title: category.name, description: category.description }
}

export default async function CategoryPage({ params }: PageProps<"/kategori/[slug]">) {
  const { slug } = await params
  const category = getCategoryBySlug(slug)
  if (!category) notFound()

  const products = getProductsByCategorySlug(category.slug)

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Breadcrumb
        className="mb-8"
        items={[{ label: "Ana Sayfa", href: "/" }, { label: "Ürünler", href: "/urunler" }, { label: category.name }]}
      />

      <div className="mb-10 flex flex-col gap-2">
        <h1 className="font-display text-3xl text-foreground">{category.name}</h1>
        <p className="text-sm text-muted-foreground">{category.description}</p>
      </div>

      <ProductGrid products={products} />
    </div>
  )
}
