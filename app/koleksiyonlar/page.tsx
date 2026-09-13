import Link from "next/link"
import type { Metadata } from "next"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { getAllCollections, getProductsByCollectionSlug } from "@/lib/catalog"

export const metadata: Metadata = {
  title: "Koleksiyonlar",
  description: "Günlük ve hediyelik koleksiyonlarımızı keşfedin.",
}

export default function CollectionsIndexPage() {
  const collections = getAllCollections()

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Breadcrumb className="mb-8" items={[{ label: "Ana Sayfa", href: "/" }, { label: "Koleksiyonlar" }]} />

      <h1 className="mb-10 font-display text-3xl text-foreground">Koleksiyonlar</h1>

      <div className="grid gap-10 sm:grid-cols-2">
        {collections.map((collection) => {
          const productCount = getProductsByCollectionSlug(collection.slug).length
          return (
            <Link
              key={collection.slug}
              href={`/koleksiyonlar/${collection.slug}`}
              className="group/collection-card flex flex-col gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <div className="flex flex-col gap-1 transition-opacity group-hover/collection-card:opacity-70">
                <h2 className="font-display text-2xl text-foreground">{collection.name}</h2>
                <p className="text-sm text-muted-foreground">{collection.description}</p>
                <p className="text-xs text-muted-foreground">{productCount} ürün</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
