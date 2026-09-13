import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { ProductGrid } from "@/components/product/product-grid"
import {
  getAllCollections,
  getCollectionBySlug,
  getProductsByCollectionSlug,
} from "@/lib/catalog"

export function generateStaticParams() {
  return getAllCollections().map((collection) => ({ slug: collection.slug }))
}

export async function generateMetadata(
  { params }: PageProps<"/koleksiyonlar/[slug]">
): Promise<Metadata> {
  const { slug } = await params
  const collection = getCollectionBySlug(slug)
  if (!collection) return {}
  return { title: collection.name, description: collection.description }
}

export default async function CollectionDetailPage({
  params,
}: PageProps<"/koleksiyonlar/[slug]">) {
  const { slug } = await params
  const collection = getCollectionBySlug(slug)
  if (!collection) notFound()

  const products = getProductsByCollectionSlug(collection.slug)

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Breadcrumb
        className="mb-8"
        items={[
          { label: "Ana Sayfa", href: "/" },
          { label: "Koleksiyonlar", href: "/koleksiyonlar" },
          { label: collection.name },
        ]}
      />

      <div className="mb-10 flex flex-col gap-2">
        <h1 className="font-display text-3xl text-foreground">{collection.name}</h1>
        <p className="text-sm text-muted-foreground">{collection.description}</p>
      </div>

      <ProductGrid products={products} />
    </div>
  )
}
