"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import {
  createProduct,
  updateProduct,
  addDescriptiveAttributeToProduct,
  removeDescriptiveAttributeFromProduct,
  suggestVariantSku,
  createVariant,
  updateVariant,
  updateVariantStock,
  uploadProductImage,
  deleteProductImage,
  reorderProductImagesAsAdmin,
  setMainProductImageAsAdmin,
} from "@/lib/admin"
// VIDEO 09 — barrel (`@/lib/admin`) henüz bu fonksiyonu dışa açmıyor olabilir;
// doğrudan modülden import ediliyor (barrel yalnızca bir kolaylık katmanı).
import { updateProductShopierLink } from "@/lib/admin/products"

export interface AdminActionFailure {
  success: false
  error: { code: string; message: string }
}

// ---------------------------------------------------------------------------
// Ürün temel bilgileri
// ---------------------------------------------------------------------------

/** Yeni ürün formundan sonra admin doğrudan varyant/görsel ekleyebileceği düzenleme sayfasına yönlendirilir. */
export async function createProductAction(input: unknown): Promise<AdminActionFailure | undefined> {
  const result = await createProduct(input)
  if (!result.success) return result
  redirect(`/admin/products/${result.product.id}`)
}

export async function updateProductAction(input: unknown): Promise<AdminActionFailure | undefined> {
  const result = await updateProduct(input)
  if (!result.success) return result
  revalidatePath(`/admin/products/${result.product.id}`)
  revalidatePath("/admin/products")
}

// ---------------------------------------------------------------------------
// Shopier satış kanalı (D030) — ürünün temel bilgilerinden AYRI bir aksiyon:
// Shopier bağlantısı bir satış kanalı kararıdır, ürün içeriği değil.
// ---------------------------------------------------------------------------

/**
 * Boş `shopierUrl` = bağlantıyı KALDIR (bkz. `updateProductShopierLinkSchema`).
 *
 * Yalnızca admin sayfaları revalidate edilir: müşteri tarafındaki
 * `app/(storefront)/urun/[slug]` zaten `force-dynamic` olduğu için her
 * istekte güncel veriyi okur.
 */
export async function updateProductShopierLinkAction(
  input: unknown,
  productId: string
): Promise<AdminActionFailure | undefined> {
  const result = await updateProductShopierLink(input)
  if (!result.success) return result
  revalidatePath(`/admin/products/${productId}`)
}

// ---------------------------------------------------------------------------
// Açıklayıcı öznitelikler (D020 — ProductAttributeValue, çoklu)
// ---------------------------------------------------------------------------

export async function addDescriptiveAttributeAction(input: unknown): Promise<AdminActionFailure | undefined> {
  const result = await addDescriptiveAttributeToProduct(input)
  if (!result.success) return result
  const parsed = input as { productId?: string }
  if (parsed.productId) revalidatePath(`/admin/products/${parsed.productId}`)
}

export async function removeDescriptiveAttributeAction(
  productAttributeValueId: string,
  productId: string
): Promise<AdminActionFailure | undefined> {
  const result = await removeDescriptiveAttributeFromProduct(productAttributeValueId)
  if (!result.success) return result
  revalidatePath(`/admin/products/${productId}`)
}

// ---------------------------------------------------------------------------
// Varyant + stok (D019/D020/D027)
// ---------------------------------------------------------------------------

/** Yalnızca ÖN DOLDURMA önerisi — admin isterse SKU'yu elle değiştirebilir (bkz. `lib/admin/variants.ts`). */
export async function suggestVariantSkuAction(productId: string): Promise<string | null> {
  return suggestVariantSku(productId)
}

export async function createVariantAction(input: unknown): Promise<AdminActionFailure | undefined> {
  const result = await createVariant(input)
  if (!result.success) return result
  const parsed = input as { productId?: string }
  if (parsed.productId) revalidatePath(`/admin/products/${parsed.productId}`)
}

export async function updateVariantAction(input: unknown, productId: string): Promise<AdminActionFailure | undefined> {
  const result = await updateVariant(input)
  if (!result.success) return result
  revalidatePath(`/admin/products/${productId}`)
}

export async function updateVariantStockAction(input: unknown, productId: string): Promise<AdminActionFailure | undefined> {
  const result = await updateVariantStock(input)
  if (!result.success) return result
  revalidatePath(`/admin/products/${productId}`)
}

// ---------------------------------------------------------------------------
// Görseller (D024) — `uploadProductImageAction` `FormData` alır (dosya İÇEREN
// bir Server Action, `fileBuffer: Buffer`'ı JSON ile TAŞIYAMAZ).
// ---------------------------------------------------------------------------

export async function uploadProductImageAction(formData: FormData): Promise<AdminActionFailure | undefined> {
  const productId = String(formData.get("productId") ?? "")
  const alt = String(formData.get("alt") ?? "")
  const file = formData.get("file")

  if (!(file instanceof File)) {
    return { success: false, error: { code: "INVALID_INPUT", message: "Lütfen bir dosya seçin." } }
  }

  const fileBuffer = Buffer.from(await file.arrayBuffer())
  const result = await uploadProductImage({ productId, alt, fileBuffer })
  if (!result.success) return result
  revalidatePath(`/admin/products/${productId}`)
}

export async function deleteProductImageAction(imageId: string, productId: string): Promise<AdminActionFailure | undefined> {
  const result = await deleteProductImage(imageId, productId)
  if (!result.success) return result
  revalidatePath(`/admin/products/${productId}`)
}

export async function reorderProductImagesAction(productId: string, orderedImageIds: string[]): Promise<AdminActionFailure | undefined> {
  const result = await reorderProductImagesAsAdmin(productId, orderedImageIds)
  if (!result.success) return result
  revalidatePath(`/admin/products/${productId}`)
}

export async function setMainProductImageAction(productId: string, imageId: string): Promise<AdminActionFailure | undefined> {
  const result = await setMainProductImageAsAdmin(productId, imageId)
  if (!result.success) return result
  revalidatePath(`/admin/products/${productId}`)
}
