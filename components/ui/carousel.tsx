"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "cn"

/**
 * VIDEO 08 STEP 2 — yeniden kullanılabilir carousel PRIMITIVE'i. `ProductGallery`
 * (`components/product/product-gallery.tsx`) ile AYNI teknik: bir kütüphane
 * değil, native CSS `scroll-snap` (swipe/dokunmatik kaydırma tarayıcıdan
 * gelir, JS'siz) + ok tuşları/önceki-sonraki için ince bir JS katmanı.
 *
 * BİLİNÇLİ SINIRLAR: otomatik oynatma/otomatik kayma YOK (yalnızca kullanıcı
 * eylemine cevap veren hareket, `docs/DESIGN_DIRECTION.md` MOTION İLKESİ).
 * Bu bir ARAÇTIR — hangi bölümlerin (Yeni Gelenler/Öne Çıkan Ürünler/Featured
 * Collection/Benzer Ürünler) bunu kullanacağı bu component'te KARAR VERİLMEZ,
 * sayfa kompozisyonunun işi (bu turun kapsamı dışında, bkz. görev talimatı).
 *
 * `CarouselItem`in responsive `basis` değerleri masaüstünde ~4, tablette
 * ~2-3, mobilde ~1.3-2 (kısmi/"yarım" kart) öğe hissi verecek şekilde
 * seçildi — kaydırılabilir olduğu kartın kesilmiş kenarından anlaşılsın diye
 * mobilde bilinçli olarak tam sayı DEĞİL.
 */
function Carousel({
  children,
  className,
  "aria-label": ariaLabel,
}: {
  children: ReactNode
  className?: string
  "aria-label": string
}) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  const updateEdgeState = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    // 1px tolerans — bazı tarayıcılarda scroll-snap sonrası scrollLeft alt-piksel farkı bırakabiliyor.
    setCanScrollPrev(el.scrollLeft > 1)
    setCanScrollNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }, [])

  useEffect(() => {
    updateEdgeState()
    const el = scrollerRef.current
    if (!el) return
    el.addEventListener("scroll", updateEdgeState, { passive: true })
    window.addEventListener("resize", updateEdgeState)
    return () => {
      el.removeEventListener("scroll", updateEdgeState)
      window.removeEventListener("resize", updateEdgeState)
    }
  }, [updateEdgeState])

  function scrollByDirection(direction: -1 | 1) {
    const el = scrollerRef.current
    if (!el) return
    const firstItem = el.firstElementChild as HTMLElement | null
    // Bir "sayfa" yerine bir ÖĞE kadar kaydırılır — çoklu görünür öğede
    // (masaüstü ~4) tek seferde tüm satırı atlamak yerine daha öngörülebilir.
    const step = firstItem ? firstItem.getBoundingClientRect().width + 16 : el.clientWidth * 0.8
    el.scrollBy({ left: step * direction, behavior: "smooth" })
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowRight") {
      event.preventDefault()
      scrollByDirection(1)
    } else if (event.key === "ArrowLeft") {
      event.preventDefault()
      scrollByDirection(-1)
    }
  }

  return (
    <div className={cn("relative", className)} role="region" aria-roledescription="carousel" aria-label={ariaLabel}>
      <div
        ref={scrollerRef}
        role="group"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {children}
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <CarouselButton direction="prev" disabled={!canScrollPrev} onClick={() => scrollByDirection(-1)} />
        <CarouselButton direction="next" disabled={!canScrollNext} onClick={() => scrollByDirection(1)} />
      </div>
    </div>
  )
}

function CarouselButton({
  direction,
  disabled,
  onClick,
}: {
  direction: "prev" | "next"
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={direction === "prev" ? "Önceki" : "Sonraki"}
      // min-h-11/min-w-11 (44px) — bkz. `product-purchase-panel.tsx`'teki aynı
      // gerekçe: paylaşılan `Button` primitive'i (`components/ui/button.tsx`)
      // burada bilinçli olarak KULLANILMADI/değiştirilmedi, dokunma hedefi
      // doğrudan telafi edildi.
      className={cn(
        "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-border text-foreground transition-colors",
        "hover:border-foreground/40 hover:bg-surface-muted",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-30"
      )}
    >
      {direction === "prev" ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
    </button>
  )
}

/**
 * `basis` değerleri: mobil ~72% (1.3 öğe + kesik önizleme), sm ~46% (~2.1),
 * md ~31% (~3.2), lg ~23% (~4.3) — tam sayıya kasıtlı olarak yuvarlanmadı ki
 * bir sonraki kartın kenarı görünüp kaydırılabilirlik ipucu versin.
 */
function CarouselItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("w-[72%] shrink-0 snap-start sm:w-[46%] md:w-[31%] lg:w-[23%]", className)}>{children}</div>
  )
}

export { Carousel, CarouselItem }
