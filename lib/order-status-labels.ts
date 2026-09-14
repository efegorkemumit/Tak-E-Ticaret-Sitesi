/**
 * Yalnızca GÖRÜNTÜLEME amaçlı Türkçe etiket eşlemeleri. `paymentStatus` ve
 * `orderStatus` KASITLI OLARAK ayrı kavramlardır (`docs/ARCHITECTURE.md` §3)
 * — bu dosya ikisini birleştirmez, yalnızca ayrı ayrı etiketler.
 */
export function getPaymentMethodLabel(method: string): string {
  switch (method) {
    case "BANK_TRANSFER":
      return "Havale / EFT"
    case "SHOPIER":
      return "Shopier"
    default:
      return method
  }
}

export function getPaymentStatusLabel(status: string): string {
  switch (status) {
    case "PENDING":
      return "Ödeme bekleniyor"
    case "CONFIRMED":
      return "Ödeme onaylandı"
    case "FAILED":
      return "Ödeme başarısız"
    default:
      return status
  }
}
