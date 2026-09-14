/**
 * Ürün görseli yükleme/silme/sıralama — admin auth guard'lı ince katman.
 * Depolama nesnesinin kendisi `lib/storage/**`'a aittir (bu dosya onu
 * ENJEKTE EDİLEBİLİR bir parametre olarak alır, modül seviyesinde
 * sabitlemez — Wave A ek talebiyle tutarlı).
 */
import type { PrismaClient } from "../generated/prisma/client"
import { prisma } from "../prisma"
import { requireAdmin } from "../auth"
import {
  getStorageAdapter,
  generateStorageKey,
  reorderProductImages as reorderProductImagesCore,
  setMainProductImage as setMainProductImageCore,
  type StorageAdapter,
} from "../storage"
import { isUniqueConstraintViolation } from "../commerce"
import { validateImageUpload } from "./image-validation"
import { uploadProductImageMetaSchema } from "./schemas"
import { genericAdminError } from "./errors"
import type { AdminProductImageDto } from "./products"

export interface UploadProductImageInput {
  productId: string
  alt: string
  fileBuffer: Buffer
}

export type UploadProductImageErrorCode = "INVALID_INPUT" | "INVALID_IMAGE" | "PRODUCT_NOT_FOUND" | "STORAGE_FAILURE" | "UNKNOWN_ERROR"
export type UploadProductImageResult =
  | { success: true; image: AdminProductImageDto }
  | { success: false; error: { code: UploadProductImageErrorCode; message: string } }

const MAX_SORT_ORDER_RETRY_ATTEMPTS = 3

export async function uploadProductImage(
  input: UploadProductImageInput,
  client: PrismaClient = prisma,
  adapter: StorageAdapter = getStorageAdapter()
): Promise<UploadProductImageResult> {
  await requireAdmin(client)

  const parsedMeta = uploadProductImageMetaSchema.safeParse({ productId: input.productId, alt: input.alt })
  if (!parsedMeta.success) {
    return { success: false, error: { code: "INVALID_INPUT", message: parsedMeta.error.issues[0]?.message ?? "Geçersiz girdi." } }
  }

  // MIME, client'ın bildirdiği `Content-Type`'a DEĞİL, gerçek dosya
  // imzasına (magic bytes) göre tespit edilir — bkz. `image-validation.ts`.
  const validation = validateImageUpload(input.fileBuffer)
  if (!validation.ok || !validation.mimeType) {
    return { success: false, error: { code: "INVALID_IMAGE", message: validation.reason ?? "Geçersiz görsel." } }
  }

  const product = await client.product.findUnique({ where: { id: parsedMeta.data.productId }, select: { id: true } })
  if (!product) {
    return { success: false, error: { code: "PRODUCT_NOT_FOUND", message: "Ürün bulunamadı." } }
  }

  // Key sunucu tarafında, kriptografik olarak rastgele üretilir — kullanıcının
  // dosya adı ASLA path olarak kullanılmaz.
  const storageKey = generateStorageKey(validation.mimeType)

  let uploadedUrl: string
  try {
    const result = await adapter.put(storageKey, input.fileBuffer, validation.mimeType)
    uploadedUrl = result.url
  } catch {
    return { success: false, error: { code: "STORAGE_FAILURE", message: "Görsel depolamaya yazılamadı. Lütfen tekrar deneyin." } }
  }

  try {
    const image = await createImageRowWithRetry(client, {
      productId: parsedMeta.data.productId,
      url: uploadedUrl,
      alt: parsedMeta.data.alt,
      storageKey,
    })
    return {
      success: true,
      image: { id: image.id, url: image.url, alt: image.alt, isPlaceholder: image.isPlaceholder, sortOrder: image.sortOrder },
    }
  } catch {
    // DB satırı yazılamadı — storage'a az önce yazılan nesneyi YETİM
    // bırakmamak için best-effort temizlik dene (başarısız olsa da DB
    // hatasının kendisini GİZLEMEYİZ, yine de tanımlı bir kod dönülür).
    try {
      await adapter.delete(storageKey)
    } catch {
      // best-effort — burada da sessizce yutulur, kullanıcıya zaten
      // STORAGE_FAILURE/UNKNOWN_ERROR döneceğiz.
    }
    return { success: false, error: genericAdminError() }
  }
}

async function createImageRowWithRetry(
  client: PrismaClient,
  data: { productId: string; url: string; alt: string; storageKey: string }
) {
  for (let attempt = 0; attempt < MAX_SORT_ORDER_RETRY_ATTEMPTS; attempt++) {
    const aggregate = await client.productImage.aggregate({ where: { productId: data.productId }, _max: { sortOrder: true } })
    const nextSortOrder = (aggregate._max.sortOrder ?? -1) + 1
    try {
      return await client.productImage.create({ data: { ...data, isPlaceholder: false, sortOrder: nextSortOrder } })
    } catch (error) {
      const isSortOrderRace = isUniqueConstraintViolation(error, "sortOrder")
      if (isSortOrderRace && attempt < MAX_SORT_ORDER_RETRY_ATTEMPTS - 1) continue
      throw error
    }
  }
  throw new Error("createImageRowWithRetry: beklenmeyen döngü sonu")
}

export type DeleteProductImageResult = { success: true } | { success: false; error: { code: "IMAGE_NOT_FOUND" | "UNKNOWN_ERROR"; message: string } }

/**
 * DB satırını VE (koşullu olarak) storage nesnesini siler.
 *
 * BİLİNÇLİ SIRALAMA/DAVRANIŞ (görev talimatının "ne yaptığını belirle ve
 * raporla" isteği): DB satırı ÖNCE silinir; storage nesnesinin silinmesi
 * SONRA denenir ve best-effort'tur. Bir geçici storage arızası admin'in bir
 * görseli DB'den kaldırmasını KALICI OLARAK ENGELLEMEMELİDİR — bu yüzden
 * storage silme başarısız olursa hata DÖNDÜRÜLMEZ, sessizce yutulur ve
 * storage'da (nadiren) yetim bir nesne kalabilir. Bu, "DB'yi storage'ın
 * erişilebilirliğine bağımlı kılmama" tercihidir; alternatif (storage-önce)
 * tercih edilmedi çünkü geçici bir ağ hatasını admin'in DB temizliğini
 * engelleyen kalıcı bir hataya çevirirdi.
 *
 * Aynı `storageKey`'i başka bir `ProductImage` satırı kullanıyorsa (ör. test
 * fixture'ları veya ileride eklenebilecek bir "görseli başka üründe de
 * kullan" özelliği) storage nesnesi SİLİNMEZ — hâlâ referanslı bir nesneyi
 * silmek diğer satırı bozardı.
 */
/**
 * IDOR düzeltmesi (security bulgusu — C-2): `productId` ZORUNLU bir
 * parametredir (opsiyonel BIRAKILMADI — bilinçli tercih: opsiyonel bir
 * parametre, çağıranın unutmasıyla guard'ı sessizce devre dışı bırakırdı, ki
 * düzeltmeye çalıştığımız sınıftan bir hata tam olarak bu olurdu). Hem
 * `findUnique` hem `delete` çağrısı `id`+`productId` birlikte doğrular; ürün
 * A'nın ekranından ürün B'ye ait bir `imageId` gönderilirse `IMAGE_NOT_FOUND`
 * döner, hiçbir satır etkilenmez.
 */
export async function deleteProductImage(
  imageId: string,
  productId: string,
  client: PrismaClient = prisma,
  adapter: StorageAdapter = getStorageAdapter()
): Promise<DeleteProductImageResult> {
  await requireAdmin(client)

  const image = await client.productImage.findUnique({ where: { id: imageId, productId } })
  if (!image) {
    return { success: false, error: { code: "IMAGE_NOT_FOUND", message: "Görsel bulunamadı." } }
  }

  try {
    await client.productImage.delete({ where: { id: imageId, productId } })
  } catch {
    return { success: false, error: genericAdminError() }
  }

  if (image.storageKey) {
    const stillReferenced = await client.productImage.findFirst({ where: { storageKey: image.storageKey } })
    if (!stillReferenced) {
      try {
        await adapter.delete(image.storageKey)
      } catch {
        // best-effort — bkz. yukarıdaki fonksiyon yorumu.
      }
    }
  }

  return { success: true }
}

export type ReorderProductImagesResult = { success: true } | { success: false; error: { code: "INVALID_INPUT" | "UNKNOWN_ERROR"; message: string } }

export async function reorderProductImagesAsAdmin(
  productId: string,
  orderedImageIds: string[],
  client: PrismaClient = prisma
): Promise<ReorderProductImagesResult> {
  await requireAdmin(client)
  try {
    await reorderProductImagesCore(productId, orderedImageIds, client)
    return { success: true }
  } catch {
    return {
      success: false,
      error: { code: "INVALID_INPUT", message: "Görsel sırası güncellenemedi; gönderilen liste ürünün mevcut görselleriyle eşleşmiyor." },
    }
  }
}

export async function setMainProductImageAsAdmin(
  productId: string,
  imageId: string,
  client: PrismaClient = prisma
): Promise<ReorderProductImagesResult> {
  await requireAdmin(client)
  try {
    await setMainProductImageCore(productId, imageId, client)
    return { success: true }
  } catch {
    return { success: false, error: { code: "INVALID_INPUT", message: "Ana görsel ayarlanamadı; görsel bu ürüne ait olmayabilir." } }
  }
}
