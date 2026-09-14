"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "cn"

/**
 * Veri tablosu kabuğu — `docs/DESIGN_DIRECTION.md`'nin "Tablo Deseni"yle
 * BİREBİR: satır yüksekliği 48px (`h-12`), hücre padding dikey 12px/yatay
 * 16px, başlık 12px/500 (`text-admin-table-header`, normal case — all-caps
 * YOK), hücre 14px (`text-admin-table-cell`). Sıralama/sayfalama MANTIĞI
 * içermez — yalnızca yapı ve görünüm.
 *
 * DÜZELTME (final inceleme) — bu tablo, sayfa seviyesinde `hidden lg:block`
 * (masaüstü) + `lg:hidden` (mobil kart, `AdminMobileRecordCard`) çiftiyle
 * kullanılır; eşik kasıtlı olarak `md:` (768px) DEĞİL `lg:` (1024px). Spec
 * yalnızca `<768px` için kart-listesi tanımlıyordu, bu da 768–1024 tablet
 * aralığını boşta bırakıp tablonun `overflow-x-auto` ile SESSİZCE
 * kırpılmasına yol açıyordu (Tutar/Fiyat/Stok gibi sütunlar hiçbir görsel
 * ipucu olmadan görünmez oluyordu — bkz. `orders-1024`/`products-1024`
 * bulgusu). Kural: hiçbir sütun, varlığını belli eden bir işaret olmadan
 * görünmez kalmamalı; zaten doğrulanmış/iyi çalışan kart deseni tablet
 * genişliğine kadar uzatıldı.
 *
 * DÜZELTME 2 (final QA) — `.admin-table-scroll`'un CSS "scroll shadow"su
 * (globals.css) teknik olarak doğru çalışıyordu ama gerçek bir ekran
 * görüntüsünde ÇIPLAK GÖZLE fark edilmiyordu (birkaç piksellik, çok soluk
 * bir kontrast) — "sessiz taşma" sorunu pratikte hâlâ açıktı. Programatik
 * "DOM'da var" kanıtı bu sefer yeterli değil; asıl sorun görünürlüğün
 * kendisiydi. Bu yüzden gerçek, KOŞULLU (yalnızca gerçekten taşma varken),
 * yüksek kontrastlı bir rozet eklendi: `ResizeObserver` + `scroll` olayıyla
 * gerçek taşma durumu ölçülüyor, taşma olan tarafta dolu arka planlı,
 * ikonlu bir daire (`bg-foreground text-background`) header'ın sağ/sol
 * üst köşesine sabitleniyor — satırların kendi "detayı görüntüle" ok
 * ikonuyla (sağ alt, her satırda tekrar eden) KARIŞTIRILMASIN diye kasıtlı
 * olarak farklı konumda (üstte, tablo geneli için TEK bir rozet).
 */
function DataTable({ children, className }: { children: ReactNode; className?: string }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    function update() {
      if (!el) return
      setCanScrollLeft(el.scrollLeft > 2)
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2)
    }

    update()
    el.addEventListener("scroll", update, { passive: true })
    const resizeObserver = new ResizeObserver(update)
    resizeObserver.observe(el)
    window.addEventListener("resize", update)
    return () => {
      el.removeEventListener("scroll", update)
      resizeObserver.disconnect()
      window.removeEventListener("resize", update)
    }
  }, [])

  return (
    <div className={cn("relative", className)}>
      <div ref={scrollRef} className="admin-table-scroll overflow-x-auto rounded-md border border-border">
        <table className="w-full border-collapse">{children}</table>
      </div>
      {canScrollRight && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-foreground text-background shadow-sm"
        >
          <ChevronRight className="size-3.5" />
        </span>
      )}
      {canScrollLeft && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-2 left-2 flex size-6 items-center justify-center rounded-full bg-foreground text-background shadow-sm"
        >
          <ChevronLeft className="size-3.5" />
        </span>
      )}
    </div>
  )
}

function DataTableHead({ children }: { children: ReactNode }) {
  return <thead className="bg-surface-muted text-left text-admin-table-header text-muted-foreground">{children}</thead>
}

function DataTableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-border text-admin-table-cell">{children}</tbody>
}

function DataTableRow({ children, className }: { children: ReactNode; className?: string }) {
  return <tr className={cn("h-12", className)}>{children}</tr>
}

/**
 * `docs/DESIGN_DIRECTION.md`: "tüm satır tıklanabilirse `hover:bg-surface-muted`
 * + `cursor-pointer` + satır sonunda sabit bir `ChevronRight` ikonuyla
 * tıklanabilirlik açıkça belirtilir." Satırın kendisi (`<tr>`) bir `<a>`
 * OLAMAZ (geçersiz HTML) — bu yüzden hover/pointer satırda, GERÇEK link
 * (erişilebilir, klavye ile ulaşılabilir) son hücredeki ok ikonunda.
 */
function DataTableClickableRow({ href, children }: { href: string; children: ReactNode }) {
  return (
    <tr className="h-12 cursor-pointer transition-colors hover:bg-surface-muted">
      {children}
      <td className="w-px px-2">
        <Link
          href={href}
          aria-label="Detayı görüntüle"
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      </td>
    </tr>
  )
}

function DataTableHeadCell({ children, className }: { children?: ReactNode; className?: string }) {
  return <th className={cn("px-4 py-3 font-medium", className)}>{children}</th>
}

function DataTableCell({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3 text-foreground", className)}>{children}</td>
}

export {
  DataTable,
  DataTableHead,
  DataTableBody,
  DataTableRow,
  DataTableClickableRow,
  DataTableHeadCell,
  DataTableCell,
}
