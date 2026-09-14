/**
 * Ürün oluşturma/düzenleme — hard delete YOK (D029), yaşam döngüsü yalnızca
 * `status` (DRAFT/PUBLISHED/ARCHIVED — D021) ile yönetilir. Bu dosyada bir
 * "silme" fonksiyonu bilinçli olarak YOKTUR.
 */
import type { Prisma, PrismaClient } from "../generated/prisma/client"
import { prisma } from "../prisma"
import { requireAdmin } from "../auth"
import { getAvailableQuantities, isUniqueConstraintViolation } from "../commerce"
import { slugifyTurkish } from "./slug"
import { createProductSchema, updateProductSchema, createDescriptiveAttributeSchema } from "./schemas"
import { isForeignKeyViolation, isRecordNotFoundError, genericAdminError } from "./errors"
import type { ProductStatus } from "../generated/prisma/enums"

// ---------------------------------------------------------------------------
// DTO'lar — serialize-safe (Decimal/Date asla ham dönmez).
// ---------------------------------------------------------------------------

export interface AdminAttributeSelectionDto {
  attributeDefinitionId: string
  type: string
  label: string
  attributeValueId: string
  value: string
}

/**
 * Açıklayıcı öznitelik satırı (D020 — `ProductAttributeValue`) —
 * `AdminAttributeSelectionDto`'dan farklı olarak kendi satır `id`'sini de
 * taşır. Bu, `AdminVariantDto.attributes` için KULLANILMAZ: `VariantAttributeValue`
 * bilinçli olarak bileşik bir birincil anahtara sahiptir
 * (`@@id([variantId, attributeDefinitionId])`), tekil bir `id` kolonu YOKTUR
 * — bu yüzden `id` iki kullanım arasında PAYLAŞILAN temel arayüze değil,
 * yalnızca gerçekten var olduğu bu türe eklenir.
 *
 * NEDEN GEREKLİ (storefront'un bulduğu gerçek eksiklik): `ProductAttributeValue`
 * üzerinde `(productId, attributeDefinitionId)` için bilinçli olarak unique
 * kısıt YOKTUR (D020 — bir ürün "Zirkon" ve "İnci"yi aynı anda taşıyabilir),
 * yani aynı tanım için birden fazla satır olabilir. Dolayısıyla
 * `removeDescriptiveAttributeFromProduct`'ın doğru satırı silebilmesi için
 * TEK güvenilir anahtar gerçek satır `id`'sidir — `(attributeDefinitionId,
 * attributeValueId)` çiftiyle silmeye çalışmak (unique olmadığı için) yanlış
 * satırı silebilirdi.
 */
export interface AdminDescriptiveAttributeDto extends AdminAttributeSelectionDto {
  id: string
}

export interface AdminVariantDto {
  id: string
  sku: string
  price: string
  stockQuantity: number
  reservedQuantity: number
  availableQuantity: number
  attributes: AdminAttributeSelectionDto[]
}

export interface AdminProductImageDto {
  id: string
  url: string
  alt: string
  isPlaceholder: boolean
  sortOrder: number
}

export interface AdminProductListItemDto {
  id: string
  slug: string
  name: string
  status: ProductStatus
  categoryName: string
  variantCount: number
  createdAt: string
}

export interface AdminProductDetailDto {
  id: string
  slug: string
  name: string
  description: string | null
  careInfo: string | null
  giftPackagingAvailable: boolean
  status: ProductStatus
  categoryId: string
  categoryName: string
  collectionIds: string[]
  images: AdminProductImageDto[]
  descriptiveAttributes: AdminDescriptiveAttributeDto[]
  variants: AdminVariantDto[]
  createdAt: string
  updatedAt: string
}

export type ProductMutationErrorCode = "INVALID_INPUT" | "SLUG_CONFLICT" | "CATEGORY_OR_COLLECTION_NOT_FOUND" | "PRODUCT_NOT_FOUND" | "UNKNOWN_ERROR"

export type ProductMutationResult =
  | { success: true; product: AdminProductDetailDto }
  | { success: false; error: { code: ProductMutationErrorCode; message: string } }

// ---------------------------------------------------------------------------
// Sorgu yardımcıları
// ---------------------------------------------------------------------------

const PRODUCT_ADMIN_INCLUDE = {
  category: true,
  collections: { include: { collection: true } },
  images: { orderBy: { sortOrder: "asc" } },
  descriptiveAttributes: { include: { attributeDefinition: true, attributeValue: true } },
  variants: {
    include: { attributeValues: { include: { attributeDefinition: true, attributeValue: true } } },
  },
} satisfies Prisma.ProductInclude

type AdminProductWithRelations = Prisma.ProductGetPayload<{ include: typeof PRODUCT_ADMIN_INCLUDE }>

/**
 * `availableQuantity`/`reservedQuantity` HER ZAMAN `lib/commerce/availability.ts`
 * → `getAvailableQuantities`'ten okunur — D018'in TEK paylaşılan formülünün
 * ikinci bir kopyası burada YAZILMAZ.
 */
async function mapProductToDetailDto(product: AdminProductWithRelations, client: PrismaClient): Promise<AdminProductDetailDto> {
  const availabilityByVariantId = await getAvailableQuantities(
    client,
    product.variants.map((variant) => variant.id)
  )

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    careInfo: product.careInfo,
    giftPackagingAvailable: product.giftPackagingAvailable,
    status: product.status,
    categoryId: product.categoryId,
    categoryName: product.category.name,
    collectionIds: product.collections.map((join) => join.collectionId),
    images: product.images.map((image) => ({
      id: image.id,
      url: image.url,
      alt: image.alt,
      isPlaceholder: image.isPlaceholder,
      sortOrder: image.sortOrder,
    })),
    descriptiveAttributes: product.descriptiveAttributes.map((entry) => ({
      id: entry.id,
      attributeDefinitionId: entry.attributeDefinitionId,
      type: entry.attributeDefinition.key,
      label: entry.attributeDefinition.label,
      attributeValueId: entry.attributeValueId,
      value: entry.attributeValue.value,
    })),
    variants: product.variants.map((variant) => {
      const availableQuantity = availabilityByVariantId.get(variant.id) ?? 0
      return {
        id: variant.id,
        sku: variant.sku,
        price: variant.price.toFixed(2),
        stockQuantity: variant.stockQuantity,
        reservedQuantity: variant.stockQuantity - availableQuantity,
        availableQuantity,
        attributes: variant.attributeValues.map((selection) => ({
          attributeDefinitionId: selection.attributeDefinitionId,
          type: selection.attributeDefinition.key,
          label: selection.attributeDefinition.label,
          attributeValueId: selection.attributeValueId,
          value: selection.attributeValue.value,
        })),
      }
    }),
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Okuma
// ---------------------------------------------------------------------------

/** Admin listesi TÜM durumları (DRAFT/PUBLISHED/ARCHIVED) gösterir — storefront'un aksine D021'in görünürlük filtresi burada UYGULANMAZ. */
export async function listProductsForAdmin(client: PrismaClient = prisma): Promise<AdminProductListItemDto[]> {
  await requireAdmin(client)
  const products = await client.product.findMany({
    include: { category: true, _count: { select: { variants: true } } },
    orderBy: { createdAt: "desc" },
  })
  return products.map((product) => ({
    id: product.id,
    slug: product.slug,
    name: product.name,
    status: product.status,
    categoryName: product.category.name,
    variantCount: product._count.variants,
    createdAt: product.createdAt.toISOString(),
  }))
}

export async function getProductForAdmin(id: string, client: PrismaClient = prisma): Promise<AdminProductDetailDto | null> {
  await requireAdmin(client)
  const product = await client.product.findUnique({ where: { id }, include: PRODUCT_ADMIN_INCLUDE })
  if (!product) return null
  return mapProductToDetailDto(product, client)
}

// ---------------------------------------------------------------------------
// Yazma
// ---------------------------------------------------------------------------

export async function createProduct(rawInput: unknown, client: PrismaClient = prisma): Promise<ProductMutationResult> {
  await requireAdmin(client)

  const parsed = createProductSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { success: false, error: { code: "INVALID_INPUT", message: parsed.error.issues[0]?.message ?? "Geçersiz girdi." } }
  }
  const input = parsed.data
  const slug = slugifyTurkish(input.slug && input.slug.length > 0 ? input.slug : input.name)
  if (!slug) {
    return { success: false, error: { code: "INVALID_INPUT", message: "Slug üretilemedi; lütfen ürün adını kontrol edin." } }
  }

  try {
    const product = await client.product.create({
      data: {
        name: input.name,
        slug,
        description: input.description || null,
        careInfo: input.careInfo || null,
        giftPackagingAvailable: input.giftPackagingAvailable,
        status: input.status,
        categoryId: input.categoryId,
        collections: { create: input.collectionIds.map((collectionId) => ({ collectionId })) },
      },
      include: PRODUCT_ADMIN_INCLUDE,
    })
    return { success: true, product: await mapProductToDetailDto(product, client) }
  } catch (error) {
    // Önce SELECT edip sonra INSERT etmek yarış koşulu taşır (Video 06
    // idempotency dersi) — bunun yerine dene, DB'nin `@unique` kısıtının
    // fırlattığı P2002'yi yakala.
    if (isUniqueConstraintViolation(error, "slug")) {
      return { success: false, error: { code: "SLUG_CONFLICT", message: `"${slug}" slug'ı zaten kullanılıyor. Lütfen farklı bir slug girin.` } }
    }
    if (isForeignKeyViolation(error)) {
      return { success: false, error: { code: "CATEGORY_OR_COLLECTION_NOT_FOUND", message: "Seçilen kategori veya koleksiyon bulunamadı." } }
    }
    return { success: false, error: genericAdminError() }
  }
}

export async function updateProduct(rawInput: unknown, client: PrismaClient = prisma): Promise<ProductMutationResult> {
  await requireAdmin(client)

  const parsed = updateProductSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { success: false, error: { code: "INVALID_INPUT", message: parsed.error.issues[0]?.message ?? "Geçersiz girdi." } }
  }
  const input = parsed.data
  const slug = slugifyTurkish(input.slug)
  if (!slug) {
    return { success: false, error: { code: "INVALID_INPUT", message: "Geçersiz slug." } }
  }

  try {
    const product = await client.product.update({
      where: { id: input.id },
      data: {
        name: input.name,
        slug,
        description: input.description || null,
        careInfo: input.careInfo || null,
        giftPackagingAvailable: input.giftPackagingAvailable,
        status: input.status,
        categoryId: input.categoryId,
        // Koleksiyon ilişkisi TAM DEĞİŞTİRME (replace-all) semantiğiyle
        // güncellenir — form her zaman güncel TAM listeyi gönderir.
        collections: { deleteMany: {}, create: input.collectionIds.map((collectionId) => ({ collectionId })) },
      },
      include: PRODUCT_ADMIN_INCLUDE,
    })
    return { success: true, product: await mapProductToDetailDto(product, client) }
  } catch (error) {
    if (isUniqueConstraintViolation(error, "slug")) {
      return { success: false, error: { code: "SLUG_CONFLICT", message: `"${slug}" slug'ı zaten kullanılıyor. Lütfen farklı bir slug girin.` } }
    }
    if (isRecordNotFoundError(error)) {
      return { success: false, error: { code: "PRODUCT_NOT_FOUND", message: "Ürün bulunamadı." } }
    }
    if (isForeignKeyViolation(error)) {
      return { success: false, error: { code: "CATEGORY_OR_COLLECTION_NOT_FOUND", message: "Seçilen kategori veya koleksiyon bulunamadı." } }
    }
    return { success: false, error: genericAdminError() }
  }
}

// ---------------------------------------------------------------------------
// Açıklayıcı öznitelikler (D020 — ProductAttributeValue, ÇOKLU, varyant
// seçimi DEĞİL). Bir değerin aynı ürüne birden fazla kez eklenmesi bilinçli
// olarak ENGELLENMEZ — şemada bu ikili için unique kısıt YOK (D020'nin
// kendisi).
// ---------------------------------------------------------------------------

export type AddDescriptiveAttributeResult =
  | { success: true; attribute: AdminDescriptiveAttributeDto }
  | { success: false; error: { code: "INVALID_INPUT" | "PRODUCT_OR_ATTRIBUTE_NOT_FOUND" | "UNKNOWN_ERROR"; message: string } }

export async function addDescriptiveAttributeToProduct(
  rawInput: unknown,
  client: PrismaClient = prisma
): Promise<AddDescriptiveAttributeResult> {
  await requireAdmin(client)
  const parsed = createDescriptiveAttributeSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { success: false, error: { code: "INVALID_INPUT", message: parsed.error.issues[0]?.message ?? "Geçersiz girdi." } }
  }
  try {
    const entry = await client.productAttributeValue.create({
      data: parsed.data,
      include: { attributeDefinition: true, attributeValue: true },
    })
    return {
      success: true,
      attribute: {
        id: entry.id,
        attributeDefinitionId: entry.attributeDefinitionId,
        type: entry.attributeDefinition.key,
        label: entry.attributeDefinition.label,
        attributeValueId: entry.attributeValueId,
        value: entry.attributeValue.value,
      },
    }
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      return { success: false, error: { code: "PRODUCT_OR_ATTRIBUTE_NOT_FOUND", message: "Ürün veya öznitelik değeri bulunamadı." } }
    }
    return { success: false, error: genericAdminError() }
  }
}

export type RemoveDescriptiveAttributeResult = { success: true } | { success: false; error: { code: "NOT_FOUND" | "UNKNOWN_ERROR"; message: string } }

export async function removeDescriptiveAttributeFromProduct(
  productAttributeValueId: string,
  client: PrismaClient = prisma
): Promise<RemoveDescriptiveAttributeResult> {
  await requireAdmin(client)
  try {
    await client.productAttributeValue.delete({ where: { id: productAttributeValueId } })
    return { success: true }
  } catch (error) {
    if (isRecordNotFoundError(error)) {
      return { success: false, error: { code: "NOT_FOUND", message: "Kayıt bulunamadı." } }
    }
    return { success: false, error: genericAdminError() }
  }
}
