import Link from "next/link"
import Image from "next/image"
import { Container } from "@/components/container"
import { ImageBadge } from "@/components/image-badge"
import { MotionReveal } from "@/components/motion-reveal"
import { EditorialAsymmetricBlock } from "@/components/editorial/editorial-asymmetric-block"
import { FeaturedCollectionSection } from "@/components/editorial/featured-collection-section"
import { getCategoryCoverImage } from "@/components/editorial/taxonomy-cover-images"
import { Carousel, CarouselItem } from "@/components/ui/carousel"
import { ProductCard } from "@/components/product/product-card"
import {
  getCategories,
  getCollections,
  getProductsByCollectionSlug,
  getPublishedProducts,
} from "@/lib/commerce/catalog"
import { PLACEHOLDER_IMAGE_URL } from "@/lib/placeholder-image"

// Katalog gerçek DB'den geliyor, build-time'da dondurulamaz.
export const dynamic = "force-dynamic"

/**
 * VIDEO 08 STEP 2 (part 2) — brief'in önerdiği sıra Hero → kategori/koleksiyon
 * görsel alanı → Yeni Gelenler carousel → editorial → featured collection →
 * ürün carousel → marka hikâyesi idi. BİLİNÇLİ TRIM: elimizde yalnızca 4
 * yayında ürün var; "Yeni Gelenler" (tüm 4 ürün) ile ayrı bir "Öne Çıkan
 * Ürünler" carousel'i AYNI 4 ürünü iki kez, farklı bir başlık altında
 * göstermek olurdu — bu tam olarak audit'in şikâyet ettiği "boşluk doldurma"
 * hissini geri getirirdi. Bu yüzden ikinci genel ürün carousel'i EKLENMEDİ;
 * "Featured Collection" bölümü zaten her koleksiyonun KENDİ alt kümesini
 * (gerçek D023 üyeliğine göre) ayrı ayrı gösterdiği için tekrara düşmüyor.
 */
export default async function HomePage() {
  const [collections, categories, allProducts] = await Promise.all([
    getCollections(),
    getCategories(),
    getPublishedProducts(),
  ])
  const collectionProductLists = await Promise.all(
    collections.map((collection) => getProductsByCollectionSlug(collection.slug))
  )

  return (
    <div className="flex flex-col gap-16 pb-16 lg:gap-24 lg:pb-24">
      {/*
        SPLIT HERO — team lead kararı: seçilen görsel (kolye_gercek_03.jpg)
        dikey (0.67) olduğu için tam-genişlik 21:9 bandda küçük/kayıp
        görünürdü. Görsel panel + minim metin panel (Dawn deseni) dikey oranı
        zorlama kırpma olmadan doğal karşılıyor. Sayfa başına TEK motion-reveal
        kuralı burada uygulanır (metin panelinde).
      */}
      <section className="grid lg:grid-cols-2">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface-muted sm:aspect-[16/10] lg:order-2 lg:aspect-auto lg:min-h-[34rem] xl:min-h-[40rem]">
          <Image
            src="/images/kolye_gercek_03.jpg"
            alt="Taşlı gümüş kolye takan genç kadın"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            priority
            className="object-cover"
          />
          <ImageBadge className="left-4 top-4">
            Editorial görsel — lisanslı stok görsel netleşene kadar yer tutucu
          </ImageBadge>
        </div>
        <MotionReveal className="flex flex-col items-start justify-center gap-4 px-4 py-10 sm:px-6 lg:order-1 lg:px-16 lg:py-0 xl:px-20">
          <h1 className="font-display text-hero text-foreground lg:text-hero-lg">
            Zamansız gümüş takılar
          </h1>
          <p className="text-body text-muted-foreground lg:text-body-lg">
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

      <Container className="flex flex-col gap-16 lg:gap-24">
        {/* Kategori görsel alanı — eski serbest duran pill şeridinin yerini aldı. */}
        <section className="flex flex-col gap-6">
          <h2 className="font-display text-section-title text-foreground lg:text-section-title-lg">
            Kategorilere Göre Keşfet
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {categories.map((category) => {
              const cover = getCategoryCoverImage(category.slug)
              return (
                <Link
                  key={category.slug}
                  href={`/kategori/${category.slug}`}
                  className="group/category-tile flex flex-col gap-3 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface-muted">
                    {cover && (
                      <>
                        <Image
                          src={cover}
                          alt={category.name}
                          fill
                          sizes="(min-width: 1024px) 25vw, 50vw"
                          className="object-cover"
                        />
                        <ImageBadge>Editorial görsel</ImageBadge>
                      </>
                    )}
                  </div>
                  <span className="text-product-title font-medium text-foreground transition-opacity group-hover/category-tile:opacity-70 lg:text-product-title-lg">
                    {category.name}
                  </span>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Yeni Gelenler — reusable Carousel component'in ilk gerçek kullanım yeri. */}
        {allProducts.length > 0 && (
          <section className="flex flex-col gap-6">
            <h2 className="font-display text-section-title text-foreground lg:text-section-title-lg">
              Yeni Gelenler
            </h2>
            <Carousel aria-label="Yeni gelen ürünler">
              {allProducts.map((product) => (
                <CarouselItem key={product.id}>
                  <ProductCard product={product} />
                </CarouselItem>
              ))}
            </Carousel>
          </section>
        )}

        {/*
          Kontrollü asimetrik editorial kompozisyon — YALNIZCA burada, ana
          sayfada (docs/DESIGN_DIRECTION.md "Asimetri Eklentisinin Sınırı").
          Görseller team lead'in kesinleştirdiği gerçek stok fotoğraflar.
        */}
        <section className="grid gap-8 sm:grid-cols-12">
          <EditorialAsymmetricBlock
            className="sm:col-span-7"
            image={{ url: "/images/kolye_gercek_06.webp", alt: "El işçiliği editorial görseli" }}
            heading="El işçiliğiyle"
            body="Her parça, günlük kullanıma dayanacak şekilde özenle bir araya getirilir."
          />
          <EditorialAsymmetricBlock
            className="sm:col-span-5"
            image={{ url: "/images/kupe_gercek_08.webp", alt: "Bakım editorial görseli" }}
            heading="Uzun ömürlü kalsın"
            body="Doğru saklama ve temizlikle gümüş takılarınız yıllarca ilk günkü gibi kalır."
          />
        </section>

        {/* Koleksiyon tanıtım bölümleri (#18 FeaturedCollectionSection) — her biri D023 üyeliğine göre AYRI bir alt küme, "Yeni Gelenler"le tekrara düşmez. */}
        {collections.map((collection, index) => (
          <FeaturedCollectionSection
            key={collection.slug}
            collection={collection}
            products={collectionProductLists[index]}
          />
        ))}

        {/*
          Brand/story placeholder — tek, simetrik bir blok (editorial ikili
          asimetrisinden ayrı). Marka hikâyesi metni OPEN #1/#2 netleşmeden
          gerçek/iddialı bir içerik taşımaz; bilinçli olarak jenerik kalır.
          Buraya atanmış gerçek bir stok fotoğraf YOK — yerel placeholder'da kalır.
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
            <ImageBadge>Editorial görsel</ImageBadge>
          </div>
          <h2 className="font-display text-section-title text-foreground lg:text-section-title-lg">Marka Hikâyemiz</h2>
          <p className="text-body text-muted-foreground">
            Marka hikâyesi ve kurumsal kimlik içeriği henüz netleşmedi; bu alan
            gerçek içerik geldiğinde güncellenecektir.
          </p>
        </section>
      </Container>
    </div>
  )
}
