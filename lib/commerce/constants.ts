/**
 * Commerce domain sabitleri — büyülü sayıların (magic numbers) kod içinde
 * dağınık olmasını önlemek için tek bir yerde toplanır.
 */

/**
 * D018 — sipariş oluşturulduğu anda rezerve edilen stoğun kaç saat sonra
 * (ödeme hâlâ onaylanmamışsa) serbest bırakılacağı varsayılan süre.
 *
 * D018'in kendisi bu değerin ileride panelden/site ayarlarından
 * değiştirilebilir olacağını öngörüyor — o admin ayarı bu turun kapsamında
 * DEĞİL, bu yüzden şimdilik sabit bir domain constant'ı olarak tutuluyor.
 * Panel ayarı eklendiğinde bu sabitin yerini bir DB'den okunan değer alacak,
 * çağıran kod (`create-order.ts`) değişmeyecek.
 */
export const RESERVATION_WINDOW_HOURS = 24
