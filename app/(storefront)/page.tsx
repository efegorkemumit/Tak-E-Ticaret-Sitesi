import Link from "next/link"
import Image from "next/image"
import { MotionReveal } from "@/components/motion-reveal"
import { EditorialAsymmetricBlock } from "@/components/editorial/editorial-asymmetric-block"
import { FeaturedCollectionSection } from "@/components/editorial/featured-collection-section"
import { ProductGrid } from "@/components/product/product-grid"
import {
  getCategories,
  getCollections,
  getProductsByCollectionSlug,
  getPublishedProducts,
} from "@/lib/commerce/catalog"
import { PLACEHOLDER_IMAGE_URL } from "@/lib/placeholder-image"

// Katalog gerçek DB'den geliyor, build-time'da dondurulamaz.
export const dynamic = "force-dynamic"

export default async function HomePage() {
  const [collections, categories, allProducts] = await Promise.all([
    getCollections(),
    getCategories(),
    getPublishedProducts(),
  ])
  const showcaseProducts = allProducts.slice(0, 4)
  const collectionProductLists = await Promise.all(
    collections.map((collection) => getProductsByCollectionSlug(collection.slug))
  )

  return (
    <div className="flex flex-col gap-20 pb-20">
      {/* HERO APPROACH (docs/DESIGN_DIRECTION.md): tam genişlik, atmosferik
          editorial görsel; üstünde çok az metin; CTA görselin dışında/altında.
          Sayfa başına tek motion-reveal kuralı burada uygulanır. */}
      <section className="flex flex-col gap-6">
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface-muted sm:aspect-[21/9]">
          <Image
            src={PLACEHOLDER_IMAGE_URL}
            alt="Editorial vitrin görseli"
            fill
            sizes="100vw"
            priority
            className="object-cover"
            unoptimized
          />
          <span className="absolute left-4 top-4 rounded-full bg-background/90 px-2 py-0.5 text-[0.7rem] text-muted-foreground">
            Editorial görsel — lisanslı stok görsel netleşene kadar yer tutucu
          </span>
        </div>
        <MotionReveal className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 text-center">
          <h1 className="font-display text-3xl text-foreground sm:text-4xl">
            Zamansız gümüş takılar
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Günlük kullanım için sade, özel anlar için hazır gümüş parçalar.
          </p>
          <Link
            href="/urunler"
            className="mt-2 rounded-full border border-foreground px-6 py-2.5 text-sm text-foreground transition-colors hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Tüm Ürünleri Keşfet
          </Link>
        </MotionReveal>
      </section>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-20 px-4 sm:px-6">
        {/* Kategori kısayolları */}
        <section className="flex flex-wrap justify-center gap-3">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/kategori/${category.slug}`}
              className="rounded-full border border-border px-4 py-2 text-sm text-foreground/80 transition-colors hover:border-foreground/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {category.name}
            </Link>
          ))}
        </section>

        {/* Koleksiyon tanıtım bölümleri (#18 FeaturedCollectionSection) */}
        {collections.map((collection, index) => (
          <FeaturedCollectionSection
            key={collection.slug}
            collection={collection}
            products={collectionProductLists[index]}
          />
        ))}

        {/*
          Kontrollü asimetrik editorial kompozisyon — YALNIZCA burada, ana
          sayfada (docs/DESIGN_DIRECTION.md "Asimetri Eklentisinin Sınırı").
          İki farklı genişlikte blok yan yana; genişlik farkı bu sayfanın elle
          verdiği col-span değerlerinden gelir, component'in kendisinden değil.
          Metinler placeholder editorial içeriktir, gerçek marka hikâyesi OPEN
          #1/#2 netleşince güncellenecektir.
        */}
        <section className="grid gap-8 sm:grid-cols-12">
          <EditorialAsymmetricBlock
            className="sm:col-span-7"
            image={{ url: PLACEHOLDER_IMAGE_URL, alt: "El işçiliği editorial görseli" }}
            heading="El işçiliğiyle"
            body="Her parça, günlük kullanıma dayanacak şekilde özenle bir araya getirilir."
          />
          <EditorialAsymmetricBlock
            className="sm:col-span-5"
            image={{ url: PLACEHOLDER_IMAGE_URL, alt: "Bakım editorial görseli" }}
            heading="Uzun ömürlü kalsın"
            body="Doğru saklama ve temizlikle gümüş takılarınız yıllarca ilk günkü gibi kalır."
          />
        </section>

        {/* Product showcase — koleksiyon bağlamından bağımsız, genel bir
            vitrin; "Açık Alan"ın düzenli/simetrik grid ilkesinde kalır
            (asimetri yalnızca yukarıdaki editorial bölümde). */}
        <section className="flex flex-col gap-6">
          <h2 className="font-display text-2xl text-foreground">Öne Çıkan Ürünler</h2>
          <ProductGrid products={showcaseProducts} />
          <Link
            href="/urunler"
            className="w-fit text-sm text-foreground underline underline-offset-4 transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          >
            Tüm ürünleri gör
          </Link>
        </section>

        {/*
          Brand/story placeholder — tek, simetrik bir blok (editorial ikili
          asimetrisinden ayrı). Marka hikâyesi metni OPEN #1/#2 netleşmeden
          gerçek/iddialı bir içerik taşımaz; bilinçli olarak jenerik kalır.
        */}
        <section className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
          <div className="relative aspect-[3/2] w-full max-w-md overflow-hidden bg-surface-muted">
            <Image
              src={PLACEHOLDER_IMAGE_URL}
              alt="Marka hikâyesi editorial görseli"
              fill
              sizes="(min-width: 640px) 32rem, 100vw"
              className="object-cover"
              unoptimized
            />
            <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2 py-0.5 text-[0.7rem] text-muted-foreground">
              Editorial görsel
            </span>
          </div>
          <h2 className="font-display text-2xl text-foreground">Marka Hikâyemiz</h2>
          <p className="text-sm text-muted-foreground">
            Marka hikâyesi ve kurumsal kimlik içeriği henüz netleşmedi; bu alan
            gerçek içerik geldiğinde güncellenecektir.
          </p>
        </section>
      </div>
    </div>
  )
}
