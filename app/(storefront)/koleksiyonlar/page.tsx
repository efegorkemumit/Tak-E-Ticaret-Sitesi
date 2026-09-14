import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Container } from "@/components/container"
import { ImageBadge } from "@/components/image-badge"
import { getCollectionCoverImage } from "@/components/editorial/taxonomy-cover-images"
import { getCollections, getProductsByCollectionSlug } from "@/lib/commerce/catalog"

export const metadata: Metadata = {
  title: "Koleksiyonlar",
  description: "Günlük ve hediyelik koleksiyonlarımızı keşfedin.",
}

export const dynamic = "force-dynamic"

export default async function CollectionsIndexPage() {
  const collections = await getCollections()
  const collectionsWithCount = await Promise.all(
    collections.map(async (collection) => ({
      ...collection,
      productCount: (await getProductsByCollectionSlug(collection.slug)).length,
    }))
  )

  return (
    <Container className="py-10 lg:py-16">
      <Breadcrumb className="mb-8" items={[{ label: "Ana Sayfa", href: "/" }, { label: "Koleksiyonlar" }]} />

      <h1 className="mb-10 font-display text-page-title text-foreground lg:text-page-title-lg">Koleksiyonlar</h1>

      <div className="grid gap-10 sm:grid-cols-2">
        {collectionsWithCount.map((collection) => {
          const cover = getCollectionCoverImage(collection.slug)
          return (
            <Link
              key={collection.slug}
              href={`/koleksiyonlar/${collection.slug}`}
              className="group/collection-card flex flex-col gap-4 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-muted">
                {cover && (
                  <>
                    <Image src={cover} alt={collection.name} fill sizes="(min-width: 640px) 50vw, 100vw" className="object-cover" />
                    <ImageBadge>Editorial görsel</ImageBadge>
                  </>
                )}
              </div>
              <div className="flex flex-col gap-1 transition-opacity group-hover/collection-card:opacity-70">
                <h2 className="font-display text-section-title text-foreground lg:text-section-title-lg">{collection.name}</h2>
                {collection.description && (
                  <p className="text-body text-muted-foreground">{collection.description}</p>
                )}
                <p className="text-metadata text-muted-foreground lg:text-metadata-lg">{collection.productCount} ürün</p>
              </div>
            </Link>
          )
        })}
      </div>
    </Container>
  )
}
