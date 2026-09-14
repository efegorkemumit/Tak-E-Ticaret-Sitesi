import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Container } from "@/components/container"
import { ProductGallery } from "@/components/product/product-gallery"
import { ProductPurchasePanel } from "@/components/product/product-purchase-panel"
import { ProductInfoAccordion } from "@/components/product/product-info-accordion"
import { ProductCard } from "@/components/product/product-card"
import { Carousel, CarouselItem } from "@/components/ui/carousel"
import { getCategoryBySlug, getProductBySlug, getProductsByCategorySlug } from "@/lib/commerce/catalog"
import { getPlaceholderImage } from "@/lib/placeholder-image"

// Gerçek DB'den okunan bir katalog build-time'da bilinemez/statik
// dondurulamaz (admin ürün ekleyip durumunu değiştirebilir, D021 PUBLISHED/
// DRAFT/ARCHIVED ayrımı canlı olmalı) — bu yüzden `generateStaticParams`
// kullanılmıyor, sayfa her istekte sunucuda render edilir.
export const dynamic = "force-dynamic"

export async function generateMetadata(
  { params }: PageProps<"/urun/[slug]">
): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return {}
  return {
    title: product.name,
    description: product.description ?? undefined,
  }
}

export default async function ProductDetailPage({ params }: PageProps<"/urun/[slug]">) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) notFound()

  const category = await getCategoryBySlug(product.categorySlug)
  // Ürünün hiç görseli yoksa (henüz fotoğraf yüklenmemiş) yerel placeholder'a
  // düşülür; `ProductGallery` her iki durumda da aynı `isPlaceholder` rozet
  // mantığını kullanır.
  const images = product.images.length > 0 ? product.images : [getPlaceholderImage(product.name)]

  // "Benzer Ürünler" — YENİ bir öneri/recommendation mantığı DEĞİL, aynı
  // kategoriden zaten var olan `getProductsByCategorySlug` sorgusu, mevcut
  // ürün hariç tutulmuş hâliyle.
  const relatedProducts = (await getProductsByCategorySlug(product.categorySlug)).filter(
    (candidate) => candidate.id !== product.id
  )

  return (
    <Container className="py-10 lg:py-16">
      <Breadcrumb
        className="mb-8"
        items={[
          { label: "Ana Sayfa", href: "/" },
          { label: "Ürünler", href: "/urunler" },
          ...(category ? [{ label: category.name, href: `/kategori/${category.slug}` }] : []),
          { label: product.name },
        ]}
      />

      {/*
        VIDEO 08 STEP 2 (part 2) — ~60/40 düzen (`lg:grid-cols-5`, galeri 3/
        panel 2) + `lg:sticky` satın alma paneli. `items-start` ZORUNLU:
        aksi halde grid'in varsayılan `stretch` davranışı sticky paneli
        galerinin tam yüksekliğine gerer, `position: sticky` etkisiz kalır.
      */}
      <div className="grid items-start gap-10 lg:grid-cols-5 lg:gap-16">
        <div className="lg:col-span-3">
          <ProductGallery images={images} productName={product.name} />
        </div>

        <div className="flex flex-col gap-8 lg:sticky lg:top-24 lg:col-span-2">
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-page-title text-foreground lg:text-page-title-lg">{product.name}</h1>
          </div>

          <ProductPurchasePanel product={product} />

          <ProductInfoAccordion
            description={product.description}
            descriptiveAttributes={product.descriptiveAttributes}
            careInfo={product.careInfo}
          />
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <section className="mt-16 flex flex-col gap-6 lg:mt-24">
          <h2 className="font-display text-section-title text-foreground lg:text-section-title-lg">Benzer Ürünler</h2>
          <Carousel aria-label="Benzer ürünler">
            {relatedProducts.map((relatedProduct) => (
              <CarouselItem key={relatedProduct.id}>
                <ProductCard product={relatedProduct} />
              </CarouselItem>
            ))}
          </Carousel>
        </section>
      )}
    </Container>
  )
}
