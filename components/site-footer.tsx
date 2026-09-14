import Link from "next/link"
import { Container } from "@/components/container"
import { getCategories } from "@/lib/commerce/catalog"

/**
 * `docs/COMPONENT_INVENTORY.md` #7'nin footer kısmı. İletişim, Kargo ve
 * Teslimat, İade ve Değişim, Gizlilik Politikası, Mesafeli Satış Sözleşmesi
 * sayfaları `docs/PROJECT_BRIEF.md` Bölüm 8'de MVP kapsamındadır ama BU
 * DALGADA henüz oluşturulmadı (kapsam yalnızca ana sayfa/listeleme/detay) —
 * bu yüzden kırık link oluşturmamak için tıklanamaz kalır, ilgili route'lar
 * eklendiğinde gerçek `Link`'e çevrilmelidir.
 *
 * VIDEO 08 STEP 2 — audit bulgusu: "gereğinden yüksek ve boş", beş ayrı
 * satırın hepsi "(yakında)" etiketiyle soluk görünüyordu ("site yayına hazır
 * değil" hissi). Sayfa/link SAYISI değişmedi (uydurma link yok) — yalnızca
 * beşi TEK bir kısa, düşük vurgulu cümlede toplandı ve dikey boşluk azaltıldı.
 */
const LEGAL_PAGES_PENDING = [
  "İletişim",
  "Kargo ve Teslimat",
  "İade ve Değişim",
  "Gizlilik Politikası",
  "Mesafeli Satış Sözleşmesi",
]

async function SiteFooter() {
  // Footer TÜM sayfaların (root layout) parçası — kategori sorgusu geçici
  // olarak başarısız olsa bile (DB kesintisi vb.) bütün site 500 vermemeli.
  // Bu, yalnızca yardımcı bir navigasyon listesi; sessizce boş dizi ile
  // devam etmek, kritik olmayan bir footer linki için makul bir bozulma
  // (graceful degradation), ana içerik sayfalarındaki (`ProductGrid` →
  // `EmptyState`) hata/boş durum ele alışıyla aynı ilkeyi paylaşıyor.
  const categories = await getCategories().catch((error) => {
    console.error("SiteFooter: getCategories() başarısız oldu", error)
    return []
  })

  return (
    <footer className="border-t border-border">
      <Container className="grid gap-8 py-10 sm:grid-cols-3 sm:gap-10 sm:py-12">
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
          <p className="text-metadata text-muted-foreground/70 lg:text-metadata-lg">{LEGAL_PAGES_PENDING.join(", ")} yakında eklenecektir.</p>
        </div>
      </Container>
      <div className="border-t border-border">
        <Container className="py-4 text-center text-metadata text-muted-foreground lg:text-metadata-lg">
          [Marka Adı] — © {new Date().getFullYear()}. Bu site geliştirme aşamasındadır.
        </Container>
      </div>
    </footer>
  )
}

export { SiteFooter }
