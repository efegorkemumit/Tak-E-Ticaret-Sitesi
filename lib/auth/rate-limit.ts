/**
 * Basit brute-force koruması — bellek içi, kayan pencereli sayaç.
 *
 * BİLİNÇLİ SINIR: Redis/harici bir servis KURULMADI (görev talimatı
 * "over-engineering yapma" dedi). Bu, tek bir Node process'i içinde
 * çalıştığı sürece (bu projenin MVP dağıtım hedefi) yeterlidir; yatay
 * ölçeklenmiş (multi-instance) bir dağıtımda her instance kendi sayacını
 * tutar — bu bilinen ve kabul edilmiş bir sınırdır, MVP'nin ölçeğinde
 * pratik bir risk oluşturmaz.
 *
 * Bu dosya saf JS'tir (Node-only bir bağımlılığı yoktur), bu yüzden qa
 * bunu Vitest'ten hiçbir enjeksiyon gerekmeden doğrudan import edip test
 * edebilir — `server-only` paketi BİLİNÇLİ OLARAK kullanılmadı (bkz.
 * `password.ts`'teki aynı gerekçe notu).
 */

const WINDOW_MS = 15 * 60 * 1000 // 15 dakika
const MAX_ATTEMPTS_PER_WINDOW = 10

const attemptsByKey = new Map<string, number[]>()

export function buildRateLimitKey(ip: string, email: string): string {
  return `${ip}:${email.trim().toLowerCase()}`
}

/** Pencere içindeki deneme sayısı zaten limitteyse `true` döner (yeni deneme kaydetmez). */
export function isRateLimited(key: string): boolean {
  const now = Date.now()
  const recentAttempts = (attemptsByKey.get(key) ?? []).filter((timestamp) => now - timestamp < WINDOW_MS)
  attemptsByKey.set(key, recentAttempts)
  return recentAttempts.length >= MAX_ATTEMPTS_PER_WINDOW
}

/** Başarısız bir deneme kaydeder. Yalnızca gerçekten başarısız login denemelerinde çağrılmalıdır. */
export function recordFailedAttempt(key: string): void {
  const now = Date.now()
  const recentAttempts = attemptsByKey.get(key) ?? []
  recentAttempts.push(now)
  attemptsByKey.set(key, recentAttempts)
}

/** Başarılı login sonrası sayaç sıfırlanır — meşru kullanıcı bir sonraki denemede cezalandırılmaz. */
export function clearRateLimit(key: string): void {
  attemptsByKey.delete(key)
}
