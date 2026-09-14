/**
 * Admin ekranlarına özgü Türkçe durum etiketleri. `paymentMethod`/`paymentStatus`
 * için `lib/order-status-labels.ts`'teki GERÇEK, storefront'un da kullandığı
 * eşleme doğrudan yeniden kullanılır (çift kaynak YOK) — burada yalnızca o
 * dosyada henüz bulunmayan `orderStatus`/`ProductStatus` etiketleri eklenir
 * (bu ikisi yalnızca admin'in ilgilendiği kavramlar, storefront'un değil).
 */
import { getPaymentMethodLabel, getPaymentStatusLabel } from "@/lib/order-status-labels"

export { getPaymentMethodLabel, getPaymentStatusLabel }

export function getOrderStatusLabel(status: string): string {
  switch (status) {
    case "PAYMENT_PENDING":
      return "Ödeme Bekleniyor"
    case "PREPARING":
      return "Hazırlanıyor"
    case "SHIPPED":
      return "Kargoya Verildi"
    case "DELIVERED":
      return "Teslim Edildi"
    case "CANCELLED":
      return "İptal Edildi"
    case "RETURNED":
      return "İade Edildi"
    default:
      return status
  }
}

export function getProductStatusLabel(status: string): string {
  switch (status) {
    case "DRAFT":
      return "Taslak"
    case "PUBLISHED":
      return "Yayında"
    case "ARCHIVED":
      return "Arşivlendi"
    default:
      return status
  }
}
