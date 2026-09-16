import type { ReactNode } from "react"
import { cn } from "cn"

/**
 * VIDEO 09 — Havale/EFT ödeme talimatının TEK görsel kaynağı. İki yerde
 * gösteriliyor (sipariş başarı ekranı + public sipariş sorgulama sonucu),
 * bu yüzden blok kopyalanmaz, buraya alınır.
 *
 * Bu component SAF/presentational'dır: hiçbir ayar okumaz, hiçbir şablon
 * render etmez, IBAN doğrulamaz. Banka bilgisi ve havale açıklaması her zaman
 * SUNUCUDAN gelir (`getSiteSettings` / `lookupOrder`) — burada asla
 * placeholder/örnek bir IBAN veya banka adı üretilmez (D010 ile aynı ruh:
 * doğrulanmamış bilgi uydurulmaz).
 *
 * `reservationWindowHours` opsiyoneldir: sipariş başarı ekranında site
 * ayarından gelen gerçek süre gösterilir (D018), sipariş sorgulama DTO'su bu
 * bilgiyi taşımadığı için orada satır hiç render edilmez — varsayılan bir "24"
 * değeri UYDURULMAZ.
 */
function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm break-words text-foreground sm:text-right">{children}</dd>
    </div>
  )
}

function BankTransferDetails({
  bankName,
  accountHolder,
  ibanFormatted,
  orderNumber,
  description,
  reservationWindowHours,
  className,
}: {
  bankName: string
  accountHolder: string
  ibanFormatted: string
  orderNumber: string
  /** Sunucuda/şablondan üretilmiş, müşterinin havale açıklamasına yazacağı metin. */
  description: string
  reservationWindowHours?: number
  className?: string
}) {
  return (
    <section
      className={cn(
        "flex w-full flex-col gap-4 rounded-md border border-border p-4 text-left",
        className
      )}
    >
      <h2 className="font-display text-section-title text-foreground lg:text-section-title-lg">
        Havale / EFT Bilgileri
      </h2>

      <p className="text-sm text-foreground">
        Havale açıklamasına mutlaka aşağıdaki açıklamayı yazın — aksi halde ödemeniz siparişinizle
        eşleştirilemez.
      </p>

      <dl className="flex flex-col gap-2">
        <DetailRow label="Banka">{bankName}</DetailRow>
        <DetailRow label="Hesap Sahibi">{accountHolder}</DetailRow>
        <DetailRow label="IBAN">
          {/* `select-all`: tek tıkla/dokunuşla tamamı seçilir (kopyalama kolaylığı).
              `font-mono tabular-nums`: rakam grupları eşit genişlikte hizalanır. */}
          <span className="font-mono tabular-nums select-all">{ibanFormatted}</span>
        </DetailRow>
        <DetailRow label="Sipariş No">
          <span className="font-mono select-all">{orderNumber}</span>
        </DetailRow>
        <DetailRow label="Havale Açıklaması">
          <span className="font-mono select-all">{description}</span>
        </DetailRow>
      </dl>

      {reservationWindowHours !== undefined && (
        <p className="text-metadata text-muted-foreground lg:text-metadata-lg">
          Ödemeniz onaylanana kadar ürünleriniz {reservationWindowHours} saat boyunca sizin için
          ayrılır.
        </p>
      )}
    </section>
  )
}

export { BankTransferDetails }
