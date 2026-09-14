/**
 * Varyant + SKU (D027) yönetimi. SKU yeni varyantta OTOMATİK üretilir
 * (`suggestVariantSku`, admin formunda önerilen/düzenlenebilir alanı
 * doldurmak için) — ama `createVariant` her zaman formdan gelen NİHAİ SKU
 * değerini alır ve DB'nin `@unique` kısıtına dener; ön-SELECT YOK (Video 06
 * idempotency dersi).
 *
 * Fiyat `Decimal` alanına doğrudan doğrulanmış STRING olarak yazılır (Prisma
 * Decimal alanları string girdiyi güvenle kabul eder) — asla `Float`'a
 * çevrilmez.
 *
 * Stok (`stockQuantity`) BU DOSYADA DEĞİL, `./stock.ts`'te yönetilir — D018
 * rezervasyon ledger'ını bozmamak için ayrı bir sorumluluk.
 */
import { randomBytes } from "node:crypto"
import type { Prisma, PrismaClient } from "../generated/prisma/client"
import { prisma } from "../prisma"
import { requireAdmin } from "../auth"
import { getAvailableQuantities, isUniqueConstraintViolation } from "../commerce"
import { createVariantSchema, updateVariantSchema } from "./schemas"
import { isForeignKeyViolation, isRecordNotFoundError, genericAdminError } from "./errors"
import type { AdminVariantDto } from "./products"

const VARIANT_INCLUDE = {
  attributeValues: { include: { attributeDefinition: true, attributeValue: true } },
} satisfies Prisma.VariantInclude

type VariantWithAttributes = Prisma.VariantGetPayload<{ include: typeof VARIANT_INCLUDE }>

function mapVariantToDto(variant: VariantWithAttributes, availableQuantity: number): AdminVariantDto {
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
}

/** Bir SKU önerisi üretir (ürün slug'ından türetilmiş önek + kriptografik rastgele sonek). Admin isterse değiştirebilir — burası yalnızca ÖN DOLDURMA içindir. */
export async function suggestVariantSku(productId: string, client: PrismaClient = prisma): Promise<string | null> {
  await requireAdmin(client)
  const product = await client.product.findUnique({ where: { id: productId }, select: { slug: true } })
  if (!product) return null
  const prefix = product.slug.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12) || "URUN"
  const suffix = randomBytes(4).toString("hex").toUpperCase()
  return `${prefix}-${suffix}`
}

export type VariantMutationErrorCode = "INVALID_INPUT" | "SKU_CONFLICT" | "PRODUCT_OR_ATTRIBUTE_NOT_FOUND" | "VARIANT_NOT_FOUND" | "UNKNOWN_ERROR"
export type VariantMutationResult =
  | { success: true; variant: AdminVariantDto }
  | { success: false; error: { code: VariantMutationErrorCode; message: string } }

export async function createVariant(rawInput: unknown, client: PrismaClient = prisma): Promise<VariantMutationResult> {
  await requireAdmin(client)
  const parsed = createVariantSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { success: false, error: { code: "INVALID_INPUT", message: parsed.error.issues[0]?.message ?? "Geçersiz girdi." } }
  }
  const input = parsed.data

  try {
    const variant = await client.variant.create({
      data: {
        productId: input.productId,
        sku: input.sku,
        price: input.price,
        stockQuantity: input.stockQuantity,
        attributeValues: {
          create: input.selectableAttributes.map((selection) => ({
            attributeDefinitionId: selection.attributeDefinitionId,
            attributeValueId: selection.attributeValueId,
          })),
        },
      },
      include: VARIANT_INCLUDE,
    })
    // Yeni oluşturulan bir varyantın henüz hiçbir InventoryReservation'ı
    // olamaz, ama D018 formülünün TEK yerden (`getAvailableQuantities`)
    // okunması ilkesinden istisna yapmamak için yine de çağrılır.
    const availability = await getAvailableQuantities(client, [variant.id])
    return { success: true, variant: mapVariantToDto(variant, availability.get(variant.id) ?? 0) }
  } catch (error) {
    if (isUniqueConstraintViolation(error, "sku")) {
      return { success: false, error: { code: "SKU_CONFLICT", message: `"${input.sku}" SKU'su zaten kullanılıyor. Lütfen farklı bir SKU girin.` } }
    }
    if (isForeignKeyViolation(error)) {
      return { success: false, error: { code: "PRODUCT_OR_ATTRIBUTE_NOT_FOUND", message: "Ürün veya seçilen öznitelik değeri bulunamadı." } }
    }
    return { success: false, error: genericAdminError() }
  }
}

/**
 * IDOR düzeltmesi (security bulgusu — C-2): `input.productId` ZORUNLUDUR ve
 * doğrudan sorgunun `where` koşuluna dahil edilir — `id` ile bulunup
 * `productId`'ye hiç bakılmadan mutasyon yapılmaz. Ürün A'nın ekranından
 * (bayat state/hata sonucu) ürün B'ye ait bir `variantId` gönderilirse bu,
 * `id`+`productId` eşleşmediği için P2025 ile reddedilir (VARIANT_NOT_FOUND).
 * `lib/storage/reorder-images.ts`'in üyelik doğrulama deseniyle tutarlıdır.
 */
export async function updateVariant(rawInput: unknown, client: PrismaClient = prisma): Promise<VariantMutationResult> {
  await requireAdmin(client)
  const parsed = updateVariantSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { success: false, error: { code: "INVALID_INPUT", message: parsed.error.issues[0]?.message ?? "Geçersiz girdi." } }
  }
  const input = parsed.data

  try {
    const variant = await client.variant.update({
      // `productId` burada `id` ile BİRLİKTE bir filtre olarak kullanılır
      // (Prisma'nın "extended where unique input"i) — eşleşmezse 0 satır
      // bulunur, P2025 fırlatılır.
      where: { id: input.id, productId: input.productId },
      data: { sku: input.sku, price: input.price },
      include: VARIANT_INCLUDE,
    })
    const availability = await getAvailableQuantities(client, [variant.id])
    return { success: true, variant: mapVariantToDto(variant, availability.get(variant.id) ?? 0) }
  } catch (error) {
    if (isUniqueConstraintViolation(error, "sku")) {
      return { success: false, error: { code: "SKU_CONFLICT", message: `"${input.sku}" SKU'su zaten kullanılıyor. Lütfen farklı bir SKU girin.` } }
    }
    if (isRecordNotFoundError(error)) {
      return { success: false, error: { code: "VARIANT_NOT_FOUND", message: "Varyant bulunamadı." } }
    }
    return { success: false, error: genericAdminError() }
  }
}
