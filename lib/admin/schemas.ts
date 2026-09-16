/**
 * Admin mutasyon girdilerinin Zod şeması. CLIENT-SAFE: `checkout-schema.ts`/
 * `lib/auth/schemas.ts` deseniyle tutarlı — Prisma'yı DEĞİL, yalnızca
 * `../generated/prisma/enums`'ı (sıfır bağımlılıklı) içe aktarır, bu yüzden
 * admin formları client-taraflı ön doğrulama için bunları DOĞRUDAN
 * (`lib/admin/index.ts` barrel'ı ÜZERİNDEN DEĞİL) import edebilir.
 *
 * Fiyat alanı bilinçli olarak STRING'tir (`z.number()` DEĞİL) — JSON'da bir
 * `number` olarak taşınan para tutarı float hassasiyeti riski taşır (Video
 * 06'nın Decimal kuralı); string, `Prisma.Decimal`'a servis katmanında
 * güvenle çevrilir.
 */
import { z } from "zod"
import { ProductStatus, OrderStatus, PaymentMethod, PaymentStatus } from "../generated/prisma/enums"

const decimalPriceSchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, "Geçerli bir fiyat girin (ör. 450.00).")

const nonEmptyString = (label: string) => z.string().min(1, `${label} zorunludur.`)

export const productStatusSchema = z.enum([ProductStatus.DRAFT, ProductStatus.PUBLISHED, ProductStatus.ARCHIVED], {
  message: "Geçerli bir ürün durumu seçin.",
})

export const createProductSchema = z.object({
  name: nonEmptyString("Ürün adı"),
  /** Boş bırakılırsa serviste isimden otomatik türetilir. */
  slug: z.string().trim().optional(),
  description: z.string().optional(),
  careInfo: z.string().optional(),
  giftPackagingAvailable: z.boolean().optional().default(false),
  status: productStatusSchema.optional().default(ProductStatus.DRAFT),
  categoryId: nonEmptyString("Kategori"),
  collectionIds: z.array(z.string()).optional().default([]),
})
export type CreateProductInput = z.infer<typeof createProductSchema>

export const updateProductSchema = createProductSchema.extend({
  id: nonEmptyString("Ürün id"),
  slug: nonEmptyString("Slug"),
})
export type UpdateProductInput = z.infer<typeof updateProductSchema>

export const createCategorySchema = z.object({
  name: nonEmptyString("Kategori adı"),
  slug: z.string().trim().optional(),
  description: z.string().optional(),
})
export type CreateCategoryInput = z.infer<typeof createCategorySchema>

export const updateCategorySchema = createCategorySchema.extend({
  id: nonEmptyString("Kategori id"),
  slug: nonEmptyString("Slug"),
})
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>

export const createCollectionSchema = z.object({
  name: nonEmptyString("Koleksiyon adı"),
  slug: z.string().trim().optional(),
  description: z.string().optional(),
})
export type CreateCollectionInput = z.infer<typeof createCollectionSchema>

export const updateCollectionSchema = createCollectionSchema.extend({
  id: nonEmptyString("Koleksiyon id"),
  slug: nonEmptyString("Slug"),
})
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>

export const createAttributeDefinitionSchema = z.object({
  key: z
    .string()
    .min(1, "Öznitelik anahtarı zorunludur.")
    .regex(/^[a-zA-Z][a-zA-Z0-9]*$/, "Öznitelik anahtarı yalnızca harf/rakamdan oluşan bir tanımlayıcı olmalıdır (ör. tasTuru)."),
  label: nonEmptyString("Öznitelik etiketi"),
})
export type CreateAttributeDefinitionInput = z.infer<typeof createAttributeDefinitionSchema>

export const createAttributeValueSchema = z.object({
  attributeDefinitionId: nonEmptyString("Öznitelik tipi"),
  value: nonEmptyString("Değer"),
})
export type CreateAttributeValueInput = z.infer<typeof createAttributeValueSchema>

export const attributeSelectionSchema = z.object({
  attributeDefinitionId: nonEmptyString("Öznitelik tipi"),
  attributeValueId: nonEmptyString("Öznitelik değeri"),
})

export const createVariantSchema = z.object({
  productId: nonEmptyString("Ürün"),
  sku: nonEmptyString("SKU"),
  price: decimalPriceSchema,
  stockQuantity: z.number().int("Stok adedi tam sayı olmalıdır.").min(0, "Stok adedi negatif olamaz."),
  /** D020 — yalnızca SEÇİLEBİLİR öznitelikler; her tip için tek değer (bkz. `@@id` kısıtı). */
  selectableAttributes: z.array(attributeSelectionSchema).optional().default([]),
})
export type CreateVariantInput = z.infer<typeof createVariantSchema>

export const updateVariantSchema = z.object({
  id: nonEmptyString("Varyant id"),
  // IDOR düzeltmesi (security bulgusu): `productId` ZORUNLU — sorgu bununla
  // BİRLİKTE `id`'ye karşı doğrulanır, yalnızca `id` ile bulunup mutasyon
  // yapılmaz (bkz. `lib/admin/variants.ts` → `updateVariant`).
  productId: nonEmptyString("Ürün id"),
  sku: nonEmptyString("SKU"),
  price: decimalPriceSchema,
})
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>

export const updateVariantStockSchema = z.object({
  variantId: nonEmptyString("Varyant id"),
  // IDOR düzeltmesi — aynı gerekçe (bkz. `updateVariantSchema`).
  productId: nonEmptyString("Ürün id"),
  stockQuantity: z.number().int("Stok adedi tam sayı olmalıdır.").min(0, "Stok adedi negatif olamaz."),
})
export type UpdateVariantStockInput = z.infer<typeof updateVariantStockSchema>

export const createDescriptiveAttributeSchema = z.object({
  productId: nonEmptyString("Ürün"),
  attributeDefinitionId: nonEmptyString("Öznitelik tipi"),
  attributeValueId: nonEmptyString("Öznitelik değeri"),
})
export type CreateDescriptiveAttributeInput = z.infer<typeof createDescriptiveAttributeSchema>

export const uploadProductImageMetaSchema = z.object({
  productId: nonEmptyString("Ürün"),
  alt: nonEmptyString("Görsel açıklaması (alt metni)"),
})
export type UploadProductImageMetaInput = z.infer<typeof uploadProductImageMetaSchema>

export const orderStatusSchema = z.enum(
  [
    OrderStatus.PAYMENT_PENDING,
    OrderStatus.PREPARING,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED,
    OrderStatus.RETURNED,
  ],
  { message: "Geçerli bir sipariş durumu seçin." }
)

export const updateOrderStatusSchema = z.object({
  orderId: nonEmptyString("Sipariş id"),
  targetStatus: orderStatusSchema,
  /** Yalnızca SHIPPED'e geçişte anlamlıdır; diğer geçişlerde yoksayılır. */
  shippingCarrier: z.string().trim().optional(),
  trackingNumber: z.string().trim().optional(),
})
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>

export const orderListFilterSchema = z.object({
  orderNumber: z.string().trim().optional(),
  orderStatus: orderStatusSchema.optional(),
  paymentMethod: z.enum([PaymentMethod.SHOPIER, PaymentMethod.BANK_TRANSFER]).optional(),
  /**
   * VIDEO 09 — admin havale kuyruğunun temeli: `paymentMethod=BANK_TRANSFER`
   * + `paymentStatus=PENDING` filtresi, D007'deki manuel ödeme onayının
   * çalışma listesini verir. Yalnızca FİLTREdir; `paymentStatus` bu şemayla
   * DEĞİŞTİRİLEMEZ (bkz. `updateOrderStatusSchema`'nın üstündeki not).
   */
  paymentStatus: z.enum([PaymentStatus.PENDING, PaymentStatus.CONFIRMED, PaymentStatus.FAILED]).optional(),
})
export type OrderListFilterInput = z.infer<typeof orderListFilterSchema>

// ---------------------------------------------------------------------------
// VIDEO 09 / D030 — Shopier bağlantı yönetimi
// ---------------------------------------------------------------------------

/**
 * Bir ürünü, Shopier'de kayıtlı satış sayfasına bağlar veya bağlantıyı
 * kaldırır. D030: Shopier artık checkout içindeki bir ödeme sağlayıcısı
 * değil, AYRI bir kartlı satış kanalıdır — bu yüzden bağlantı ürün
 * seviyesinde bir alan olarak yönetilir.
 */
export const updateProductShopierLinkSchema = z.object({
  // Proje konvansiyonu: sahiplik/ebeveyn kontrolü yapan her serviste scoping
  // id ZORUNLUDUR (bkz. `updateVariantSchema`'daki `productId` notu).
  productId: nonEmptyString("Ürün id"),
  /** Boş string = bağlantıyı KALDIR (hem url hem productId `null` olur). */
  shopierUrl: z.string().trim(),
})
export type UpdateProductShopierLinkInput = z.infer<typeof updateProductShopierLinkSchema>

/**
 * Ödeme onayı/reddi girdisi (bkz. `lib/admin/payments.ts`). Bilinçli olarak
 * YALNIZCA `orderId` taşır: hedef ödeme durumu (CONFIRMED/FAILED) client'tan
 * GELMEZ, hangi fonksiyonun çağrıldığından belli olur. Böylece client, bir
 * alan değiştirerek siparişi keyfi bir ödeme durumuna sokamaz —
 * `updateOrderStatusSchema`'nın `paymentStatus`'u bilinçli olarak dışarıda
 * bırakmasıyla (bkz. `lib/admin/orders.ts` başlığı, D026) aynı disiplin.
 */
export const orderPaymentActionSchema = z.object({
  orderId: nonEmptyString("Sipariş id"),
})
export type OrderPaymentActionInput = z.infer<typeof orderPaymentActionSchema>
