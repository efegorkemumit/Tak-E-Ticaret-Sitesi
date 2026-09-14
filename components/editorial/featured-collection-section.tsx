import Link from "next/link"
import type { CatalogProductDto, CatalogTaxonomyDto } from "@/lib/commerce/catalog"
import { ProductCard } from "@/components/product/product-card"

/**
 * `docs/COMPONENT_INVENTORY.md` #18 — YALNIZCA ana sayfa koleksiyon tanıtım
 * bölümü. Değişmemiş `ProductCard`'ları "vitrin" amaçlı gösterir; bu,
 * ProductCard'ı değiştirmez, yalnızca onu editoryal bir bağlamda tüketir
 * (izolasyon korunur — bkz. `docs/DESIGN_DIRECTION.md`).
 */
function FeaturedCollectionSection({
  collection,
  products,
}: {
  collection: CatalogTaxonomyDto
  products: CatalogProductDto[]
}) {
  return (
    <section className="flex flex-col gap-6">
      <h2 className="font-display text-section-title text-foreground lg:text-section-title-lg">{collection.name}</h2>
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-4">
        {products.slice(0, 4).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      <Link
        href={`/koleksiyonlar/${collection.slug}`}
        className="w-fit text-sm text-foreground underline underline-offset-4 transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
      >
        {collection.name} koleksiyonunun tamamını gör
      </Link>
    </section>
  )
}

export { FeaturedCollectionSection }
