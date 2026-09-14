/**
 * Oturum token üretimi/hash'lenmesi.
 *
 * Tasarım notu (neden ayrı bir "oturum imza secret'ı" env değişkeni YOK):
 * bu proje bir imzalı JWT/iron-session yaklaşımı DEĞİL, sunucu tarafında
 * saklanan (DB-backed) opak bir oturum token'ı kullanır — bkz. `session.ts`.
 * Token'ın kendisi `crypto.randomBytes(32)` ile üretilen 256 bit rastgele
 * veridir; tahmin edilemezliği bir HMAC anahtarına değil, bu rastgeleliğe
 * dayanır. DB'ye yalnızca SHA-256 hash'i yazılır (bkz. `AdminSession.tokenHash`
 * — `docs/DECISIONS.md` D025), böylece DB'yi okuyabilen biri tek başına
 * geçerli bir oturumu ele geçiremez. Bu yaklaşım hem daha basittir (imzalama
 * anahtarı rotasyonu/kaçırılma riski yoktur) hem de görev talimatındaki
 * "logout gerçek bir iptal yapabilmeli" gereksinimini doğal olarak karşılar
 * (imzalı bir JWT'nin aksine, DB'deki satır silinene/`revokedAt` yazılana
 * kadar token geçerli kalmaz).
 */
import { randomBytes, createHash } from "node:crypto"

/** Client'a cookie olarak giden HAM token — DB'ye asla bu hâliyle yazılmaz. */
export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url")
}

/** DB'de saklanan/karşılaştırılan değer — ham token'dan tek yönlü türetilir. */
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}
