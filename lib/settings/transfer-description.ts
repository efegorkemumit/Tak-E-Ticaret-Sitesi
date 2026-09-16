/**
 * Havale açıklamasının şablondan üretilmesi. Saf ve CLIENT-SAFE — hem
 * sunucu (sipariş sorgulama, sipariş başarı ekranı) hem de admin formunun
 * canlı önizlemesi aynı fonksiyonu kullanır, iki farklı "açıklama" biçimi
 * ortaya çıkmasın diye.
 */
import { ORDER_NUMBER_PLACEHOLDER } from "./constants"

/**
 * Şablondaki `{orderNumber}` yer tutucusunun TÜM örneklerini sipariş
 * numarasıyla değiştirir.
 *
 * YER TUTUCU YOKSA şablon OLDUĞU GİBİ döner — sipariş numarasını sonuna
 * eklemeyiz. NEDEN: `updateSiteSettingsSchema` yer tutucuyu zaten ZORUNLU
 * kılıyor, dolayısıyla yer tutucusuz bir şablon ancak DB'ye başka bir yoldan
 * girmiş bozuk bir veridir. Burada sessizce "düzeltmek", admin'in ekranda
 * gördüğü açıklama ile müşterinin gördüğü açıklamanın farklı olmasına yol
 * açar ve bozuk ayarı görünmez kılar — havale eşleştirmesi tam olarak bu
 * açıklamaya dayandığı için sessiz düzeltme burada zararlıdır.
 */
export function renderTransferDescription(template: string, orderNumber: string): string {
  return template.split(ORDER_NUMBER_PLACEHOLDER).join(orderNumber)
}
