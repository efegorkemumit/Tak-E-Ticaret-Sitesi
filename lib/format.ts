/**
 * Para birimi TRY olarak kesinleşmiştir (D003). Türkçe yerel biçimlendirme
 * kullanılır (ör. "1.250,00 ₺").
 */
export function formatPriceTRY(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(amount)
}
