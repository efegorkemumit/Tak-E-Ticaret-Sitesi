/**
 * Admin auth girdi kontratlarının Zod şeması.
 *
 * CLIENT-SAFE: `lib/commerce/checkout-schema.ts`'teki desenle aynı gerekçeyle
 * bilinçli olarak sıfır bağımlılıklı tutulur (Prisma/DB/`server-only` importu
 * YOK) — admin login/kurulum formu bu şemayı Server Action'a göndermeden önce
 * client-taraflı anlık doğrulama için de güvenle import edebilir.
 *
 * Türkçe hata mesajları (D002) — qa'nın commerce checkout şemasında bulduğu
 * "mesajsız alan İngilizce Zod mesajı üretir" hatasından ders alınarak baştan
 * her alana Türkçe mesaj eklendi.
 */
import { z } from "zod"

export const loginInputSchema = z.object({
  email: z.string().min(1, "E-posta zorunludur.").email("Geçerli bir e-posta adresi girin."),
  password: z.string().min(1, "Parola zorunludur."),
})
export type LoginInput = z.infer<typeof loginInputSchema>

/**
 * Parola politikası — bilinçli olarak minimal (yalnızca minimum uzunluk).
 * Karma karakter zorunluluğu (büyük/küçük harf, rakam, sembol vb.) gibi ek
 * kurallar görev talimatındaki "aşırıya kaçma" sınırına aykırı olur; makul
 * bir uzunluk, marka için MVP admin parolası ihtiyacına yeterlidir.
 */
export const passwordPolicySchema = z.string().min(10, "Parola en az 10 karakter olmalıdır.")

export const setupInputSchema = z.object({
  email: z.string().min(1, "E-posta zorunludur.").email("Geçerli bir e-posta adresi girin."),
  password: passwordPolicySchema,
})
export type SetupInput = z.infer<typeof setupInputSchema>
