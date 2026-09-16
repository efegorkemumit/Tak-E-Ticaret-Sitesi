/**
 * Commerce domain sabitleri — büyülü sayıların (magic numbers) kod içinde
 * dağınık olmasını önlemek için tek bir yerde toplanır.
 */

/**
 * D018 — sipariş oluşturulduğu anda rezerve edilen stoğun kaç saat sonra
 * (ödeme hâlâ onaylanmamışsa) serbest bırakılacağı varsayılan süre.
 *
 * VIDEO 09 GÜNCELLEMESİ: D018'in öngördüğü panel ayarı ARTIK VAR
 * (`SiteSettings.reservationWindowHours` — bkz. `lib/settings/service.ts` →
 * `getReservationWindowHours`). Bu sabit artık "panel ayarı eklenene kadar
 * geçici" DEĞİLDİR: ayar satırı HİÇ YOKSA (henüz kurulmamış bir sistemde)
 * kullanılan FALLBACK değerdir. `create-order.ts` her siparişte önce ayarı
 * okur, ayar yoksa bu değere düşer — böylece sipariş oluşturma, ayar
 * girilmemiş bir sistemde de çalışmaya devam eder.
 *
 * Değer BİLİNÇLİ OLARAK `lib/settings/constants.ts`'ten re-export edilir,
 * `24` ikinci kez yazılmaz: iki ayrı yerde tutulan aynı sayı, ileride biri
 * değişip diğeri unutulduğunda sessiz bir tutarsızlık üretirdi.
 */
export { DEFAULT_RESERVATION_WINDOW_HOURS as RESERVATION_WINDOW_HOURS } from "../settings/constants"
