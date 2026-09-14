/**
 * Admin ekranlarına özgü Türkçe durum etiketleri. `paymentMethod`/`paymentStatus`
 * için `lib/order-status-labels.ts`'teki GERÇEK, storefront'un da kullandığı
 * eşleme doğrudan yeniden kullanılır (çift kaynak YOK) — burada yalnızca o
 * dosyada henüz bulunmayan `orderStatus`/`ProductStatus` etiketleri eklenir
 * (bu ikisi yalnızca admin'in ilgilendiği kavramlar, storefront'un değil).
 */
import { getPaymentMethodLabel, getPaymentStatusLabel } from "@/lib/order-status-labels"

export { getPaymentMethodLabel, getPaymentStatusLabel }

/**
 * DÜZELTME (final inceleme) — admin'de "Sipariş Durumu" ve "Ödeme Durumu"
 * yan yana sütunlarda gösteriliyor; `OrderStatus.PAYMENT_PENDING`in etiketi
 * ("Ödeme Bekleniyor") ile `PaymentStatus.PENDING`in `getPaymentStatusLabel`
 * etiketi ("Ödeme bekleniyor") neredeyse birebir aynı metin — iki komşu
 * sütunda FARKLI anlam taşıyan bu benzerlik gerçek bir okuma hatası riski
 * (team-lead bulgusu). `lib/order-status-labels.ts` storefront'la PAYLAŞILAN
 * bir dosya (sipariş başarı sayfası da kullanıyor) — orada DEĞİŞTİRİLMEDİ,
 * yalnızca admin'in görüntüleme katmanında PENDING için ayrışan bir etiket
 * kullanılıyor. Enum değeri ve iş mantığı DOKUNULMADI, yalnızca metin.
 */
export function getAdminPaymentStatusLabel(status: string): string {
  if (status === "PENDING") return "Beklemede"
  return getPaymentStatusLabel(status)
}

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
