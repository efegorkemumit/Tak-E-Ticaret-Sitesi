/**
 * IBAN normalizasyonu ve TR IBAN doğrulaması.
 *
 * CLIENT-SAFE: Yalnızca saf TypeScript — hiçbir Prisma/`next`/Node-only
 * import'u YOKTUR. NEDEN: admin ayar formu (client component) kullanıcı
 * yazarken anlık doğrulama/gösterim yapabilsin diye (bkz.
 * `lib/admin/schemas.ts`'teki aynı disiplin). Sunucu tarafı bu
 * fonksiyonların sonucuna GÜVENMEZ, `schemas.ts` üzerinden AYNI kontrolleri
 * kendisi yeniden çalıştırır — client doğrulaması yalnızca kullanıcı
 * deneyimi içindir.
 */

/** IBAN'ın kanonik biçimi: tüm boşluklar silinir, harfler BÜYÜK harfe çevrilir. */
export function normalizeIban(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase()
}

/**
 * Normalize edilmiş bir girdinin geçerli bir TR IBAN'ı olup olmadığını
 * söyler. İKİ kontrol birden yapılır:
 *  1. Biçim: `TR` + 24 rakam (Türkiye IBAN uzunluğu her zaman 26 karakterdir).
 *  2. ISO 13616 mod-97 sağlama toplamı == 1.
 *
 * NEDEN sağlama toplamı da kontrol ediliyor: yalnızca biçim kontrolü, tek
 * haneli bir yazım hatasını (ör. bir rakamın yanlış girilmesi) yakalayamaz —
 * ve bu, müşterinin parayı YANLIŞ BİR HESABA göndermesi demektir. IBAN
 * standardı tam olarak bu tür yazım hatalarını yakalamak için tasarlanmıştır.
 */
export function isValidTrIban(value: string): boolean {
  if (!/^TR\d{24}$/.test(value)) return false
  return computeMod97(value) === 1
}

/**
 * Gösterim biçimi: 4'lü gruplar hâlinde boşlukla ayrılmış
 * (ör. "TR12 3456 7890 1234 5678 9012 34"). Müşteri ekranda IBAN'ı
 * gözle kontrol ederken gruplu biçim çok daha okunaklıdır; DB'de ise her
 * zaman kanonik (boşluksuz) biçim saklanır.
 */
export function formatIbanForDisplay(normalized: string): string {
  return normalized.replace(/(.{4})/g, "$1 ").trim()
}

/**
 * ISO 13616 mod-97: ilk 4 karakter sona taşınır, her harf iki haneli bir
 * sayıya çevrilir (A=10 ... Z=35), ortaya çıkan çok uzun sayının 97'ye
 * bölümünden kalan hesaplanır.
 *
 * NEDEN `BigInt` DEĞİL / NEDEN döngü: projede ekstra bağımlılık istenmiyor
 * ve sayı `Number.MAX_SAFE_INTEGER`'ı kat kat aşıyor. Bu yüzden kalan,
 * basamak basamak ilerleyen klasik "uzun bölme" yöntemiyle alınır —
 * `(kalan * 10 + basamak) % 97` her adımda küçük bir sayı olarak kalır,
 * dolayısıyla hiçbir taşma riski yoktur.
 */
function computeMod97(iban: string): number {
  const rearranged = iban.slice(4) + iban.slice(0, 4)

  let remainder = 0
  for (const character of rearranged) {
    // Harfleri iki haneli sayıya açıp basamaklarını tek tek işliyoruz;
    // rakamlar zaten tek basamaktır.
    const numeric = /\d/.test(character)
      ? character
      : String(character.charCodeAt(0) - 55) // "A".charCodeAt(0) === 65 → 65 - 55 = 10

    for (const digit of numeric) {
      remainder = (remainder * 10 + Number(digit)) % 97
    }
  }

  return remainder
}
