/**
 * İsimden URL slug'ı türetme — Türkçe karakterleri ASCII'ye doğru şekilde
 * transliterasyon eder. Saf fonksiyon, DB'ye dokunmaz.
 *
 * BİLİNÇLİ TASARIM (görev talimatı gereği): bu fonksiyon yalnızca bir
 * ÖNERİ üretir; benzersizliği GARANTİ ETMEZ ve DB'ye önceden bir "bu slug
 * müsait mi" sorgusu ATMAZ (önce SELECT edip sonra INSERT etmek bir yarış
 * koşulu taşır — Video 06'daki idempotency dersiyle aynı). Asıl garanti
 * `Category.slug`/`Collection.slug`/`Product.slug`'daki DB `@unique`
 * kısıtıdır; çakışma olursa çağıran katman (`lib/admin/products.ts` vb.)
 * `P2002`'yi yakalayıp admin'e "bu slug zaten kullanılıyor" der, admin slug'ı
 * elle değiştirir.
 */

/** Türkçe alfabesinin ASCII'de karşılığı olmayan TÜM harfleri (küçük/büyük) — eksiksiz liste. */
const TURKISH_CHAR_MAP: Record<string, string> = {
  ç: "c",
  Ç: "c",
  ğ: "g",
  Ğ: "g",
  ı: "i",
  I: "i",
  İ: "i",
  ö: "o",
  Ö: "o",
  ş: "s",
  Ş: "s",
  ü: "u",
  Ü: "u",
}

export function slugifyTurkish(input: string): string {
  // Türkçe'ye özgü harfler yukarıdaki tabloyla EKSİKSİZ karşılanır; bu
  // yüzden ayrıca bir Unicode normalize/aksan-temizleme adımına gerek YOKTUR
  // (ve böyle bir adım, kaynak dosyada görünmez/kırılgan combining-mark
  // karakterleri barındırma riski taşırdı — bilinçli olarak eklenmedi).
  const transliterated = Array.from(input)
    .map((char) => TURKISH_CHAR_MAP[char] ?? char)
    .join("")

  return transliterated
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}
