/**
 * Site ayarları (VIDEO 09) modülünün saf sabitleri.
 *
 * CLIENT-SAFE: Bu dosyanın hiçbir import'u yoktur — admin formu (client
 * component) `ORDER_NUMBER_PLACEHOLDER`'ı yardım metninde göstermek için
 * bunu doğrudan import edebilir.
 */

/**
 * `SiteSettings` tek satırlık (singleton) bir tablodur; `id` her zaman bu
 * sabit değeri alır. NEDEN: "hangi ayar satırı geçerli?" diye bir seçim
 * mantığı hiç doğmasın ve `upsert` doğal olarak idempotent olsun diye
 * (D017'nin ruhu — aynı işlem iki kez çalışsa da tek satır oluşur).
 */
export const SITE_SETTINGS_ID = "singleton"

/** Havale açıklaması şablonunun varsayılanı (şemadaki `@default` ile birebir aynı). */
export const DEFAULT_TRANSFER_DESCRIPTION_TEMPLATE = "Sipariş {orderNumber}"

/**
 * D018 — ayar satırı HİÇ YOKSA kullanılacak rezervasyon penceresi.
 * `lib/commerce/constants.ts`'teki `RESERVATION_WINDOW_HOURS` ile aynı
 * değerdir; commerce tarafı kendi sabitini kullanmaya devam eder (iki modül
 * arasında tek yönlü bağımlılık kalsın diye burada ikinci bir kopya
 * tutuluyor — bkz. `service.ts` → `getReservationWindowHours`).
 */
export const DEFAULT_RESERVATION_WINDOW_HOURS = 24

/** Havale açıklaması şablonunda sipariş numarasının geçtiği yer tutucu. */
export const ORDER_NUMBER_PLACEHOLDER = "{orderNumber}"
