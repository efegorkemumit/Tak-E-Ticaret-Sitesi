import type { ReactNode } from "react"
import { cn } from "cn"

/**
 * VIDEO 08 STEP 2 — audit'in bulduğu "çift gösterge" sorununun kalan yarısı:
 * `ProductCard`/`ProductGallery`/`EditorialAsymmetricBlock`'ta AYNI "bu bir
 * yer tutucu/örnek görsel" rozeti dört farklı yerde birbirinden hafifçe
 * farklı satır içi class'larla tekrarlanıyordu. Artık TEK, bilinçli olarak
 * İNCELİKLİ (küçük punto, düşük kontrast, ince kenarlık, köşede) bir
 * component — ürünün/görselin önüne geçmemesi gereken ikincil bir bilgi.
 *
 * `ProductImage.isPlaceholder` alanının kendisi (D012/D013) burada
 * DEĞİŞTİRİLMEDİ — bu yalnızca o gerçek veri alanının GÖRSEL sunumu.
 */
function ImageBadge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "absolute left-2 top-2 rounded-full border border-border/60 bg-background/70 px-1.5 py-0.5",
        "text-metadata font-medium tracking-wide text-muted-foreground/80 backdrop-blur-sm lg:text-metadata-lg",
        className
      )}
    >
      {children}
    </span>
  )
}

export { ImageBadge }
