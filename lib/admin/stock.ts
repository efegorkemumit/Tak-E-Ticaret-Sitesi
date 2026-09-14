/**
 * Admin fiziksel stok yönetimi. `Variant.stockQuantity` burada DOĞRUDAN
 * güncellenir (admin'in fiziksel/raf stoğu) — D018'in rezervasyon ledger'ı
 * (`InventoryReservation`) bu dosyada HİÇ değiştirilmez, yalnızca
 * OKUNUR (`lib/commerce/availability.ts` üzerinden). Kullanılabilir stok
 * formülünün ikinci bir kopyası burada YAZILMAZ.
 */
import type { PrismaClient } from "../generated/prisma/client"
import { prisma } from "../prisma"
import { requireAdmin } from "../auth"
import { getAvailableQuantities } from "../commerce"
import { updateVariantStockSchema } from "./schemas"
import { isRecordNotFoundError, genericAdminError } from "./errors"

export interface VariantStockBreakdownDto {
  variantId: string
  /** Ham/fiziksel stok (`Variant.stockQuantity`). */
  physicalStock: number
  /** Aktif rezervasyon toplamı — `physicalStock - availableQuantity`. */
  reservedQuantity: number
  /** D018 formülü (`getAvailableQuantities`) — bu üçlünün TEK doğruluk kaynağı. */
  availableQuantity: number
}

export async function getVariantStockBreakdown(
  variantIds: string[],
  client: PrismaClient = prisma
): Promise<VariantStockBreakdownDto[]> {
  await requireAdmin(client)
  if (variantIds.length === 0) return []

  const variants = await client.variant.findMany({ where: { id: { in: variantIds } }, select: { id: true, stockQuantity: true } })
  const availabilityByVariantId = await getAvailableQuantities(client, variantIds)

  return variants.map((variant) => {
    const availableQuantity = availabilityByVariantId.get(variant.id) ?? 0
    return {
      variantId: variant.id,
      physicalStock: variant.stockQuantity,
      reservedQuantity: variant.stockQuantity - availableQuantity,
      availableQuantity,
    }
  })
}

export type UpdateVariantStockResult =
  | { success: true; stock: VariantStockBreakdownDto }
  | { success: false; error: { code: "INVALID_INPUT" | "VARIANT_NOT_FOUND" | "UNKNOWN_ERROR"; message: string } }

/**
 * IDOR düzeltmesi (security bulgusu — C-2): `productId` ZORUNLUDUR, sorgunun
 * `where` koşuluna dahil edilir — bkz. `lib/admin/variants.ts` →
 * `updateVariant`'taki aynı gerekçe.
 */
export async function updateVariantStock(rawInput: unknown, client: PrismaClient = prisma): Promise<UpdateVariantStockResult> {
  await requireAdmin(client)
  const parsed = updateVariantStockSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { success: false, error: { code: "INVALID_INPUT", message: parsed.error.issues[0]?.message ?? "Geçersiz girdi." } }
  }
  const { variantId, productId, stockQuantity } = parsed.data

  try {
    await client.variant.update({ where: { id: variantId, productId }, data: { stockQuantity } })
  } catch (error) {
    if (isRecordNotFoundError(error)) {
      return { success: false, error: { code: "VARIANT_NOT_FOUND", message: "Varyant bulunamadı." } }
    }
    return { success: false, error: genericAdminError() }
  }

  const [breakdown] = await getVariantStockBreakdown([variantId], client)
  return { success: true, stock: breakdown }
}
