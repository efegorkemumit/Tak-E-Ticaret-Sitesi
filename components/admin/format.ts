/**
 * Admin ekranlarına özgü tarih biçimlendirme — `lib/format.ts`'teki
 * `formatPriceTRY` zaten para birimini karşılıyor, o dosyaya bir tarih
 * fonksiyonu eklemek (`lib/**`'e yazmak) bu turun dosya sahipliği sınırının
 * dışında; bu yüzden admin'e özgü, saf bir yardımcı burada tutulur.
 */
export function formatAdminDateTime(iso: string): string {
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso))
}

export function formatAdminDate(iso: string): string {
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(new Date(iso))
}
