/**
 * Public sipariş sorgulama formunun Zod şeması (D015 + D031).
 *
 * CLIENT-SAFE: yalnızca `zod` import edilir (Prisma/`next` YOK) —
 * `checkout-schema.ts` ile aynı disiplin, sorgulama formu client-taraflı ön
 * doğrulama için bunu DOĞRUDAN import edebilir. Sunucu (`./order-lookup.ts`)
 * aynı şemayı yeniden çalıştırır, client sonucuna asla güvenmez.
 */
import { z } from "zod"

export const orderLookupSchema = z.object({
  orderNumber: z
    .string()
    .trim()
    .min(1, "Sipariş numarası zorunludur.")
    .max(64, "Sipariş numarası en fazla 64 karakter olabilir."),
  /**
   * D015'in "ek doğrulama" gereksiniminin somut alanı: siparişteki e-posta
   * (D031). Sipariş numarası TEK BAŞINA yeterli değildir.
   */
  email: z.string().trim().email("Geçerli bir e-posta adresi girin."),
})

export type OrderLookupInput = z.infer<typeof orderLookupSchema>
