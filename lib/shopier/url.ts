/**
 * Shopier satış URL'i doğrulayıcı — VIDEO 09 / D030.
 *
 * D030 gereği Shopier bu projede checkout'un İÇİNDEKİ bir ödeme sağlayıcısı
 * DEĞİL, ayrı bir kartlı satış kanalıdır: ürün detayındaki "Shopier'den Satın
 * Al" CTA'sı, admin'in girdiği bir Shopier ürün sayfasına yönlendirir. Yani
 * bu alan, sitemizin ziyaretçisini DIŞARI çıkaran bir bağlantıdır — ve
 * doğrulanmadan kaydedilen böyle bir alan doğrudan bir **open redirect /
 * link injection** yüzeyidir: paneli ele geçiren (veya yanlışlıkla kopyala-
 * yapıştır yapan) biri müşteriyi sahte bir ödeme sayfasına gönderebilir.
 * Bu yüzden doğrulama bilinçli olarak AŞIRI KATIDIR: şüpheli olanı reddetmek,
 * kabul edip sonra temizlemeye çalışmaktan her zaman güvenlidir.
 *
 * DOĞRULANMIŞ BİLGİ SINIRI (D010): Bu dosya Shopier hakkında YALNIZCA gerçek
 * Shopier panelinde bizzat gözlemlenmiş iki public satış URL biçimini bilir —
 * başka hiçbir şey varsayılmamıştır:
 *
 *   1. KISA/KANONİK biçim — `shopier.com/<sayısal-id>`
 *      (panelin "Satıştaki Ürünler" listesinin gösterdiği biçim; canlı olarak
 *      tarayıcıda açılıp ürün sayfasını doğru açtığı doğrulandı).
 *   2. SATICI SLUG'LI biçim — `shopier.com/<satıcı-slug>/<sayısal-id>`
 *      (ürün oluşturma başarı ekranının verdiği link).
 *
 * İkisi de AYNI ürüne işaret eder. Bu yüzden ikisini de KABUL EDİYORUZ ama
 * her zaman KISA biçime KANONİKLEŞTİRİYORUZ: aksi halde aynı Shopier ürünü
 * iki farklı string olarak saklanabilir ve `Product.shopierProductId`
 * üzerindeki `@unique` kısıtı fiilen ATLATILMIŞ olurdu (iki farklı Product
 * aynı ürüne bağlanırdı). Kanonikleştirme, o DB garantisinin uygulama
 * katmanındaki karşılığıdır.
 *
 * Shopier'in API'si, webhook'u, checkout entegrasyonu veya BAŞKA herhangi bir
 * URL biçimi hakkında bu dosya HİÇBİR ŞEY VARSAYMAZ. Üçüncü bir yol segmenti
 * içeren ya da başka şekilde kurulmuş bir Shopier adresi, ancak GERÇEK
 * panelde gözlemlendikten sonra buraya eklenmelidir.
 *
 * NEDEN `endsWith` KULLANILMIYOR: Host kontrolü için yaygın ama HATALI bir
 * kalıp `hostname.endsWith("shopier.com")`'dur. Bu kontrol
 * `evil-shopier.com`'u (saldırganın kendi domain'i, sonu "shopier.com" ile
 * bitiyor) kabul eder. Tersi yöndeki `startsWith`/`includes` kalıpları da
 * `shopier.com.evil.com`'u kabul eder. Tek güvenli yöntem, küçük harfe
 * indirgenmiş `hostname`'in kapalı bir allowlist'te TAM EŞLEŞMESİDİR — bu,
 * unicode/punycode ile benzeştirilmiş host'ları (ör. Kiril "ѕ" ile yazılmış
 * `ѕhopier.com`, `new URL` tarafından `xn--...` punycode'una çevrilir) de
 * otomatik olarak dışarıda bırakır, ayrıca bir homograph kontrolü gerekmez.
 *
 * CLIENT-SAFE: Bu dosya bilinçli olarak SIFIR bağımlılıklıdır — ne Prisma,
 * ne `next`, ne Zod. Admin formu bunu client-taraflı anlık doğrulama için
 * doğrudan import edebilir (`lib/commerce/checkout-schema.ts`'teki aynı
 * disiplin). Asıl doğrulama her zaman sunucu tarafında TEKRAR yapılır —
 * client doğrulaması hiçbir zaman tek güvence değildir.
 */

/**
 * İzin verilen host'ların KAPALI listesi. Tam eşleşme ile karşılaştırılır
 * (bkz. dosya başındaki `endsWith` notu). Yeni bir host eklemek, gerçek
 * Shopier panelinde doğrulanmış bir gözleme dayanmalıdır (D010).
 */
export const SHOPIER_ALLOWED_HOSTS: readonly string[] = ["shopier.com", "www.shopier.com"]

/**
 * Kanonik biçimde kullanılan host. Kullanıcı `shopier.com` yazsa bile
 * kaydettiğimiz değer tek bir biçime indirgenir — böylece aynı Shopier ürünü
 * iki farklı string olarak iki kez kaydedilemez (`Product.shopierProductId`
 * üzerindeki `@unique` kısıtının uygulama katmanındaki karşılığı).
 */
const SHOPIER_CANONICAL_HOST = "www.shopier.com"

/**
 * KISA/KANONİK biçim: `/50918034`. Shopier ürün id'si yalnızca rakamdır.
 * Alt/üst sınır (4-12), hem tek haneli saçma değerleri (`/1`) hem de
 * sınırsız uzunlukta bir yol parçasını dışarıda bırakmak için — gözlenen
 * gerçek örnekler 8 hanelidir (`50917961`, `50917990`, `50918034`).
 */
const SHOPIER_SHORT_PATH_PATTERN = /^\/(\d{4,12})$/

/**
 * SATICI SLUG'LI biçim: `/efegorkemumit/50918034`. Slug karakter kümesi
 * bilinçli olarak DAR tutuldu (`A-Za-z0-9._-`) — yüzde-kodlaması (`%2e`),
 * boşluk, eğik çizgi gibi her şey dışarıda kalır, böylece üçüncü bir segment
 * veya kaçış denemesi bu kalıba hiç uymaz.
 */
const SHOPIER_SELLER_PATH_PATTERN = /^\/([A-Za-z0-9._-]{1,64})\/(\d{4,12})$/

export type ShopierUrlErrorCode =
  | "EMPTY"
  | "MALFORMED"
  | "INSECURE_SCHEME"
  | "DISALLOWED_HOST"
  | "UNSUPPORTED_PATH"

export type ShopierUrlValidationResult =
  | { ok: true; url: string; productId: string }
  | { ok: false; code: ShopierUrlErrorCode; message: string }

function failure(code: ShopierUrlErrorCode, message: string): ShopierUrlValidationResult {
  return { ok: false, code, message }
}

/**
 * Doğrulanmış iki yol biçiminden ürün id'sini çıkarır; hiçbirine uymuyorsa
 * `null` döner.
 *
 * Satıcı slug'ı okunup ATILIR — kanonik çıktıya hiç girmez (bkz. dosya
 * başlığındaki kanonikleştirme gerekçesi).
 *
 * Slug'ın `.` veya `..` olması ayrıca reddedilir. Pratikte buraya ulaşmaları
 * beklenmez: `new URL` nokta segmentlerini — yüzde-kodlu hâllerini (`%2e%2e`)
 * bile — kendisi çözer, yani `/%2e%2e/50918034` biz görmeden `/50918034`'e
 * indirgenir ve zaten kanonik kısa biçim olarak kabul edilir (sonuç güvenli).
 * Bu kontrol, savunmayı TEK bir ayrıştırıcının normalizasyon davranışına
 * bağlı bırakmamak içindir — path-traversal'a benzeyen bir değeri "satıcı
 * slug'ı" diye kabul etmiyoruz.
 */
function extractProductId(pathname: string): string | null {
  const shortMatch = SHOPIER_SHORT_PATH_PATTERN.exec(pathname)
  if (shortMatch) return shortMatch[1]

  const sellerMatch = SHOPIER_SELLER_PATH_PATTERN.exec(pathname)
  if (sellerMatch) {
    const sellerSlug = sellerMatch[1]
    if (sellerSlug === "." || sellerSlug === "..") return null
    return sellerMatch[2]
  }

  return null
}

/**
 * Bir Shopier satış URL'ini doğrular ve kanonik biçimine indirger.
 *
 * Hata mesajları Türkçedir (D002) ve admin'e OLDUĞU GİBİ gösterilebilir —
 * hiçbir teknik/iç detay (stack, ham girdi, regex) sızdırmazlar.
 *
 * @param raw Admin formundan gelen ham değer. Bilinçli olarak `unknown` —
 *   çağıran tarafın önceden bir tip kontrolü yapmış olması BEKLENMEZ.
 */
export function validateShopierUrl(raw: unknown): ShopierUrlValidationResult {
  if (typeof raw !== "string") {
    return failure("EMPTY", "Shopier bağlantısı zorunludur.")
  }

  const trimmed = raw.trim()
  if (trimmed.length === 0) {
    return failure("EMPTY", "Shopier bağlantısı zorunludur.")
  }

  let parsed: URL
  try {
    // Bilinçli olarak `base` parametresi VERİLMEZ: göreli/şemasız bir değer
    // (`www.shopier.com/50918034`, `//www.shopier.com/50918034`) burada
    // ayrıştırılamaz ve MALFORMED olarak reddedilir. Bir base vermek, bu tür
    // girdileri sessizce "kendi sitemize göre çözmek" anlamına gelirdi — bu
    // da doğrulamayı zayıflatan, yanlış pozitif üreten bir kolaylık olurdu.
    parsed = new URL(trimmed)
  } catch {
    return failure(
      "MALFORMED",
      "Geçerli bir bağlantı girin. Adres `https://` ile başlamalıdır (ör. https://www.shopier.com/50918034)."
    )
  }

  if (parsed.protocol !== "https:") {
    // `http:` (şifresiz), `javascript:` (XSS), `data:` (içerik enjeksiyonu)
    // ve diğer tüm şemalar tek bir kuralla reddedilir — izinli şema listesi
    // TEK elemanlıdır, "zararlı şema" kara listesi tutmaya çalışmıyoruz.
    return failure("INSECURE_SCHEME", "Shopier bağlantısı `https://` ile başlamalıdır.")
  }

  if (parsed.username !== "" || parsed.password !== "") {
    // `https://www.shopier.com@evil.com/1` — userinfo bölümü, adresin
    // başında güvenilir bir host varmış gibi GÖRÜNMESİNİ sağlayan klasik bir
    // gizleme tekniğidir; gerçek host `evil.com`'dur. Kullanıcıya bunu
    // "host izinli değil" olarak bildiriyoruz, çünkü fiilen olan budur.
    return failure("DISALLOWED_HOST", "Bağlantı yalnızca shopier.com adresine ait olmalıdır.")
  }

  const hostname = parsed.hostname.toLowerCase()
  if (!SHOPIER_ALLOWED_HOSTS.includes(hostname)) {
    return failure("DISALLOWED_HOST", "Bağlantı yalnızca shopier.com adresine ait olmalıdır.")
  }

  if (parsed.port !== "") {
    // Standart dışı bir port, gerçek bir Shopier satış sayfası olamaz;
    // izinli bir host'a takılmış beklenmedik bir hedefe işaret eder.
    return failure("DISALLOWED_HOST", "Bağlantı yalnızca shopier.com adresine ait olmalıdır.")
  }

  if (parsed.search !== "" || parsed.hash !== "") {
    // Query string / fragment'i bilinçli olarak REDDEDİYORUZ (sessizce
    // temizlemiyoruz): bunlar hem izleme (tracking) parametreleri hem de
    // hedef sayfanın davranışını değiştirebilecek bir enjeksiyon yüzeyidir.
    // Gerekli olmayan hiçbir şeyi dışarıya taşımıyoruz.
    return failure("UNSUPPORTED_PATH", "Shopier bağlantısı `https://www.shopier.com/50918034` biçiminde olmalıdır.")
  }

  // İki DOĞRULANMIŞ biçim (bkz. dosya başlığı). Üçüncü bir segment içeren
  // hiçbir yol bu iki kalıba uymaz, dolayısıyla otomatik olarak reddedilir.
  const productId = extractProductId(parsed.pathname)
  if (productId === null) {
    return failure("UNSUPPORTED_PATH", "Shopier bağlantısı `https://www.shopier.com/50918034` biçiminde olmalıdır.")
  }

  // KANONİK biçim: girdi `shopier.com` ile de gelse her zaman tek bir
  // biçimde saklanır. Ham girdi hiçbir zaman olduğu gibi kaydedilmez —
  // kaydedilen değer, bu fonksiyonun kendi ürettiği güvenli string'tir.
  return { ok: true, url: `https://${SHOPIER_CANONICAL_HOST}/${productId}`, productId }
}
