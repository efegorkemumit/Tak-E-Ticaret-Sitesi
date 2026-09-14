"use client"

import { useMemo, useState } from "react"
import { Gem } from "lucide-react"
import { formatPriceTRY } from "@/lib/format"
import {
  DataTable,
  DataTableHead,
  DataTableBody,
  DataTableClickableRow,
  DataTableHeadCell,
  DataTableCell,
} from "@/components/admin/data-table"
import { AdminMobileRecordCard } from "@/components/admin/mobile-record-card"
import { ProductStatusBadge } from "@/components/admin/status-badge"
import { AdminSelect } from "@/components/admin/select"
import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/ui/empty-state"

export interface AdminProductListRow {
  id: string
  slug: string
  name: string
  status: string
  categoryName: string
  variantCount: number
  createdAt: string
  thumbnailUrl: string | null
  thumbnailAlt: string
  thumbnailIsPlaceholder: boolean
  minPrice: number | null
  maxPrice: number | null
  totalAvailableStock: number
}

function formatPriceRange(min: number | null, max: number | null): string {
  if (min === null || max === null) return "—"
  if (min === max) return formatPriceTRY(min)
  return `${formatPriceTRY(min)} – ${formatPriceTRY(max)}`
}

/**
 * VIDEO 08 STEP 3 (part 2) — arama/kategori filtresi tamamen CLIENT-SIDE:
 * sunucudan zaten gelen TAM listeyi (`products`) süzüyor, `lib/admin`'e
 * yeni bir sorgu/parametre EKLEMİYOR (görev talimatı — "mevcut veriyle
 * çözülebiliyorsa çöz, çözülemiyorsa ekleme"). Kategori adı üzerinden
 * filtreleniyor (mevcut `AdminProductListItemDto.categoryName`) — ayrı bir
 * kategori id listesi/sorgusu gerekmedi.
 */
function ProductListClient({ products, categoryNames }: { products: AdminProductListRow[]; categoryNames: string[] }) {
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = search.trim().length === 0 || product.name.toLowerCase().includes(search.trim().toLowerCase())
      const matchesCategory = categoryFilter.length === 0 || product.categoryName === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [products, search, categoryFilter])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Ürün adına göre ara…"
          aria-label="Ürün ara"
          className="sm:max-w-xs"
        />
        <AdminSelect
          value={categoryFilter}
          onValueChange={setCategoryFilter}
          placeholder="Tüm kategoriler"
          items={categoryNames.map((name) => ({ value: name, label: name }))}
          className="sm:max-w-48"
        />
      </div>

      {filtered.length === 0 ? (
        <DataTable>
          <DataTableBody>
            <tr>
              <td>
                <EmptyState
                  icon={<Gem className="size-8" />}
                  title="Eşleşen ürün yok"
                  description="Arama/filtre kriterlerinizle eşleşen bir ürün bulunamadı."
                  className="py-10"
                />
              </td>
            </tr>
          </DataTableBody>
        </DataTable>
      ) : (
        <>
          <DataTable className="hidden lg:block">
            <DataTableHead>
              <tr>
                <DataTableHeadCell>Ürün</DataTableHeadCell>
                <DataTableHeadCell className="w-px whitespace-nowrap">Durum</DataTableHeadCell>
                <DataTableHeadCell className="w-px whitespace-nowrap">Kategori</DataTableHeadCell>
                <DataTableHeadCell className="w-px whitespace-nowrap text-right">Varyant</DataTableHeadCell>
                <DataTableHeadCell className="w-px whitespace-nowrap text-right">Stok</DataTableHeadCell>
                <DataTableHeadCell className="w-px whitespace-nowrap text-right">Fiyat</DataTableHeadCell>
                <DataTableHeadCell />
              </tr>
            </DataTableHead>
            <DataTableBody>
              {filtered.map((product) => (
                <DataTableClickableRow key={product.id} href={`/admin/products/${product.id}`}>
                  <DataTableCell>
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element -- bkz. product-images-section.tsx: D024 OPEN olduğu için next/image bilinçli olarak kullanılmıyor */}
                      <img
                        src={product.thumbnailUrl ?? "/fixtures/placeholder-jewelry.svg"}
                        alt={product.thumbnailAlt}
                        className="size-10 shrink-0 rounded-md border border-border object-cover"
                      />
                      <span className="min-w-0 truncate font-medium">{product.name}</span>
                    </div>
                  </DataTableCell>
                  <DataTableCell>
                    <ProductStatusBadge status={product.status} />
                  </DataTableCell>
                  <DataTableCell className="whitespace-nowrap text-muted-foreground">{product.categoryName}</DataTableCell>
                  <DataTableCell className="text-right tabular-nums">{product.variantCount}</DataTableCell>
                  <DataTableCell className="text-right tabular-nums">{product.totalAvailableStock}</DataTableCell>
                  <DataTableCell className="text-right font-medium whitespace-nowrap tabular-nums">
                    {formatPriceRange(product.minPrice, product.maxPrice)}
                  </DataTableCell>
                </DataTableClickableRow>
              ))}
            </DataTableBody>
          </DataTable>

          <div className="flex flex-col gap-2 lg:hidden">
            {filtered.map((product) => (
              <AdminMobileRecordCard
                key={product.id}
                href={`/admin/products/${product.id}`}
                title={product.name}
                badge={<ProductStatusBadge status={product.status} />}
                meta={`${product.categoryName} · ${product.variantCount} varyant · ${product.totalAvailableStock} stok`}
                value={formatPriceRange(product.minPrice, product.maxPrice)}
                thumbnail={{ src: product.thumbnailUrl ?? "/fixtures/placeholder-jewelry.svg", alt: product.thumbnailAlt }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export { ProductListClient }
