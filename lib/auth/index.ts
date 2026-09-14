/**
 * Admin auth modülünün dışa açtığı yüzey — görev talimatındaki isimlerle
 * BİREBİR aynı (`getCurrentAdmin`, `requireAdmin`, `createSession`,
 * `revokeCurrentSession`, `adminExists`).
 */
export {
  getCurrentAdmin,
  requireAdmin,
  createSession,
  revokeCurrentSession,
  setSessionCookie,
  ADMIN_SESSION_COOKIE_NAME,
} from "./session"
export type { AdminSessionUser } from "./session"

/**
 * Cookie/`next/headers`'a dokunmayan SAF oturum fonksiyonları — qa'nın
 * testable-by-design talebi (bkz. `./session-core.ts` başlık yorumu).
 * `loginAdmin`/`createFirstAdmin` başarı sonucundaki `session` alanını
 * cookie'ye yazmak için `setSessionCookie`'yi çağırmak, bunları invoke eden
 * `"use server"` action'ın işidir.
 */
export { issueSession, getSessionUser, revokeSession } from "./session-core"
export type { IssuedSession } from "./session-core"

export { adminExists, createFirstAdmin } from "./setup"
export type { CreateFirstAdminResult, SetupErrorCode } from "./setup"

export { loginAdmin } from "./login"
export type { LoginResult, LoginErrorCode } from "./login"

export { hashPassword, verifyPassword } from "./password"

export { AdminAuthRequiredError, SetupAlreadyCompletedError } from "./errors"

/**
 * BİLİNÇLİ OLARAK BU BARREL'DAN RE-EXPORT EDİLMEYEN: `./schemas` (Zod
 * şemaları). `lib/commerce/index.ts`'in aynı nedenle `checkout-schema.ts`'i
 * dışarıda bıraktığı desenle tutarlı — bu barrel'daki dosyaların çoğu
 * (`session.ts`/`login.ts`/`setup.ts`/`session-core.ts`) Prisma'yı (dolayısıyla
 * `pg`'nin Node-only bağımlılıklarını) içe aktardığı için client bundle'a
 * giremez; `schemas.ts` buradan re-export edilseydi bilinçli olarak
 * client-safe tutulan bir Zod şeması da dolaylı olarak client component'lerden
 * import edilemez hâle gelirdi. Admin login/kurulum formu client-taraflı ön
 * doğrulama için `./schemas`'ı DOĞRUDAN import etmelidir
 * (`checkout-schema.ts`'in storefront tarafından kullanılma biçimiyle aynı).
 */
