/**
 * Öznitelik yönetimi (D028) — admin hem `AttributeDefinition` (tip, ör.
 * "materyal") hem `AttributeValue` (değer, ör. "Gümüş") oluşturabilir.
 *
 * D020 SINIRI KARIŞTIRILMAZ: bu dosya yalnızca TİP/DEĞER'in kendisini
 * yönetir. Bir değerin bir varyanta SEÇİLEBİLİR (`VariantAttributeValue`,
 * tekil) olarak mı yoksa bir ürüne AÇIKLAYICI (`ProductAttributeValue`,
 * çoklu) olarak mı bağlanacağı `variants.ts`/`products.ts`'in işidir — o
 * ayrım burada değil, o dosyalarda kurulur.
 *
 * Kullanımda olan bir öznitelik tipini/değerini silme fonksiyonu bilinçli
 * olarak YOKTUR — DB kısıtları (`VariantAttributeValue`/`ProductAttributeValue`
 * üzerindeki restrict davranışı) zaten reddeder, UI'a bir silme yolu
 * sunulmaz.
 */
import type { PrismaClient } from "../generated/prisma/client"
import { prisma } from "../prisma"
import { requireAdmin } from "../auth"
import { isUniqueConstraintViolation } from "../commerce"
import { createAttributeDefinitionSchema, createAttributeValueSchema } from "./schemas"
import { isForeignKeyViolation, genericAdminError } from "./errors"

export interface AdminAttributeValueDto {
  id: string
  value: string
}

export interface AdminAttributeDefinitionDto {
  id: string
  key: string
  label: string
  values: AdminAttributeValueDto[]
}

export async function listAttributeDefinitionsForAdmin(client: PrismaClient = prisma): Promise<AdminAttributeDefinitionDto[]> {
  await requireAdmin(client)
  const definitions = await client.attributeDefinition.findMany({
    include: { values: { orderBy: { value: "asc" } } },
    orderBy: { label: "asc" },
  })
  return definitions.map((definition) => ({
    id: definition.id,
    key: definition.key,
    label: definition.label,
    values: definition.values.map((value) => ({ id: value.id, value: value.value })),
  }))
}

export type CreateAttributeDefinitionResult =
  | { success: true; definition: AdminAttributeDefinitionDto }
  | { success: false; error: { code: "INVALID_INPUT" | "KEY_CONFLICT" | "UNKNOWN_ERROR"; message: string } }

export async function createAttributeDefinition(
  rawInput: unknown,
  client: PrismaClient = prisma
): Promise<CreateAttributeDefinitionResult> {
  await requireAdmin(client)
  const parsed = createAttributeDefinitionSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { success: false, error: { code: "INVALID_INPUT", message: parsed.error.issues[0]?.message ?? "Geçersiz girdi." } }
  }
  try {
    const definition = await client.attributeDefinition.create({ data: parsed.data })
    return { success: true, definition: { id: definition.id, key: definition.key, label: definition.label, values: [] } }
  } catch (error) {
    if (isUniqueConstraintViolation(error, "key")) {
      return { success: false, error: { code: "KEY_CONFLICT", message: `"${parsed.data.key}" anahtarı zaten kullanılıyor.` } }
    }
    return { success: false, error: genericAdminError() }
  }
}

export type CreateAttributeValueResult =
  | { success: true; value: AdminAttributeValueDto }
  | { success: false; error: { code: "INVALID_INPUT" | "VALUE_CONFLICT" | "ATTRIBUTE_DEFINITION_NOT_FOUND" | "UNKNOWN_ERROR"; message: string } }

export async function createAttributeValue(rawInput: unknown, client: PrismaClient = prisma): Promise<CreateAttributeValueResult> {
  await requireAdmin(client)
  const parsed = createAttributeValueSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { success: false, error: { code: "INVALID_INPUT", message: parsed.error.issues[0]?.message ?? "Geçersiz girdi." } }
  }
  try {
    const value = await client.attributeValue.create({ data: parsed.data })
    return { success: true, value: { id: value.id, value: value.value } }
  } catch (error) {
    if (isUniqueConstraintViolation(error, "value")) {
      return { success: false, error: { code: "VALUE_CONFLICT", message: `"${parsed.data.value}" değeri bu öznitelik tipinde zaten mevcut.` } }
    }
    if (isForeignKeyViolation(error)) {
      return { success: false, error: { code: "ATTRIBUTE_DEFINITION_NOT_FOUND", message: "Seçilen öznitelik tipi bulunamadı." } }
    }
    return { success: false, error: genericAdminError() }
  }
}
