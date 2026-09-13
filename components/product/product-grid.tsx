import type { Product } from "@/lib/catalog"
import { ProductCard } from "./product-card"
import { EmptyState } from "@/components/ui/empty-state"

/**
 * DESIGN_DIRECTION.md "COLLECTION SECTION": ürün listeleme sayfalarında
 * düzenli/simetrik, tekrar kullanılabilir grid (2-3-4 sütun breakpoint'e
 * göre) — asimetri yok. `docs/COMPONENT_INVENTORY.md`'de ayrı bir numarası
 * yok; ProductCard'ları saran ortak bir kompozisyon olarak eklendi.
 */
function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <EmptyState
        title="Bu bölümde henüz ürün yok"
        description="Katalog güncellendiğinde burada yeni ürünler görünecek."
      />
    )
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}

export { ProductGrid }
