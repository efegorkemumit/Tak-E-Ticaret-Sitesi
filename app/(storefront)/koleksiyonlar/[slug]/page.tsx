import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Container } from "@/components/container"
import { ProductGrid } from "@/components/product/product-grid"
import { getCollectionBySlug, getProductsByCollectionSlug } from "@/lib/commerce/catalog"

export const dynamic = "force-dynamic"

export async function generateMetadata(
  { params }: PageProps<"/koleksiyonlar/[slug]">
): Promise<Metadata> {
  const { slug } = await params
  const collection = await getCollectionBySlug(slug)
  if (!collection) return {}
  return { title: collection.name, description: collection.description ?? undefined }
}

export default async function CollectionDetailPage({
  params,
}: PageProps<"/koleksiyonlar/[slug]">) {
  const { slug } = await params
  const collection = await getCollectionBySlug(slug)
  if (!collection) notFound()

  const products = await getProductsByCollectionSlug(collection.slug)

  return (
    <Container className="py-10 lg:py-16">
      <Breadcrumb
        className="mb-8"
        items={[
          { label: "Ana Sayfa", href: "/" },
          { label: "Koleksiyonlar", href: "/koleksiyonlar" },
          { label: collection.name },
        ]}
      />

      <div className="mb-10 flex flex-col gap-2">
        <h1 className="font-display text-page-title text-foreground lg:text-page-title-lg">{collection.name}</h1>
        {collection.description && (
          <p className="text-body text-muted-foreground">{collection.description}</p>
        )}
      </div>

      <ProductGrid products={products} />
    </Container>
  )
}
