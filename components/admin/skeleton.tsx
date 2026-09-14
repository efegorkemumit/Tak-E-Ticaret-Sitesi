import { cn } from "cn"

/**
 * Yükleniyor durumu yer tutucusu — BİLİNÇLİ OLARAK animasyonsuz (statik
 * `bg-surface-muted` blok). Admin yönü "ANIMASYON YOK" diyor; bu, işlevsel
 * bir yükleme göstergesi olsa da (dekoratif değil) o kurala uyar — hareket
 * yerine yalnızca şekil/yoğunlukla "burada içerik yüklenecek" iletir.
 */
function AdminSkeleton({ className }: { className?: string }) {
  return <div className={cn("rounded-md bg-surface-muted", className)} aria-hidden="true" />
}

export { AdminSkeleton }
