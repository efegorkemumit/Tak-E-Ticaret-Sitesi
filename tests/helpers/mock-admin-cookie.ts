/**
 * `lib/auth/session.ts`'teki `getCurrentAdmin`/`requireAdmin`/`createSession`/
 * `revokeCurrentSession` — ve dolayısıyla TÜM `lib/admin/*` fonksiyonları,
 * her biri `requireAdmin()`'i kendi içinde çağırdığı için — `next/headers`'ın
 * `cookies()`'ine bağımlıdır. `cookies()`, gerçek bir Next.js request context'i
 * (Server Component render'ı / Server Action / Route Handler) DIŞINDA
 * çağrıldığında fırlatır; bu da bu fonksiyonları Vitest'ten (hiçbir Next.js
 * runtime'ı olmadan) doğrudan çağırmayı imkânsız kılar.
 *
 * `lib/auth/session-core.ts` (issueSession/getSessionUser/revokeSession) zaten
 * cookie'den TAMAMEN bağımsızdır (qa'nın Wave A talebiyle tutarlı, commerce
 * bunu doğru kurmuş) — ama `lib/admin/*`'in kendisi hâlâ `requireAdmin()`
 * üzerinden cookie katmanına bağlı, çünkü her domain fonksiyonu TEK, paylaşılan
 * guard'ı (`requireAdmin`) çağırıyor (bu bilinçli ve doğru bir tasarım — bkz.
 * `lib/admin/index.ts` başlık yorumu, kopyala-yapıştır guard yazılmasın diye).
 *
 * ÇÖZÜM: `next/headers`'ı Vitest'in `vi.mock`'ıyla, gerçek bir `cookies()`
 * API'sini taklit eden ama bellek-içi bir `Map`'e okuyup yazan sahte bir
 * sürümle değiştiriyoruz. Bu, next/headers'ın KENDİSİNİ test etmez (zaten
 * Next.js'in sorumluluğu) — yalnızca `lib/admin`/`lib/auth`'un cookie'yi doğru
 * OKUDUĞUNU/SİLDİĞİNİ test edilebilir kılar. Cookie DEĞERİ her zaman GERÇEK
 * `issueSession()`'ın (session-core.ts, testPrisma ile) ürettiği bir token
 * olmalıdır — bu dosya kendi sahte bir token/oturum formatı UYDURMAZ.
 *
 * KULLANIM: Bu dosyayı `next/headers`'ı mock'lamaya ihtiyaç duyan HER test
 * dosyasının EN ÜSTÜNE (diğer importlardan önce) `import "../helpers/mock-admin-cookie"`
 * olarak ekleyin — Vitest `vi.mock` çağrılarını dosya başına HOISTED eder,
 * bu yüzden mock'un `lib/auth/session.ts`'in `next/headers` importundan ÖNCE
 * kayıtlı olması gerekir.
 */
import { vi } from "vitest"

const mockCookieStore = new Map<string, string>()

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (mockCookieStore.has(name) ? { name, value: mockCookieStore.get(name)! } : undefined),
    set: (name: string, value: string) => {
      mockCookieStore.set(name, value)
    },
    delete: (name: string) => {
      mockCookieStore.delete(name)
    },
  }),
}))

/** Testin "tarayıcısında" belirli bir admin_session cookie'si varmış gibi ayarlar. */
export function setMockAdminCookie(token: string): void {
  mockCookieStore.set("admin_session", token)
}

/** Testin "tarayıcısında" hiç cookie yokmuş gibi temizler (oturumsuz istek simülasyonu). */
export function clearMockAdminCookie(): void {
  mockCookieStore.clear()
}
