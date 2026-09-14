/**
 * Kategori CRUD (delete HARİÇ — D029 ürün/varyantla sınırlı olsa da,
 * kullanımda olan bir kategoriyi silmek `Product.categoryId` FK kısıtını
 * ihlal eder; bu yüzden burada da bir silme fonksiyonu sunulmaz, DB kısıtı
 * zaten reddeder).
 */
import type { PrismaClient } from "../generated/prisma/client"
import { prisma } from "../prisma"
import { requireAdmin } from "../auth"
import { isUniqueConstraintViolation } from "../commerce"
import { slugifyTurkish } from "./slug"
import { createCategorySchema, updateCategorySchema } from "./schemas"
import { isRecordNotFoundError, genericAdminError } from "./errors"

export interface AdminCategoryDto {
  id: string
  slug: string
  name: string
  description: string | null
  productCount: number
}

export type CategoryMutationErrorCode = "INVALID_INPUT" | "SLUG_CONFLICT" | "CATEGORY_NOT_FOUND" | "UNKNOWN_ERROR"
export type CategoryMutationResult =
  | { success: true; category: AdminCategoryDto }
  | { success: false; error: { code: CategoryMutationErrorCode; message: string } }

export async function listCategoriesForAdmin(client: PrismaClient = prisma): Promise<AdminCategoryDto[]> {
  await requireAdmin(client)
  const categories = await client.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  })
  return categories.map((category) => ({
    id: category.id,
    slug: category.slug,
    name: category.name,
    description: category.description,
    productCount: category._count.products,
  }))
}

export async function createCategory(rawInput: unknown, client: PrismaClient = prisma): Promise<CategoryMutationResult> {
  await requireAdmin(client)
  const parsed = createCategorySchema.safeParse(rawInput)
  if (!parsed.success) {
    return { success: false, error: { code: "INVALID_INPUT", message: parsed.error.issues[0]?.message ?? "Geçersiz girdi." } }
  }
  const input = parsed.data
  const slug = slugifyTurkish(input.slug && input.slug.length > 0 ? input.slug : input.name)
  if (!slug) return { success: false, error: { code: "INVALID_INPUT", message: "Slug üretilemedi." } }

  try {
    const category = await client.category.create({ data: { name: input.name, slug, description: input.description || null } })
    return { success: true, category: { id: category.id, slug: category.slug, name: category.name, description: category.description, productCount: 0 } }
  } catch (error) {
    if (isUniqueConstraintViolation(error, "slug")) {
      return { success: false, error: { code: "SLUG_CONFLICT", message: `"${slug}" slug'ı zaten kullanılıyor.` } }
    }
    return { success: false, error: genericAdminError() }
  }
}

export async function updateCategory(rawInput: unknown, client: PrismaClient = prisma): Promise<CategoryMutationResult> {
  await requireAdmin(client)
  const parsed = updateCategorySchema.safeParse(rawInput)
  if (!parsed.success) {
    return { success: false, error: { code: "INVALID_INPUT", message: parsed.error.issues[0]?.message ?? "Geçersiz girdi." } }
  }
  const input = parsed.data
  const slug = slugifyTurkish(input.slug)
  if (!slug) return { success: false, error: { code: "INVALID_INPUT", message: "Geçersiz slug." } }

  try {
    const category = await client.category.update({
      where: { id: input.id },
      data: { name: input.name, slug, description: input.description || null },
      include: { _count: { select: { products: true } } },
    })
    return {
      success: true,
      category: { id: category.id, slug: category.slug, name: category.name, description: category.description, productCount: category._count.products },
    }
  } catch (error) {
    if (isUniqueConstraintViolation(error, "slug")) {
      return { success: false, error: { code: "SLUG_CONFLICT", message: `"${slug}" slug'ı zaten kullanılıyor.` } }
    }
    if (isRecordNotFoundError(error)) {
      return { success: false, error: { code: "CATEGORY_NOT_FOUND", message: "Kategori bulunamadı." } }
    }
    return { success: false, error: genericAdminError() }
  }
}
