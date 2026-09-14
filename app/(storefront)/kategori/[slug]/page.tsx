import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Container } from "@/components/container"
import { ProductGrid } from "@/components/product/product-grid"
import { getCategoryBySlug, getProductsByCategorySlug } from "@/lib/commerce/catalog"

// Kategori listesi ve içeriği gerçek DB'den geliyor, build-time'da
// dondurulamaz (admin kategori/ürün ekleyebilir).
export const dynamic = "force-dynamic"

export async function generateMetadata(
  { params }: PageProps<"/kategori/[slug]">
): Promise<Metadata> {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)
  if (!category) return {}
  return { title: category.name, description: category.description ?? undefined }
}

export default async function CategoryPage({ params }: PageProps<"/kategori/[slug]">) {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)
  if (!category) notFound()

  const products = await getProductsByCategorySlug(category.slug)

  return (
    <Container className="py-10 lg:py-16">
      <Breadcrumb
        className="mb-8"
        items={[{ label: "Ana Sayfa", href: "/" }, { label: "Ürünler", href: "/urunler" }, { label: category.name }]}
      />

      <div className="mb-10 flex flex-col gap-2">
        <h1 className="font-display text-page-title text-foreground lg:text-page-title-lg">{category.name}</h1>
        {category.description && (
          <p className="text-body text-muted-foreground">{category.description}</p>
        )}
      </div>

      <ProductGrid products={products} />
    </Container>
  )
}
