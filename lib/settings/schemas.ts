/**
 * Site ayarı mutasyonunun Zod şeması.
 *
 * CLIENT-SAFE: yalnızca `zod` + bu modülün kendi saf yardımcıları import
 * edilir (Prisma/`next` YOK) — `lib/admin/schemas.ts` ve
 * `lib/commerce/checkout-schema.ts` ile aynı disiplin. Admin ayar formu
 * client-taraflı ön doğrulama için bunu DOĞRUDAN import edebilir; sunucu
 * tarafı (`./service.ts`) aynı şemayı yeniden çalıştırır, client sonucuna
 * asla güvenmez.
 */
import { z } from "zod"
import { normalizeIban, isValidTrIban } from "./iban"
import { ORDER_NUMBER_PLACEHOLDER } from "./constants"

export const updateSiteSettingsSchema = z.object({
  bankName: z
    .string()
    .trim()
    .min(1, "Banka adı zorunludur.")
    .max(120, "Banka adı en fazla 120 karakter olabilir."),
  accountHolder: z
    .string()
    .trim()
    .min(1, "Hesap sahibi zorunludur.")
    .max(120, "Hesap sahibi en fazla 120 karakter olabilir."),
  /**
   * Önce KANONİKLEŞTİR, sonra doğrula. NEDEN bu sıra: kullanıcı IBAN'ı
   * neredeyse her zaman boşluklu ("TR12 3456 ...") yapıştırır; önce
   * doğrulayıp sonra normalize etseydik geçerli bir IBAN reddedilirdi.
   * Şemanın ÇIKTISI da kanonik biçimdir — DB'ye her zaman boşluksuz/büyük
   * harfli tek bir biçim yazılır.
   */
  iban: z
    .string()
    .transform(normalizeIban)
    .refine(isValidTrIban, "Geçerli bir TR IBAN girin (ör. TR00 0000 0000 0000 0000 0000 00)."),
  transferDescriptionTemplate: z
    .string()
    .trim()
    .min(1, "Açıklama şablonu zorunludur.")
    .max(140, "Açıklama şablonu en fazla 140 karakter olabilir.")
    // Yer tutucu olmadan her siparişin açıklaması AYNI olurdu ve havale
    // eşleştirmesi (D007 — manuel onay) imkânsız hâle gelirdi.
    .refine(
      (value) => value.includes(ORDER_NUMBER_PLACEHOLDER),
      `Açıklama şablonu "${ORDER_NUMBER_PLACEHOLDER}" yer tutucusunu içermelidir.`
    ),
  /**
   * D018 — havale siparişinin rezervasyonunun kaç saat tutulacağı. Üst sınır
   * 720 saat (30 gün): sınırsız bırakmak, rezerve stoğun süresiz birikmesi
   * (dolayısıyla satılabilir stoğun görünmez şekilde tükenmesi) demektir.
   */
  reservationWindowHours: z
    .number()
    .int("Bekleme süresi tam sayı olmalıdır.")
    .min(1, "Bekleme süresi en az 1 saat olmalıdır.")
    .max(720, "Bekleme süresi en fazla 720 saat (30 gün) olabilir."),
})

export type UpdateSiteSettingsInput = z.infer<typeof updateSiteSettingsSchema>
