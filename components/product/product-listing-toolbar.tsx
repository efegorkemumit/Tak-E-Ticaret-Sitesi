"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import type { CatalogProductDto } from "@/lib/commerce/catalog"
import { getPriceSummary } from "@/lib/commerce/catalog-display"
import { ProductGrid } from "./product-grid"

type SortOption = "newest" | "price-asc" | "price-desc"

const SORT_LABELS: Record<SortOption, string> = {
  newest: "Yeniden Eskiye",
  "price-asc": "Fiyat: Düşükten Yükseğe",
  "price-desc": "Fiyat: Yüksekten Düşüğe",
}

/**
 * VIDEO 08 STEP 2 (part 2) — `/urunler` toolbar'ı: sayfa başlığı + ürün
 * sayısı + kategori filtresi (aynı `/kategori/[slug]` linkleri, yalnızca
 * yeniden düzenlendi — YENİ bir filtre mantığı YOK) + sıralama. Sıralama
 * BİLİNÇLİ OLARAK client-side: sunucudan zaten `createdAt desc` sırayla
 * gelen TAM listeyi (`products`) yeniden diziyor, `lib/commerce`'e yeni bir
 * sorgu/parametre EKLEMİYOR (görev talimatı — "mevcut veriyle client
 * tarafında yapılabiliyorsa yap").
 */
function ProductListingToolbar({
  products,
  categories,
}: {
  products: CatalogProductDto[]
  categories: { slug: string; name: string }[]
}) {
  const [sort, setSort] = useState<SortOption>("newest")

  const sortedProducts = useMemo(() => {
    if (sort === "newest") return products
    const withPrice = products.map((product) => ({
      product,
      price: Number(getPriceSummary(product).displayPrice),
    }))
    withPrice.sort((a, b) => (sort === "price-asc" ? a.price - b.price : b.price - a.price))
    return withPrice.map((entry) => entry.product)
  }, [products, sort])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
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

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Sırala
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortOption)}
            className="min-h-11 rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring"
          >
            {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ProductGrid products={sortedProducts} />
    </div>
  )
}

export { ProductListingToolbar }
