import Link from "next/link"
import { cn } from "cn"
import { listProductsForAdmin, getProductForAdmin } from "@/lib/admin"
import { AdminPageHeader } from "@/components/admin/page-header"
import { ProductListClient, type AdminProductListRow } from "@/components/admin/product-list-client"
import { buttonVariants } from "@/components/ui/button"

export const dynamic = "force-dynamic"

/**
 * `AdminProductListItemDto` (`lib/admin/products.ts`) görsel/fiyat/stok
 * taşımıyor (yalnızca id/slug/ad/durum/kategori/varyant sayısı/tarih) — bu
 * bir liste-görünümü DTO'su, `lib/**`'e yeni bir alan EKLEMEDİM. Bunun
 * yerine, katalog küçük olduğu için (dashboard'daki "stokta tükenen"
 * hesabıyla AYNI desen) her ürün için zaten var olan `getProductForAdmin`'i
 * çağırıp gerçek ilk görseli/fiyat aralığını/toplam kullanılabilir stoğu
 * türetiyoruz — uydurulmuş bir değer YOK, hepsi gerçek DB verisi.
 */
async function loadEnrichedProductList(): Promise<AdminProductListRow[]> {
  const products = await listProductsForAdmin()
  const details = await Promise.all(products.map((product) => getProductForAdmin(product.id)))

  return products.map((product, index) => {
    const detail = details[index]
    const thumbnail = detail?.images[0]
    const prices = detail?.variants.map((variant) => Number(variant.price)) ?? []
    const totalAvailableStock = detail?.variants.reduce((sum, variant) => sum + variant.availableQuantity, 0) ?? 0

    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      status: product.status,
      categoryName: product.categoryName,
      variantCount: product.variantCount,
      createdAt: product.createdAt,
      thumbnailUrl: thumbnail?.url ?? null,
      thumbnailAlt: thumbnail?.alt ?? product.name,
      thumbnailIsPlaceholder: thumbnail?.isPlaceholder ?? true,
      minPrice: prices.length > 0 ? Math.min(...prices) : null,
      maxPrice: prices.length > 0 ? Math.max(...prices) : null,
      totalAvailableStock,
    }
  })
}

/** Admin listesi TÜM durumları (DRAFT/PUBLISHED/ARCHIVED) gösterir — D021'in storefront görünürlük filtresi burada UYGULANMAZ. */
export default async function AdminProductsPage() {
  const products = await loadEnrichedProductList()
  const categoryNames = Array.from(new Set(products.map((product) => product.categoryName))).sort((a, b) =>
    a.localeCompare(b, "tr")
  )

  return (
    <div>
      <AdminPageHeader
        title="Ürünler"
        description="Tüm durumlardaki (taslak/yayında/arşivlenmiş) ürünler."
        action={
          <Link href="/admin/products/new" className={cn(buttonVariants(), "min-h-11")}>
            Yeni Ürün
          </Link>
        }
      />

      <ProductListClient products={products} categoryNames={categoryNames} />
    </div>
  )
}
