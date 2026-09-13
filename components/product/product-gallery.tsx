"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { cn } from "cn"
import type { ProductImage } from "@/lib/catalog"

/**
 * `docs/COMPONENT_INVENTORY.md` #3 — tek sütun, büyük görsel, sıralı akış.
 * Carousel kütüphanesi değil, native CSS `scroll-snap` (JS'siz kaydırma,
 * mobilde native swipe); JS yalnızca aktif nokta göstergesini güncellemek ve
 * noktaya tıklanınca ilgili görsele kaydırmak için kullanılır ("galeri
 * kontrolleri" — bu yüzden client component).
 */
function ProductGallery({ images, productName }: { images: ProductImage[]; productName: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const slideRefs = useRef<(HTMLDivElement | null)[]>([])
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container || images.length <= 1) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting)
        if (!visible) return
        const index = slideRefs.current.indexOf(visible.target as HTMLDivElement)
        if (index !== -1) setActiveIndex(index)
      },
      { root: container, threshold: 0.6 }
    )

    slideRefs.current.forEach((slide) => slide && observer.observe(slide))
    return () => observer.disconnect()
  }, [images.length])

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={containerRef}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((image, index) => (
          <div
            key={image.url + index}
            ref={(el) => {
              slideRefs.current[index] = el
            }}
            className="relative aspect-square w-full flex-shrink-0 snap-center bg-surface-muted"
          >
            <Image
              src={image.url}
              alt={productName}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
              priority={index === 0}
              unoptimized={image.url.endsWith(".svg")}
            />
            {!image.isRealProductPhoto && (
              <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2 py-0.5 text-[0.7rem] text-muted-foreground">
                Örnek görsel
              </span>
            )}
          </div>
        ))}
      </div>
      {images.length > 1 && (
        <div className="flex justify-center gap-1.5" role="tablist" aria-label="Ürün görselleri">
          {images.map((image, index) => (
            <button
              key={image.url + index}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`Görsel ${index + 1}`}
              onClick={() => slideRefs.current[index]?.scrollIntoView({ behavior: "smooth", inline: "center" })}
              className={cn(
                "size-1.5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                index === activeIndex ? "bg-foreground" : "bg-border"
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export { ProductGallery }
