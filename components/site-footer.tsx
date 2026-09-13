import Link from "next/link"
import { getAllCategories } from "@/lib/catalog"

/**
 * `docs/COMPONENT_INVENTORY.md` #7'nin footer kısmı. İletişim, Kargo ve
 * Teslimat, İade ve Değişim, Gizlilik Politikası, Mesafeli Satış Sözleşmesi
 * sayfaları `docs/PROJECT_BRIEF.md` Bölüm 8'de MVP kapsamındadır ama BU
 * DALGADA henüz oluşturulmadı (kapsam yalnızca ana sayfa/listeleme/detay) —
 * bu yüzden kırık link oluşturmamak için tıklanamaz, "(yakında)" etiketli
 * metin olarak gösterilir; ilgili route'lar eklendiğinde gerçek `Link`'e
 * çevrilmelidir.
 */
const LEGAL_PAGES_PENDING = [
  "İletişim",
  "Kargo ve Teslimat",
  "İade ve Değişim",
  "Gizlilik Politikası",
  "Mesafeli Satış Sözleşmesi",
]

function SiteFooter() {
  const categories = getAllCategories()

  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-3 sm:px-6">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-foreground">Keşfet</p>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            Ana Sayfa
          </Link>
          <Link href="/koleksiyonlar" className="text-sm text-muted-foreground hover:text-foreground">
            Koleksiyonlar
          </Link>
          <Link href="/urunler" className="text-sm text-muted-foreground hover:text-foreground">
            Tüm Ürünler
          </Link>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-foreground">Kategoriler</p>
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/kategori/${category.slug}`}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {category.name}
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-foreground">Kurumsal</p>
          {LEGAL_PAGES_PENDING.map((label) => (
            <span key={label} className="text-sm text-muted-foreground/60">
              {label} (yakında)
            </span>
          ))}
        </div>
      </div>
      <div className="border-t border-border px-4 py-4 text-center text-xs text-muted-foreground sm:px-6">
        [Marka Adı] — © {new Date().getFullYear()}. Bu site geliştirme aşamasındadır.
      </div>
    </footer>
  )
}

export { SiteFooter }
