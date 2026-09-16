/**
 * Checkout girdi kontratının Zod şeması — `docs/ARCHITECTURE.md` §4.1
 * (Storefront → Commerce Kontratı, D022 patch'i sonrası) ile BİREBİR aynı
 * alan setini tanımlar.
 *
 * KRİTİK: Bu şemada bilinçli olarak YER ALMAYAN alanlar: fiyat, toplam tutar,
 * stok/availability, ürün adı. §4.1'deki "Kritik ilke" gereği bunlar
 * client'tan asla kabul edilmez — sunucu yalnızca `variantId`+`quantity`
 * kullanıp geri kalan her şeyi kendi veritabanından yeniden çözer/hesaplar.
 *
 * CLIENT-SAFE: Bu dosya BİLİNÇLİ OLARAK `../generated/prisma/enums`'tan
 * import eder, `../generated/prisma/client`'tan DEĞİL — ikincisi Prisma
 * runtime'ını (dolayısıyla `pg`'nin Node-only `net`/`tls` bağımlılıklarını)
 * içe aktarır (bkz. `catalog.ts`/`catalog-display.ts` ayrımındaki aynı
 * sorun). `enums.ts` sıfır bağımlılıklı, saf bir modüldür — bu yüzden
 * `checkoutInputSchema`, storefront'un checkout formunda CLIENT-TARAFLI ön
 * doğrulama için de güvenle import edilebilir (Server Action'a göndermeden
 * önce anlık form doğrulaması gibi).
 *
 * TÜRKÇE HATA MESAJLARI (D002): Her alanın kendi Türkçe mesajı vardır —
 * qa'nın bulduğu gibi, mesajsız bırakılan alanlar Zod'un varsayılan İngilizce
 * mesajlarını üretiyordu (ör. "Too small: expected string to have >=1
 * characters") ve bu, storefront'un `FormField`'ı tarafından OLDUĞU GİBİ
 * (`issue.message`) kullanıcıya gösteriliyordu. `variantId`/`quantity`/
 * `orderIdempotencyKey` gibi müşterinin doğrudan doldurmadığı iç alanlara da
 * (savunma amaçlı, hiçbir zaman normal koşulda tetiklenmemesi beklenir)
 * Türkçe mesaj eklendi — tutarlılık için.
 */
import { z } from "zod"
import { PaymentMethod } from "../generated/prisma/enums"

const checkoutItemSchema = z.object({
  variantId: z.string().min(1, "Geçersiz ürün seçimi."),
  quantity: z.number().int("Adet tam sayı olmalıdır.").positive("Adet en az 1 olmalıdır."),
})

export const checkoutInputSchema = z.object({
  items: z.array(checkoutItemSchema).min(1, "Sepet boş olamaz."),
  orderIdempotencyKey: z.string().min(1, "Geçersiz sipariş oturumu. Lütfen sayfayı yenileyin."),
  contact: z.object({
    fullName: z.string().min(1, "Ad soyad zorunludur."),
    phone: z.string().min(1, "Telefon numarası zorunludur."),
    // Tek bir kontrol/mesaj yeterli — boş string de format kontrolünü zaten
    // geçemez, ayrı bir `.min(1, ...)` eklemek aynı alan için iki ayrı issue
    // (dolayısıyla olası çift mesaj gösterimi) üretirdi.
    email: z.string().email("Geçerli bir e-posta adresi girin."),
  }),
  deliveryAddress: z.object({
    addressLine: z.string().min(1, "Adres zorunludur."),
    city: z.string().min(1, "Şehir zorunludur."),
    district: z.string().min(1, "İlçe zorunludur."),
    postalCode: z.string().min(1, "Posta kodu zorunludur."),
    // D001 — MVP yalnızca Türkiye pazarına satış yapıyor; başka bir ülke
    // değeri kabul edilmez (yeni bir proje kararı değil, D001'in doğal
    // uygulama-katmanı sonucu).
    country: z.literal("TR", { message: "Şu anda yalnızca Türkiye'ye gönderim yapılmaktadır." }),
  }),
  giftPackagingSelected: z.boolean().optional().default(false),
  // D030 — bu checkout akışı YALNIZCA Havale/EFT'e hizmet eder.
  //
  // D006'nın iki ödeme yöntemi (Shopier + Havale/EFT) hâlâ geçerlidir; ama
  // D030 ile Shopier artık bizim checkout'umuzun İÇİNDEKİ bir ödeme
  // sağlayıcısı DEĞİL, AYRI bir kartlı satış kanalıdır (ürün detayındaki
  // "Shopier'den Satın Al" CTA'sı müşteriyi Shopier'in kendi satış
  // sayfasına götürür — bkz. `lib/shopier/url.ts`). Shopier'den geçen bir
  // satışın bizim Order tablomuzda karşılığı OLUŞMAZ.
  //
  // Bu yüzden şema burada tek bir değeri kabul eder. `PaymentMethod` Prisma
  // enum'unda `SHOPIER` GERİYE UYUMLULUK İÇİN DURUR (D030 öncesinde
  // oluşturulmuş Order kayıtları ve migration geçmişi bozulmasın diye) —
  // ama yeni bir checkout isteği artık asla SHOPIER bir sipariş üretemez:
  // client ne gönderirse göndersin, bu literal doğrulamasını geçemez.
  paymentMethod: z.literal(PaymentMethod.BANK_TRANSFER, {
    message: "Şu anda yalnızca Havale / EFT ile ödeme yapılabilmektedir.",
  }),
})

export type CheckoutInput = z.infer<typeof checkoutInputSchema>
export type CheckoutItemInput = z.infer<typeof checkoutItemSchema>
