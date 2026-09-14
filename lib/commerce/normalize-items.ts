import type { CheckoutItemInput } from "./checkout-schema"

/**
 * Checkout girdisinde aynı `variantId` birden fazla kez geldiğinde
 * miktarları BİRLEŞTİRİR — reddetmez.
 *
 * Gerekçe (kararlaştırılan davranış, kodda açıkça belirtiliyor): aynı
 * varyantın iki ayrı satırda gelmesi büyük olasılıkla kötü niyetli bir
 * girişimden çok client-taraflı bir durum senkronizasyon hatasıdır (ör.
 * sepette aynı varyant iki ayrı satıra eklenmiş). Miktarları toplamak hiçbir
 * bilgi kaybetmez ve müşteri deneyimini gereksiz yere bozmaz — reddetmek
 * (sepeti tamamen iptal etmek) burada orantısız bir sert tepki olurdu.
 * Birleştirilmiş toplam miktar, normal şekilde aşağıdaki stok/miktar
 * doğrulamalarına tabidir; yani birleştirme hiçbir doğrulamayı atlamaz.
 */
export function mergeDuplicateItems(items: CheckoutItemInput[]): CheckoutItemInput[] {
  const quantityByVariantId = new Map<string, number>()

  for (const item of items) {
    quantityByVariantId.set(item.variantId, (quantityByVariantId.get(item.variantId) ?? 0) + item.quantity)
  }

  return Array.from(quantityByVariantId.entries()).map(([variantId, quantity]) => ({
    variantId,
    quantity,
  }))
}
