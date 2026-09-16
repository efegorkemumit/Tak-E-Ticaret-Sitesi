"use server"

/**
 * VIDEO 09 — public sipariş sorgulamanın SUNUCU SINIRI.
 *
 * Bu dosya bilinçli olarak İNCE bir sarmalayıcıdır: doğrulama, arama, hata
 * mesajı üretimi ve hangi alanların döneceği (PII sınırı) tamamen
 * `lib/commerce/order-lookup.ts`'in işidir. Projenin kuralı gereği Next
 * runtime'ına bağlı katman (Server Action) ile saf/DI-dostu çekirdek ayrılır —
 * iş mantığı BURAYA taşınmaz, aksi halde çekirdek test edilemez hâle gelir ve
 * ikinci bir doğruluk kaynağı oluşur.
 *
 * `rawInput` bilerek `unknown`: client'tan gelen hiçbir şey güvenilir kabul
 * edilmez, tipi de dahil (client-side `safeParse` yalnızca UX içindir).
 *
 * -------------------------------------------------------------------------
 * IP BAZLI HIZ SINIRI (security incelemesi N1) — NEDEN ÇEKİRDEKTE DEĞİL,
 * BURADA:
 *
 * `lookupOrder`'ın kendi içinde zaten bir hız sınırı var, ama anahtarı
 * SİPARİŞ NUMARASI — yani "tek bir siparişe karşı e-posta deneme" saldırısını
 * durdurur. Her istekte FARKLI bir sipariş numarası deneyen bir saldırgan o
 * anahtara hiç takılmaz; kimliksiz ve her çağrıda bir DB sorgusu yapan bu
 * uç nokta böylece sınırsız biçimde dövülebilirdi (asıl risk veri sızıntısı
 * değil — sipariş numarası uzayı bunun için fazlasıyla geniş — DoS/DB yükü).
 *
 * Bu sınır çekirdeğe KONULAMAZ: `lookupOrder` bilinçli olarak bir istek
 * nesnesi görmez (saf, DI-dostu ve Vitest'ten Next runtime'ı olmadan
 * çağrılabilir kalmalıdır). İsteği gerçekten gören tek katman burasıdır, bu
 * yüzden IP sınırı buraya aittir — `lib/commerce/order-lookup.ts` içindeki
 * `TODO (route/action katmanı)` notunun karşılığı budur.
 *
 * İkinci bir limiter YAZILMADI: `lib/auth/rate-limit.ts` (admin login için
 * yazılmıştı) anahtarı serbest string olduğu için olduğu gibi yeniden
 * kullanılır; anahtar `order-lookup-ip:` ad alanıyla öneklenir, böylece ne
 * admin login sayaçlarıyla ne de çekirdeğin `order-lookup:` sayaçlarıyla
 * çakışır.
 *
 * MESAJ FARKI (bilinçli): Çekirdekteki sipariş-numarası bazlı limit, limite
 * takıldığında jenerik "bulunamadı" döner — çünkü "bu numara için çok
 * denediniz" demek, o numaranın denenmeye değer (yani var) olduğunu sızdıran
 * bir yan kanaldır. IP bazlı limit ise yalnızca isteği YAPANIN kendi istek
 * hacmi hakkında bilgi verir, hiçbir siparişin varlığını açığa çıkarmaz —
 * bu yüzden burada dürüst ve anlaşılır bir mesaj göstermek hem güvenlidir
 * hem de meşru müşteriyi yanıltmaz.
 */
import { lookupOrder, RATE_LIMITED_MESSAGE, type OrderLookupResult } from "@/lib/commerce/order-lookup"
import { getClientIp } from "@/lib/auth/client-ip"
import { isRateLimited, recordFailedAttempt, clearRateLimit } from "@/lib/auth/rate-limit"

function ipRateLimitKey(ip: string): string {
  return `order-lookup-ip:${ip}`
}

export async function lookupOrderAction(rawInput: unknown): Promise<OrderLookupResult> {
  const key = ipRateLimitKey(await getClientIp())

  if (isRateLimited(key)) {
    return { success: false, error: { code: "RATE_LIMITED", message: RATE_LIMITED_MESSAGE } }
  }

  const result = await lookupOrder(rawInput)

  if (result.success) {
    // Başarılı sorgulama sayacı sıfırlar — aynı IP'den sipariş sorgulayan
    // meşru bir müşteri (ör. paylaşılan bir ofis/mobil operatör IP'si
    // arkasındaki biri) önceki başarısız denemeler yüzünden kilitlenmez.
    clearRateLimit(key)
  } else {
    // Yalnızca BAŞARISIZ denemeler sayılır; geçersiz girdi de dahildir,
    // çünkü otomatik bir deneme aracı kolayca geçersiz girdi de üretebilir.
    recordFailedAttempt(key)
  }

  return result
}
