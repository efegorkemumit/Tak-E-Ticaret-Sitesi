/**
 * `ProductImage.sortOrder` yeniden sıralama — `sortOrder = 0` ana görseldir
 * (şemadaki yorum, bkz. `prisma/schema.prisma`). `@@unique([productId,
 * sortOrder])` kısıtı yüzünden naif, sırayla çalışan bir UPDATE döngüsü ARA
 * ADIMDA unique ihlaline çarpar (ör. 0↔1 swap'ında önce id-A'yı 1 yapmaya
 * çalışmak, hâlâ 1'de duran id-B ile çakışır). Bu yüzden tek bir transaction
 * içinde İKİ FAZLI yapılır: önce tüm satırlar çakışmayan geçici (negatif)
 * değerlere, sonra hedef değerlere taşınır.
 *
 * `server-only` paketi BİLİNÇLİ OLARAK kullanılmadı (bkz.
 * `lib/auth/password.ts`'teki gerekçe notu — Vitest ile uyumsuz, qa
 * `testPrisma` ile bu fonksiyonları doğrudan çağırabilmeli); koruma
 * Prisma/`pg`'nin Node-only bağımlılıklarından doğal olarak gelir.
 */
import { prisma } from "../prisma"
import type { PrismaClient } from "../generated/prisma/client"

/**
 * @param orderedImageIds Bu ürüne ait TÜM `ProductImage` id'leri, YENİ sırada
 * (index 0 → yeni `sortOrder` 0 → ana görsel). Ürünün mevcut görsel
 * kümesiyle birebir (aynı eleman sayısı, aynı id'ler) eşleşmelidir.
 */
export async function reorderProductImages(
  productId: string,
  orderedImageIds: string[],
  client: PrismaClient = prisma
): Promise<void> {
  await client.$transaction(async (tx) => {
    const existingImages = await tx.productImage.findMany({ where: { productId }, select: { id: true } })
    const existingIdSet = new Set(existingImages.map((image) => image.id))

    const isValidReorder =
      orderedImageIds.length === existingImages.length && orderedImageIds.every((id) => existingIdSet.has(id))
    if (!isValidReorder) {
      throw new Error("orderedImageIds, üründeki tüm görsel id'leriyle birebir eşleşmelidir.")
    }

    // Faz 1 — çakışmayan geçici (negatif) değerlere taşı. Sıralı `await`
    // BİLİNÇLİ olarak tercih edildi (Promise.all yerine): aynı interactive
    // transaction bağlantısında sıralamanın garanti olması, birkaç görsellik
    // bir listede gözle görülür bir performans kaybına yol açmaz.
    for (const [index, id] of orderedImageIds.entries()) {
      await tx.productImage.update({ where: { id }, data: { sortOrder: -(index + 1) } })
    }

    // Faz 2 — nihai hedef değerlere taşı.
    for (const [index, id] of orderedImageIds.entries()) {
      await tx.productImage.update({ where: { id }, data: { sortOrder: index } })
    }
  })
}

/**
 * Bir görseli ana görsel yapar (`sortOrder = 0`), diğerlerinin GÖRELİ sırasını
 * korur. `reorderProductImages`'ın üzerine kurulu bir kolaylık fonksiyonudur.
 */
export async function setMainProductImage(
  productId: string,
  imageId: string,
  client: PrismaClient = prisma
): Promise<void> {
  const images = await client.productImage.findMany({
    where: { productId },
    orderBy: { sortOrder: "asc" },
    select: { id: true },
  })

  const currentOrder = images.map((image) => image.id)
  const targetIndex = currentOrder.indexOf(imageId)
  if (targetIndex === -1) {
    throw new Error(`Görsel ${imageId}, ürün ${productId} altında bulunamadı.`)
  }
  if (targetIndex === 0) return // zaten ana görsel

  const reordered = [imageId, ...currentOrder.filter((id) => id !== imageId)]
  await reorderProductImages(productId, reordered, client)
}
