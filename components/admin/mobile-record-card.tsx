import Link from "next/link"
import type { ReactNode } from "react"

/**
 * VIDEO 08 STEP 3 (part 2) — `docs/DESIGN_DIRECTION.md`'nin "Mobilde
 * (<768px)" kuralı: tablo yatay scroll'a ZORLANMAZ, her kayıt bağımsız bir
 * karta dönüşür — üst satırda kimlik + durum rozeti yan yana, alt satırda
 * ikincil bilgi (solda) + tutar (sağda). Sipariş/ürün/kategori/koleksiyon
 * listelerinin hepsi AYNI ortak kartı kullanır (görev talimatı: "her ekranı
 * farklı tasarım diliyle yapma").
 *
 * DÜZELTME (final QA) — iki opsiyonel alan eklendi, ikisi de yalnızca
 * ihtiyacı olan çağıran tarafından kullanılır, diğerlerini etkilemez:
 * - `thumbnail`: masaüstü tabloda zaten olan ürün görseli/placeholder'ı
 *   mobil/tablet karta da taşır (`ad-products-375`/`768` bulgusu — kart
 *   listesinde ürün görselsiz, yalnızca metinle ayırt ediliyordu).
 * - `secondaryBadge`: birincil rozetin (üst satır) YANINA değil, kendi
 *   satırına konur — D026 gereği Ödeme Durumu'nun (`ad-orders-375`/`768`
 *   bulgusu) Sipariş Durumu'yla aynı satırda ÇAKIŞMADAN, ayrı bir satırda
 *   görünmesi için. Etiket metni (ör. "Ödeme:") kartın kendisine
 *   GÖMÜLMEDİ — çağıran taraf kendi bağlamına uygun tam içeriği geçirir,
 *   bu bileşen genel/yeniden kullanılabilir kalır.
 */
function AdminMobileRecordCard({
  href,
  title,
  badge,
  secondaryBadge,
  meta,
  value,
  thumbnail,
}: {
  href: string
  title: ReactNode
  badge?: ReactNode
  secondaryBadge?: ReactNode
  meta?: ReactNode
  value?: ReactNode
  thumbnail?: { src: string; alt: string }
}) {
  return (
    <Link
      href={href}
      className="flex gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {thumbnail && (
        // eslint-disable-next-line @next/next/no-img-element -- bkz. product-images-section.tsx: D024 OPEN olduğu için next/image bilinçli olarak kullanılmıyor
        <img
          src={thumbnail.src}
          alt={thumbnail.alt}
          className="size-10 shrink-0 rounded-md border border-border object-cover"
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {/* DÜZELTME (final inceleme) — `truncate` sipariş numarasını
            (`ORD-20260914-NP…`) kesiyordu; admin için sipariş no birincil
            tanımlayıcı, kesilmemeli. `truncate` yerine `break-words`: başlık
            gerekirse 2 satıra sarar (tire karakterleri doğal kırılma noktası),
            rozet `items-start` ile üstte hizalı kalır. Ürün/kategori adları
            gibi genelde tek satıra sığan başlıklar için görsel bir değişiklik
            yaratmaz. */}
        <div className="flex items-start justify-between gap-3">
          <span className="min-w-0 break-words text-sm font-medium text-foreground">{title}</span>
          {badge}
        </div>
        {secondaryBadge && <div className="flex items-center gap-1.5">{secondaryBadge}</div>}
        {(meta || value) && (
          <div className="flex items-center justify-between gap-3">
            <span className="min-w-0 truncate text-admin-helper text-muted-foreground">{meta}</span>
            {value && <span className="shrink-0 text-admin-table-cell font-medium text-foreground tabular-nums">{value}</span>}
          </div>
        )}
      </div>
    </Link>
  )
}

export { AdminMobileRecordCard }
