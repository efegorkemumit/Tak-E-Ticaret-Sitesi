import Image from "next/image"
import Link from "next/link"
import { cn } from "cn"
import { ImageBadge } from "@/components/image-badge"

/**
 * `docs/COMPONENT_INVENTORY.md` #17 — YALNIZCA ana sayfa editorial/koleksiyon
 * tanıtım bölümüne özgü. `Product`/`Variant` nesnesi almaz, ProductCard'ın
 * prop şekliyle hiçbir ortak alanı yoktur (bkz. İzolasyon Notu,
 * `docs/DESIGN_DIRECTION.md`). Asimetri, bu component'in kendi mantığından
 * DEĞİL, onu çağıran ana sayfanın elle verdiği `className` (col-span/row-span)
 * değerlerinden gelir — component'in kendisi boyuta göre karar vermez.
 *
 * Görsel, D013 kapsamında lisanslı stok/editorial içerik için ayrılmış bir
 * alandır; gerçek lisanslı varlık tedarik edilene kadar aynı geliştirme
 * placeholder'ı kullanılır ve "Editorial görsel" etiketiyle işaretlenir.
 */
function EditorialAsymmetricBlock({
  image,
  heading,
  body,
  cta,
  className,
}: {
  image: { url: string; alt: string }
  heading: string
  body: string
  cta?: { label: string; href: string }
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface-muted">
        <Image
          src={image.url}
          alt={image.alt}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
          unoptimized={image.url.endsWith(".svg")}
        />
        <ImageBadge>Editorial görsel</ImageBadge>
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="font-display text-section-title text-foreground lg:text-section-title-lg">{heading}</h3>
        <p className="text-sm text-muted-foreground">{body}</p>
        {cta && (
          <Link
            href={cta.href}
            className="mt-1 w-fit text-sm text-foreground underline underline-offset-4 transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          >
            {cta.label}
          </Link>
        )}
      </div>
    </div>
  )
}

export { EditorialAsymmetricBlock }
