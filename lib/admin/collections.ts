/**
 * Koleksiyon CRUD (delete HARİÇ — `categories.ts`'teki aynı gerekçe).
 * Ürün ilişkisi yönetimi `products.ts`'teki `createProduct`/`updateProduct`
 * içindeki `collectionIds` alanı üzerinden yapılır (D023 çoktan-çoğa) — burada
 * ayrıca bir "koleksiyona ürün ekle" fonksiyonu TEKRARLANMAZ.
 */
import type { PrismaClient } from "../generated/prisma/client"
import { prisma } from "../prisma"
import { requireAdmin } from "../auth"
import { isUniqueConstraintViolation } from "../commerce"
import { slugifyTurkish } from "./slug"
import { createCollectionSchema, updateCollectionSchema } from "./schemas"
import { isRecordNotFoundError, genericAdminError } from "./errors"

export interface AdminCollectionDto {
  id: string
  slug: string
  name: string
  description: string | null
  productCount: number
}

export type CollectionMutationErrorCode = "INVALID_INPUT" | "SLUG_CONFLICT" | "COLLECTION_NOT_FOUND" | "UNKNOWN_ERROR"
export type CollectionMutationResult =
  | { success: true; collection: AdminCollectionDto }
  | { success: false; error: { code: CollectionMutationErrorCode; message: string } }

export async function listCollectionsForAdmin(client: PrismaClient = prisma): Promise<AdminCollectionDto[]> {
  await requireAdmin(client)
  const collections = await client.collection.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  })
  return collections.map((collection) => ({
    id: collection.id,
    slug: collection.slug,
    name: collection.name,
    description: collection.description,
    productCount: collection._count.products,
  }))
}

export async function createCollection(rawInput: unknown, client: PrismaClient = prisma): Promise<CollectionMutationResult> {
  await requireAdmin(client)
  const parsed = createCollectionSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { success: false, error: { code: "INVALID_INPUT", message: parsed.error.issues[0]?.message ?? "Geçersiz girdi." } }
  }
  const input = parsed.data
  const slug = slugifyTurkish(input.slug && input.slug.length > 0 ? input.slug : input.name)
  if (!slug) return { success: false, error: { code: "INVALID_INPUT", message: "Slug üretilemedi." } }

  try {
    const collection = await client.collection.create({ data: { name: input.name, slug, description: input.description || null } })
    return {
      success: true,
      collection: { id: collection.id, slug: collection.slug, name: collection.name, description: collection.description, productCount: 0 },
    }
  } catch (error) {
    if (isUniqueConstraintViolation(error, "slug")) {
      return { success: false, error: { code: "SLUG_CONFLICT", message: `"${slug}" slug'ı zaten kullanılıyor.` } }
    }
    return { success: false, error: genericAdminError() }
  }
}

export async function updateCollection(rawInput: unknown, client: PrismaClient = prisma): Promise<CollectionMutationResult> {
  await requireAdmin(client)
  const parsed = updateCollectionSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { success: false, error: { code: "INVALID_INPUT", message: parsed.error.issues[0]?.message ?? "Geçersiz girdi." } }
  }
  const input = parsed.data
  const slug = slugifyTurkish(input.slug)
  if (!slug) return { success: false, error: { code: "INVALID_INPUT", message: "Geçersiz slug." } }

  try {
    const collection = await client.collection.update({
      where: { id: input.id },
      data: { name: input.name, slug, description: input.description || null },
      include: { _count: { select: { products: true } } },
    })
    return {
      success: true,
      collection: {
        id: collection.id,
        slug: collection.slug,
        name: collection.name,
        description: collection.description,
        productCount: collection._count.products,
      },
    }
  } catch (error) {
    if (isUniqueConstraintViolation(error, "slug")) {
      return { success: false, error: { code: "SLUG_CONFLICT", message: `"${slug}" slug'ı zaten kullanılıyor.` } }
    }
    if (isRecordNotFoundError(error)) {
      return { success: false, error: { code: "COLLECTION_NOT_FOUND", message: "Koleksiyon bulunamadı." } }
    }
    return { success: false, error: genericAdminError() }
  }
}
