import { describe, expect, it } from "vitest"
import { validateShopierUrl } from "../../lib/shopier/url"

/**
 * `lib/shopier/url.ts` SAF bir modüldür (sıfır bağımlılık, DB yok) — bu
 * yüzden bu dosya bilinçli olarak `resetCommerceTables()` ÇAĞIRMAZ ve
 * `testPrisma`'ya hiç dokunmaz. Paketin geri kalanı gerçek PostgreSQL'e karşı
 * çalışır; burada gerçek bir DB'nin doğrulayacağı hiçbir şey yoktur.
 *
 * Bu doğrulayıcı bir OPEN REDIRECT sınırıdır (bkz. kaynak dosyanın başlığı):
 * admin'in girdiği değer, müşteriyi sitemizden DIŞARI çıkaran bir bağlantıya
 * dönüşür. Bu yüzden testlerin ağırlığı "kabul edilenler"de değil,
 * REDDEDİLMESİ GEREKENLERDEdir — ve her red için yalnızca "reddedildi" değil,
 * DOĞRU `code` da doğrulanır (kod, admin'e gösterilen mesajı ve ileride
 * eklenebilecek davranışları belirler).
 */
describe("validateShopierUrl — kabul edilen biçimler (D030)", () => {
  it("kısa/kanonik biçimi kabul eder ve ürün id'sini çıkarır", () => {
    const result = validateShopierUrl("https://www.shopier.com/50918034")

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error("beklenmedik red")
    expect(result.url).toBe("https://www.shopier.com/50918034")
    expect(result.productId).toBe("50918034")
  })

  it("`www`'suz `shopier.com` host'unu kabul eder ama KANONİK `www` biçimine indirger", () => {
    const result = validateShopierUrl("https://shopier.com/50918034")

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error("beklenmedik red")
    // Kanonikleştirme, `Product.shopierProductId` üzerindeki `@unique` kısıtının
    // uygulama katmanındaki karşılığıdır: aynı Shopier ürünü iki farklı string
    // olarak saklanamamalıdır.
    expect(result.url).toBe("https://www.shopier.com/50918034")
    expect(result.productId).toBe("50918034")
  })

  it("satıcı slug'lı biçimi kabul eder, slug'ı ATAR ve kısa biçime indirger", () => {
    const result = validateShopierUrl("https://www.shopier.com/efegorkemumit/50918034")

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error("beklenmedik red")
    expect(result.productId).toBe("50918034")
    expect(result.url).toBe("https://www.shopier.com/50918034")
  })

  it("baştaki/sondaki boşlukları temizler (kopyala-yapıştır gerçekliği)", () => {
    const result = validateShopierUrl("  https://www.shopier.com/50918034  ")

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error("beklenmedik red")
    expect(result.url).toBe("https://www.shopier.com/50918034")
  })

  it("aynı ürünün iki farklı yazımı AYNI kanonik url'e indirgenir", () => {
    const short = validateShopierUrl("https://shopier.com/50918034")
    const withSlug = validateShopierUrl("https://www.shopier.com/efegorkemumit/50918034")

    if (!short.ok || !withSlug.ok) throw new Error("beklenmedik red")
    expect(short.url).toBe(withSlug.url)
    expect(short.productId).toBe(withSlug.productId)
  })
})

describe("validateShopierUrl — reddedilen girdiler", () => {
  /**
   * `[açıklama, girdi, beklenen code]`. Tablo biçimi bilinçli: her satır tek
   * bir saldırı/hata sınıfını temsil eder ve yeni bir vaka eklemek tek satırlık
   * bir değişikliktir.
   */
  const rejectedCases: Array<[string, unknown, string]> = [
    ["boş string", "", "EMPTY"],
    ["yalnızca boşluk", "   ", "EMPTY"],
    ["string olmayan girdi (null)", null, "EMPTY"],
    ["string olmayan girdi (number)", 50918034, "EMPTY"],

    ["şifresiz http", "http://www.shopier.com/50918034", "INSECURE_SCHEME"],
    ["javascript: şeması (XSS)", "javascript:alert(1)", "INSECURE_SCHEME"],
    ["data: şeması (içerik enjeksiyonu)", "data:text/html,<script>alert(1)</script>", "INSECURE_SCHEME"],

    ["şemasız adres", "www.shopier.com/50918034", "MALFORMED"],
    ["protokol-göreli adres", "//www.shopier.com/50918034", "MALFORMED"],

    ["userinfo ile gizlenmiş gerçek host", "https://www.shopier.com@evil.com/50918034", "DISALLOWED_HOST"],
    ["`endsWith` tuzağı — saldırgan domain'i", "https://evil-shopier.com/50918034", "DISALLOWED_HOST"],
    ["`startsWith`/`includes` tuzağı — alt domain hilesi", "https://shopier.com.evil.com/50918034", "DISALLOWED_HOST"],
    ["standart dışı port", "https://www.shopier.com:8443/50918034", "DISALLOWED_HOST"],
    // Kiril "ѕ" (U+0455) ile yazılmış homograph: `new URL` bunu punycode'a
    // (`xn--...`) çevirir, kapalı allowlist'te TAM EŞLEŞME aranınca otomatik
    // olarak elenir — ayrı bir homograph kontrolüne gerek kalmaz.
    ["punycode/homograph host", "https://ѕhopier.com/50918034", "DISALLOWED_HOST"],

    ["query string (tracking/enjeksiyon yüzeyi)", "https://www.shopier.com/50918034?utm=x", "UNSUPPORTED_PATH"],
    ["fragment", "https://www.shopier.com/50918034#frag", "UNSUPPORTED_PATH"],
    ["üçüncü yol segmenti", "https://www.shopier.com/a/b/50918034", "UNSUPPORTED_PATH"],
    ["sayısal olmayan ürün id'si", "https://www.shopier.com/abc", "UNSUPPORTED_PATH"],
    ["çok kısa ürün id'si", "https://www.shopier.com/1", "UNSUPPORTED_PATH"],
    ["kök adres (ürün yok)", "https://www.shopier.com/", "UNSUPPORTED_PATH"],
  ]

  it.each(rejectedCases)("%s reddedilir (%#)", (_label, input, expectedCode) => {
    const result = validateShopierUrl(input)

    expect(result.ok).toBe(false)
    if (result.ok) throw new Error("beklenmedik kabul")
    expect(result.code).toBe(expectedCode)
    // Mesaj admin'e OLDUĞU GİBİ gösterilir; dolu olmalı.
    expect(result.message.length).toBeGreaterThan(0)
  })

  it("hata mesajları girdiden TÜRETİLMEZ — aynı `code` her zaman AYNI sabit metni döndürür", () => {
    // Ham girdiyi yankılayan bir mesaj, panelde bir enjeksiyon/kafa karıştırma
    // yüzeyi olurdu. Bunu "mesaj girdiyi içermiyor" diye test etmek yanıltıcı
    // olur (sabit yardım metni `https://www.shopier.com/50918034` örneğini
    // zaten içeriyor ve bazı girdiler bu örneğin alt dizesidir). Gerçek
    // garanti şudur: mesaj girdiye göre DEĞİŞMEZ.
    const messagesByCode = new Map<string, Set<string>>()

    for (const [, input] of rejectedCases) {
      const result = validateShopierUrl(input)
      if (result.ok) throw new Error("beklenmedik kabul")
      const messages = messagesByCode.get(result.code) ?? new Set<string>()
      messages.add(result.message)
      messagesByCode.set(result.code, messages)
    }

    // Beş hata kodunun tamamı bu tabloda temsil ediliyor olmalı (yeni bir kod
    // eklenirse burada da bir vaka istenmiş olur).
    expect([...messagesByCode.keys()].sort()).toEqual([
      "DISALLOWED_HOST",
      "EMPTY",
      "INSECURE_SCHEME",
      "MALFORMED",
      "UNSUPPORTED_PATH",
    ])
    for (const [code, messages] of messagesByCode) {
      expect(`${code}: ${messages.size}`).toBe(`${code}: 1`)
    }
  })

  it("punycode host gerçekten allowlist dışında kalır (homograph regresyon kilidi)", () => {
    // Açıkça punycode yazılmış hâli de aynı şekilde reddedilmelidir — birinin
    // ileride allowlist'e `xn--` bir host eklemesi bu testi düşürür.
    const result = validateShopierUrl("https://xn--hopier-l0e.com/50918034")

    expect(result.ok).toBe(false)
    if (result.ok) throw new Error("beklenmedik kabul")
    expect(result.code).toBe("DISALLOWED_HOST")
  })
})
