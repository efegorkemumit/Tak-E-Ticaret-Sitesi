/**
 * Parola hash'leme — `@node-rs/argon2` (native Argon2id) kullanır.
 *
 * NEDEN `@node-rs/argon2`: Görev talimatı önce bunu denememizi, Windows'ta
 * native build/kurulum başarısız olursa saf-JS `bcryptjs`'e düşmemizi
 * söylüyordu. Bu geliştirme makinesinde (Windows, Node 22) kurulum ve
 * gerçek hash/verify çağrısı DOĞRULANDI (bkz. Wave A raporu) — native build
 * sorunsuz çalıştığı için `bcryptjs`'e düşülmedi. Argon2id ayrıca OWASP'ın
 * güncel parola hash'leme önerisidir (bcrypt'ten daha modern, GPU/ASIC
 * kırma saldırılarına karşı daha dirençli).
 */
/**
 * NOT: bu dosya BİLİNÇLİ OLARAK `server-only` paketini KULLANMAZ (Wave A'nın
 * ilk halinde vardı, qa'nın test edilebilirlik talebiyle kaldırıldı) — o
 * paket, Next.js'in kendi webpack loader'ı DIŞINDA (ör. Vitest/Vite altında)
 * çağrıldığında HER ZAMAN fırlatacak şekilde tasarlanmıştır, bu da onu
 * `lib/commerce`'in zaten kullandığı test kurulumuyla UYUMSUZ kılar. Koruma,
 * `@node-rs/argon2`'nin native/Node-only olmasından doğal olarak gelir —
 * `lib/commerce/catalog.ts`'in `pg`'ye bağımlı olup client bundle'a
 * giremediği desenle aynı.
 */
import { hash, verify } from "@node-rs/argon2"

/**
 * Gerçek bir kullanıcıya ait OLMAYAN, sabit ve geçerli formatta bir Argon2id
 * hash'i. TEK amacı: `login.ts`'te "e-posta bulunamadı" durumunda da bir
 * hash doğrulaması ÇALIŞTIRMAK, böylece yanıt süresi hesabın var olup
 * olmadığını sızdırmasın (timing-based e-posta enumeration'ı önleme).
 * Bu hash'in kendisi bir secret DEĞİLDİR — yalnızca CPU-maliyeti eşdeğer bir
 * referans doğrulamasıdır.
 */
const DUMMY_PASSWORD_HASH =
  "$argon2id$v=19$m=19456,t=2,p=1$Px8nTQvRP3ACp5nrIxU2QA$wTKVhEOHP5TMkalhFw0oB6K7h3TthH7P+J+s3HyJKFY"

export async function hashPassword(plainPassword: string): Promise<string> {
  return hash(plainPassword)
}

/**
 * `hashedPassword` bozuk/beklenmedik bir formatta olsa bile (ör. veri
 * bozulması) fırlatmaz — yalnızca "eşleşmedi" (false) döner. Bir hash
 * doğrulama hatasının caller'a sızması hem gereksiz bir bilgi sızıntısı hem
 * de kullanıcıya (özellikle admin login akışında) ham bir hata mesajı
 * gösterilmesi riski taşır.
 */
export async function verifyPassword(hashedPassword: string, plainPassword: string): Promise<boolean> {
  try {
    return await verify(hashedPassword, plainPassword)
  } catch {
    return false
  }
}

/**
 * Kullanıcı bulunamadığında bile çağrılması gereken, sonucu KULLANILMAYAN
 * doğrulama. Gerçek bir hash doğrulamasıyla eşdeğer CPU süresi tüketir,
 * böylece "kullanıcı var + parola yanlış" ile "kullanıcı hiç yok" yanıt
 * süreleri birbirinden ayırt edilemez (bkz. `login.ts`).
 */
export async function runTimingSafeDummyVerify(plainPassword: string): Promise<void> {
  await verifyPassword(DUMMY_PASSWORD_HASH, plainPassword)
}
