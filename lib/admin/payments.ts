/**
 * Havale/EFT ödemesinin MANUEL onayı ve reddi (D007 — otomatik banka
 * entegrasyonu YOK; D026'nın "ödeme onayı sonraki dalgaya bırakıldı" sınırı
 * VIDEO 09'da kapanıyor).
 *
 * Bu dosya `./orders.ts` desenini birebir izler: her fonksiyon kendi içinde
 * `requireAdmin(client)` çağırır (PII/yetki sınırı her işlemde yeniden
 * doğrulanır, yalnızca login sayfasında değil — `docs/ARCHITECTURE.md` §5.1),
 * `{ success: true, ... } | { success: false, error: { code, message } }`
 * döner ve HAM bir Prisma hatasını ASLA çağırana sızdırmaz. `client`
 * parametresi zorunlu bir dependency-injection noktasıdır — testler tamamen
 * ayrı bir `PrismaClient` (ayrı `TEST_DATABASE_URL`) geçer.
 *
 * ============================================================================
 * KRİTİK DEĞİŞMEZ (invariant) — ONAY `availableQuantity`'Yİ DEĞİŞTİRMEZ
 * ============================================================================
 * D018'in tek paylaşılan formülü (bkz. `lib/commerce/availability.ts`):
 *
 *     availableQuantity = Variant.stockQuantity - Σ(ACTIVE rezervasyon)
 *
 * Onay ÖNCESİ:  stok 5, aktif rezervasyon 2  →  available = 3
 * Onay SONRASI: stok 3, aktif rezervasyon 0  →  available = 3
 *
 * Yani ödeme onayı, mevcut satılabilir stoğu ne artırır ne azaltır; yalnızca
 * bir REZERVASYONU GERÇEK SATIŞA dönüştürür. Bu değişmezin TEK garantisi, iki
 * adımın — fiziksel stok düşümü ve rezervasyonun CONSUMED'a çevrilmesi — AYNI
 * transaction içinde olmasıdır. Biri commit olup diğeri olmazsa katalog ya
 * fazla ya eksik stok gösterir (ve fazla gösterirse oversell'e yol açar,
 * Risk R1).
 *
 * IDEMPOTENCY (D017): Aynı sipariş iki kez onaylanırsa stok İKİ KEZ
 * DÜŞMEMELİDİR. Bunun tek koruması, `Order` satırını `FOR UPDATE` ile
 * kilitleyip `paymentStatus === 'CONFIRMED'` durumunda HİÇBİR ŞEY YAPMADAN
 * `alreadyApplied: true` ile dönmektir; ikinci savunma katmanı ise Order
 * güncellemesinin KOŞULLU (`WHERE paymentStatus = 'PENDING'`) tek bir
 * `updateMany` olmasıdır — araya giren bir yarış varsa `count === 0` gelir ve
 * transaction rollback olur.
 */
import type { PrismaClient } from "../generated/prisma/client"
import { OrderStatus, PaymentStatus, ReservationStatus } from "../generated/prisma/client"
import type { OrderStatus as OrderStatusType, PaymentStatus as PaymentStatusType } from "../generated/prisma/enums"
import { prisma } from "../prisma"
import { requireAdmin } from "../auth"
import { lockVariantsForUpdate } from "../commerce/stock"
import { ORDER_DETAIL_INCLUDE, mapOrderToDetailDto, type AdminOrderDetailDto } from "./orders"
import { orderPaymentActionSchema } from "./schemas"
import {
  OrderNotFoundError,
  InvalidPaymentStateError,
  StockInconsistencyError,
  genericAdminError,
} from "./errors"

export type OrderPaymentErrorCode =
  | "INVALID_INPUT"
  | "ORDER_NOT_FOUND"
  | "INVALID_PAYMENT_STATE"
  | "STOCK_INCONSISTENT"
  | "UNKNOWN_ERROR"

export type OrderPaymentResult =
  | {
      success: true
      order: AdminOrderDetailDto
      /**
       * `true` ise bu çağrı hiçbir şeyi DEĞİŞTİRMEDİ — işlem daha önce zaten
       * uygulanmıştı (çift tıklama, sayfa yenileme, tekrarlanan istek). UI
       * bunu "zaten onaylanmış/reddedilmiş" şeklinde bilgilendirici bir
       * mesaja çevirebilir; bir HATA DEĞİLDİR (D017).
       */
      alreadyApplied: boolean
    }
  | { success: false; error: { code: OrderPaymentErrorCode; message: string } }

/** `FOR UPDATE` ile kilitlenen satırdan okunan minimum alan kümesi. */
interface LockedOrderRow {
  id: string
  paymentStatus: PaymentStatusType
  orderStatus: OrderStatusType
}

/**
 * Ham hataları tanımlı sonuç kodlarına çeviren TEK yer — iki fonksiyon da
 * aynı catch mantığını kullanır, ikinci bir kopyası yazılmaz.
 */
function toPaymentErrorResult(error: unknown): OrderPaymentResult {
  if (error instanceof OrderNotFoundError) {
    return { success: false, error: { code: "ORDER_NOT_FOUND", message: "Sipariş bulunamadı." } }
  }
  if (error instanceof InvalidPaymentStateError) {
    return { success: false, error: { code: "INVALID_PAYMENT_STATE", message: error.message } }
  }
  if (error instanceof StockInconsistencyError) {
    return { success: false, error: { code: "STOCK_INCONSISTENT", message: error.message } }
  }
  return { success: false, error: genericAdminError() }
}

/**
 * Havale ödemesini ONAYLAR: rezerve edilmiş stoğu gerçek satışa dönüştürür.
 *
 * TEK transaction, idempotent. Akış:
 * 1. `Order` satırı `SELECT ... FOR UPDATE` ile kilitlenir (eşzamanlı iki
 *    onay isteği artık sırayla işlenir; ikincisi ilkinin sonucunu GÖRÜR).
 * 2. Zaten CONFIRMED ise → no-op, `alreadyApplied: true`.
 * 3. FAILED veya sipariş CANCELLED ise → `InvalidPaymentStateError`.
 * 4. Bu siparişin ACTIVE rezervasyonlarının varyantları
 *    `lockVariantsForUpdate` ile (ARTAN id sırasında — deadlock koruması o
 *    fonksiyonun içindedir, burada yeniden yazılmaz) kilitlenir.
 * 5. Her varyantın fiziksel stoğu, rezerve edilen TOPLAM kadar düşürülür.
 * 6. Rezervasyonlar KOŞULLU tek `updateMany` ile CONSUMED yapılır.
 * 7. Order KOŞULLU `updateMany` ile CONFIRMED yapılır.
 *
 * `orderStatus` BİLİNÇLİ OLARAK DEĞİŞTİRİLMEZ (otomatik `PREPARING` YOK):
 * ödeme durumu ile sipariş durumu kasıtlı olarak ayrı kavramlardır
 * (`docs/ARCHITECTURE.md` §3) ve siparişi hazırlamaya başlamak admin'in ayrı,
 * bilinçli bir kararıdır — `updateOrderStatus` ile yapılır.
 */
export async function confirmOrderPayment(rawInput: unknown, client: PrismaClient = prisma): Promise<OrderPaymentResult> {
  await requireAdmin(client)

  const parsed = orderPaymentActionSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { success: false, error: { code: "INVALID_INPUT", message: parsed.error.issues[0]?.message ?? "Geçersiz girdi." } }
  }
  const { orderId } = parsed.data

  try {
    const outcome = await client.$transaction(async (tx) => {
      const lockedRows = await tx.$queryRaw<LockedOrderRow[]>`
        SELECT "id", "paymentStatus", "orderStatus" FROM "Order" WHERE "id" = ${orderId} FOR UPDATE
      `
      const current = lockedRows[0]
      if (!current) throw new OrderNotFoundError(orderId)

      // --- Idempotent no-op (D017) ---------------------------------------
      // Çift tıklama/tekrarlanan istek buraya düşer. HİÇBİR stok hareketi
      // yapılmaz — bu madde, "aynı sipariş iki kez onaylanırsa stok iki kez
      // düşmesin" garantisinin TEK koruyucusudur.
      if (current.paymentStatus === PaymentStatus.CONFIRMED) {
        const order = await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: ORDER_DETAIL_INCLUDE })
        return { order, alreadyApplied: true }
      }

      if (current.paymentStatus === PaymentStatus.FAILED || current.orderStatus === OrderStatus.CANCELLED) {
        throw new InvalidPaymentStateError(
          "Bu siparişin ödemesi onaylanamaz: sipariş iptal edilmiş veya ödemesi daha önce reddedilmiş."
        )
      }

      const activeReservations = await tx.inventoryReservation.findMany({
        where: { orderId, status: ReservationStatus.ACTIVE },
        select: { variantId: true, quantity: true },
      })

      // Aynı varyantın birden fazla rezervasyonu olabilir (teorik olarak);
      // stok düşümü varyant başına TOPLAM üzerinden yapılır, yoksa aynı
      // varyant için birden fazla ayrı `decrement` çalışırdı.
      const quantityByVariantId = new Map<string, number>()
      for (const reservation of activeReservations) {
        quantityByVariantId.set(
          reservation.variantId,
          (quantityByVariantId.get(reservation.variantId) ?? 0) + reservation.quantity
        )
      }

      if (quantityByVariantId.size > 0) {
        const variantIds = Array.from(quantityByVariantId.keys())

        // Kilit, stok OKUMASINDAN ÖNCE alınır — kilitsiz "oku, karar ver,
        // yaz" dizisi klasik bir TOCTOU'dur (Video 06 dersi).
        await lockVariantsForUpdate(tx, variantIds)

        const variants = await tx.variant.findMany({
          where: { id: { in: variantIds } },
          select: { id: true, stockQuantity: true },
        })
        const stockByVariantId = new Map(variants.map((variant) => [variant.id, variant.stockQuantity]))

        // ÖNCE tamamını doğrula, SONRA yaz: tek bir varyant bile yetersizse
        // hiçbir stok hareketi yapılmamış olur (fırlatılan hata zaten
        // transaction'ı rollback eder, ama kısmi yazımı hiç başlatmamak
        // niyeti okunur kılar).
        for (const [variantId, requiredQuantity] of quantityByVariantId) {
          const currentStock = stockByVariantId.get(variantId)
          if (currentStock === undefined || currentStock < requiredQuantity) {
            throw new StockInconsistencyError(
              "Ödeme onaylanamadı: bu siparişteki bir ürünün fiziksel stoğu rezerve edilen adedin altında. " +
                "Lütfen varyant stoğunu kontrol edin."
            )
          }
        }

        // Kilitlenme sırasıyla (artan id) aynı sırada güncelliyoruz —
        // `lockVariantsForUpdate` zaten bu sırayla kilitledi.
        for (const variantId of [...quantityByVariantId.keys()].sort()) {
          await tx.variant.update({
            where: { id: variantId },
            data: { stockQuantity: { decrement: quantityByVariantId.get(variantId)! } },
          })
        }
      }

      // KOŞULLU updateMany ("önce oku sonra yaz" DEĞİL) — `orders.ts`'teki
      // CANCELLED release deseniyle aynı TOCTOU dersi: zaten CONSUMED olmuş
      // bir satır bu WHERE'e eşleşmez, yani ikinci kez tüketilemez.
      await tx.inventoryReservation.updateMany({
        where: { orderId, status: ReservationStatus.ACTIVE },
        data: { status: ReservationStatus.CONSUMED },
      })

      const updated = await tx.order.updateMany({
        where: { id: orderId, paymentStatus: PaymentStatus.PENDING },
        data: { paymentStatus: PaymentStatus.CONFIRMED },
      })
      if (updated.count === 0) {
        // Satırı FOR UPDATE ile kilitlemiş olmamıza rağmen buraya düşmek,
        // beklenmedik bir eşzamanlılık durumu demektir. Sessizce devam etmek
        // yerine rollback ediyoruz — stok düşümü, ödeme onayı olmadan
        // KESİNLİKLE commit olmamalıdır.
        throw new InvalidPaymentStateError("Bu siparişin ödeme durumu bu sırada değişti. Lütfen sayfayı yenileyip tekrar deneyin.")
      }

      const order = await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: ORDER_DETAIL_INCLUDE })
      return { order, alreadyApplied: false }
    })

    return { success: true, order: mapOrderToDetailDto(outcome.order), alreadyApplied: outcome.alreadyApplied }
  } catch (error) {
    return toPaymentErrorResult(error)
  }
}

/**
 * Havale ödemesini REDDEDER: siparişi iptal eder ve rezerve stoğu serbest
 * bırakır.
 *
 * TEK transaction, idempotent. FİZİKSEL STOK DÜŞÜRÜLMEZ — rezervasyon zaten
 * `Variant.stockQuantity`'yi hiç azaltmamıştı (D018'in ledger modeli);
 * rezervasyonu RELEASED yapmak, o adedi kendiliğinden yeniden satılabilir
 * kılar (`availableQuantity` formülünün ACTIVE rezervasyonları düşmesi
 * sayesinde). Burada stoğu "geri eklemek" ÇİFT SAYIM olurdu.
 */
export async function rejectOrderPayment(rawInput: unknown, client: PrismaClient = prisma): Promise<OrderPaymentResult> {
  await requireAdmin(client)

  const parsed = orderPaymentActionSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { success: false, error: { code: "INVALID_INPUT", message: parsed.error.issues[0]?.message ?? "Geçersiz girdi." } }
  }
  const { orderId } = parsed.data

  try {
    const outcome = await client.$transaction(async (tx) => {
      const lockedRows = await tx.$queryRaw<LockedOrderRow[]>`
        SELECT "id", "paymentStatus", "orderStatus" FROM "Order" WHERE "id" = ${orderId} FOR UPDATE
      `
      const current = lockedRows[0]
      if (!current) throw new OrderNotFoundError(orderId)

      // Çift reddetme GÜVENLİ bir no-op olmalıdır (D017) — ikinci çağrı ne
      // yeni bir release yapar ne de `releasedAt`'i değiştirir.
      if (current.paymentStatus === PaymentStatus.FAILED && current.orderStatus === OrderStatus.CANCELLED) {
        const order = await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: ORDER_DETAIL_INCLUDE })
        return { order, alreadyApplied: true }
      }

      if (current.paymentStatus === PaymentStatus.CONFIRMED) {
        // Onaylanmış bir ödemede stok zaten fiziksel olarak düşülmüş ve
        // rezervasyon CONSUMED olmuştur; bunu "reddetmek" iade/geri alma
        // (refund) anlamına gelir ve MVP kapsamında DEĞİLDİR — sessizce
        // yanlış bir şey yapmak yerine açıkça reddediyoruz.
        // MESAJ NOTU (security incelemesi): Burada eskiden "sipariş iptali/
        // iadesi için sipariş durumunu kullanın" yazıyordu. Bu YANILTICIYDI —
        // ödeme onaylandığında rezervasyonlar CONSUMED olur, dolayısıyla
        // `updateOrderStatus`'ün CANCELLED dalındaki
        // `updateMany ... WHERE status = ACTIVE` hiçbir satırla eşleşmez ve
        // FİZİKSEL STOK GERİ GELMEZ. Admin, önerilen yolu izleyip stoğun
        // döndüğünü sanabilirdi. Mesaj artık bu sonucu açıkça söylüyor.
        throw new InvalidPaymentStateError(
          "Onaylanmış bir ödeme reddedilemez. Siparişi iptal etmek isterseniz sipariş durumunu " +
            "\"İptal Edildi\" yapabilirsiniz; ancak ödeme onaylandığı için satılan stok bu işlemle " +
            "GERİ EKLENMEZ — gerekiyorsa varyant stoğunu elle düzeltin. (İade akışı MVP kapsamı dışındadır.)"
        )
      }

      const updated = await tx.order.updateMany({
        where: { id: orderId, paymentStatus: PaymentStatus.PENDING },
        data: { paymentStatus: PaymentStatus.FAILED, orderStatus: OrderStatus.CANCELLED },
      })
      if (updated.count === 0) {
        throw new InvalidPaymentStateError("Bu siparişin ödeme durumu bu sırada değişti. Lütfen sayfayı yenileyip tekrar deneyin.")
      }

      await tx.inventoryReservation.updateMany({
        where: { orderId, status: ReservationStatus.ACTIVE },
        data: { status: ReservationStatus.RELEASED, releasedAt: new Date() },
      })

      const order = await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: ORDER_DETAIL_INCLUDE })
      return { order, alreadyApplied: false }
    })

    return { success: true, order: mapOrderToDetailDto(outcome.order), alreadyApplied: outcome.alreadyApplied }
  } catch (error) {
    return toPaymentErrorResult(error)
  }
}
