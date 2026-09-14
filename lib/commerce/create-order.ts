/**
 * Sipariş oluşturma orkestrasyonu — GERÇEK veritabanı üzerinde çalışır.
 *
 * ÖNEMLİ İSİM/KAVRAM AYRIMI: Bu, `lib/catalog.ts` DEĞİLDİR. `lib/catalog.ts`,
 * storefront'un `lib/fixtures/products.ts` (statik mock veri) üzerinde
 * çalışan bir UI-display katmanıdır ve sipariş oluşturma yetkisi yoktur; bu
 * dosya ise `prisma/schema.prisma`'daki gerçek tablolara yazan, yetkili
 * commerce servis katmanının parçasıdır. İkisi birbirinin yerine geçmez.
 *
 * Bu modül yalnızca bir servis fonksiyonu ihraç eder (`createOrder`) — henüz
 * hiçbir API route/server action buna bağlanmadı (bu turun bilinçli sınırı).
 */
import { PaymentStatus, OrderStatus } from "../generated/prisma/client"
import type { Prisma as PrismaNS, PrismaClient } from "../generated/prisma/client"
import { prisma } from "../prisma"
import { checkoutInputSchema, type CheckoutInput, type CheckoutItemInput } from "./checkout-schema"
import { mergeDuplicateItems } from "./normalize-items"
import { resolveOrderItems } from "./resolve-order-items"
import { calculateOrderPricing } from "./pricing"
import { lockVariantsForUpdate, assertSufficientStock } from "./stock"
import { buildOrderItemCreateInputs } from "./order-items"
import { buildReservationCreateInputs } from "./reservations"
import { generateOrderNumber } from "./order-number"
import { RESERVATION_WINDOW_HOURS } from "./constants"
import { CommerceError, IdempotencyKeyConflictError, isUniqueConstraintViolation } from "./errors"

type OrderWithItems = PrismaNS.OrderGetPayload<{ include: { items: true } }>

export interface CreateOrderResult {
  orderId: string
  orderNumber: string
  /** Decimal'ı string olarak taşır — float'a çevirip hassasiyet kaybetmemek için. */
  total: string
  currency: string
  paymentMethod: string
  paymentStatus: string
  orderStatus: string
}

const MAX_ORDER_NUMBER_ATTEMPTS = 3

/**
 * Checkout girdisinden yetkili, transaction-safe bir `Order` oluşturur.
 *
 * Akış:
 * 1. Zod ile doğrula (`docs/ARCHITECTURE.md` §4.1 kontratı).
 * 2. Aynı `variantId` birden fazla geldiyse miktarları birleştir.
 * 3. Idempotency HIZLI YOL: aynı key ile daha önce oluşturulmuş bir sipariş
 *    var mı diye önce (kilitsiz) bakılır — bkz. aşağıdaki uzun yorum.
 * 4. Yoksa: tek bir `$transaction` içinde variantId → gerçek veri çözümü,
 *    satır kilitleme, stok yeterlilik kontrolü, fiyat hesaplama, Order +
 *    OrderItem + InventoryReservation kayıtlarını ATOMIK olarak oluşturma.
 * 5. Aynı key ile eşzamanlı bir yarış (race) varsa (adım 3 boş döndü ama
 *    adım 4'teki create P2002 ile çakıştı), mevcut siparişi bulup döndür.
 *
 * `client` parametresi bilinçli olarak dependency injection ile verilir
 * (varsayılan: `lib/prisma.ts`'teki üretim singleton'ı). Bu, testlerin
 * TAMAMEN AYRI bir `PrismaClient` (ayrı bir `TEST_DATABASE_URL`'e bağlı)
 * geçebilmesini sağlar — testler bu sayede üretim singleton'ının okuduğu
 * `DATABASE_URL`'e hiçbir zaman dokunmaz/bağlanmaz (bkz. `tests/setup.ts`
 * ve `tests/helpers/test-prisma.ts`, qa/team-lead'in test-DB izolasyonu
 * bulgusuna karşılık).
 */
export async function createOrder(rawInput: CheckoutInput, client: PrismaClient = prisma): Promise<CreateOrderResult> {
  const input = checkoutInputSchema.parse(rawInput)
  const items = mergeDuplicateItems(input.items)

  // --- Idempotency hızlı yol (fast path) -----------------------------------
  // Bu adım yalnızca bir OPTİMİZASYONDUR — doğruluğun tek garantisi aşağıdaki
  // transaction içindeki DB unique constraint + P2002 yakalamadır (adım 4/5).
  // Bu hızlı yol olmadan da sistem doğru çalışır, ama olmadan aynı isteğin
  // meşru bir tekrarı (ör. ağ zaman aşımı sonrası retry) gereksiz yere tüm
  // stok/kilit/fiyat işini tekrar yapar VE — daha kötüsü — ilk denemenin
  // KENDİ rezervasyonu araya girdiği için stok "yetersiz" görünüp bu meşru
  // tekrar YANLIŞLIKLA reddedilebilir. Bu yüzden önce var olan siparişi
  // (varsa) doğrudan buluyoruz.
  const existingOrder = await client.order.findUnique({
    where: { orderIdempotencyKey: input.orderIdempotencyKey },
    include: { items: true },
  })
  if (existingOrder) {
    assertSamePayload(existingOrder, input, items)
    return toResult(existingOrder)
  }

  try {
    const createdOrder = await client.$transaction(async (tx) => {
      // Kilit HER ŞEYDEN ÖNCE, ham girdideki (henüz DB'den çözülmemiş)
      // variantId'lerle alınır — yalnızca stok kontrolü değil, `resolveOrderItems`
      // içindeki fiyat/ürün-durumu okuması da kilit ALINDIKTAN SONRA çalışsın
      // diye (security review bulgusu: kilit öncesi okunan fiyat/status, aynı
      // transaction içinde kilitlemeyle stok kontrolü arasındaki dar pencerede
      // bir admin değişikliğiyle bayatlayabilirdi — TOCTOU). Deadlock'ı önlemek
      // için id'ler her zaman artan sırada kilitlenir (bkz.
      // `lockVariantsForUpdate` içindeki sıralama). Eşleşmeyen id'ler için kilit
      // sorgusu sessizce 0 satır döner (hata fırlatmaz), bu yüzden
      // `resolveOrderItems`'ın "variant bulunamadı" kontrolü bundan etkilenmez.
      await lockVariantsForUpdate(
        tx,
        items.map((item) => item.variantId)
      )

      const resolvedItems = await resolveOrderItems(tx, items)
      await assertSufficientStock(tx, resolvedItems)

      const pricing = calculateOrderPricing(resolvedItems)
      const orderNumber = await generateUniqueOrderNumber(tx)
      const expiresAt = new Date(Date.now() + RESERVATION_WINDOW_HOURS * 60 * 60 * 1000)

      return tx.order.create({
        data: {
          orderNumber,
          orderIdempotencyKey: input.orderIdempotencyKey,
          contactFullName: input.contact.fullName,
          contactPhone: input.contact.phone,
          contactEmail: input.contact.email,
          deliveryAddressLine: input.deliveryAddress.addressLine,
          deliveryCity: input.deliveryAddress.city,
          deliveryDistrict: input.deliveryAddress.district,
          deliveryPostalCode: input.deliveryAddress.postalCode,
          deliveryCountry: input.deliveryAddress.country,
          giftPackagingSelected: input.giftPackagingSelected ?? false,
          paymentMethod: input.paymentMethod,
          // Yeni sipariş her zaman bu iki durumla başlar — bkz.
          // `docs/ARCHITECTURE.md` §3/§7: paymentStatus ve orderStatus
          // KASITLI OLARAK birbirinden bağımsızdır, aynı şey değildir.
          paymentStatus: PaymentStatus.PENDING,
          orderStatus: OrderStatus.PAYMENT_PENDING,
          currency: "TRY",
          subtotal: pricing.subtotal,
          total: pricing.total,
          items: { create: buildOrderItemCreateInputs(resolvedItems, pricing.lines) },
          reservations: { create: buildReservationCreateInputs(resolvedItems, expiresAt) },
        },
        include: { items: true },
      })
    })

    return toResult(createdOrder)
  } catch (error) {
    if (isUniqueConstraintViolation(error, "orderIdempotencyKey")) {
      // Race: başka bir eşzamanlı istek aynı key ile bizden önce commit etti.
      // "Önce findUnique sonra create" YETERSİZ olduğu için (adım 3'teki hızlı
      // yol tam olarak bu riski taşır) asıl garanti burasıdır: create'i
      // dene, unique constraint hatasını yakala, sonra mevcut kaydı oku.
      const raceWinnerOrder = await client.order.findUnique({
        where: { orderIdempotencyKey: input.orderIdempotencyKey },
        include: { items: true },
      })
      if (!raceWinnerOrder) {
        // Beklenmedik durum (ör. kayıt oluşturulduktan hemen sonra silindi) —
        // orijinal hatayı gizlemeden fırlat.
        throw error
      }
      assertSamePayload(raceWinnerOrder, input, items)
      return toResult(raceWinnerOrder)
    }
    throw error
  }
}

/**
 * Aynı `orderIdempotencyKey` farklı bir payload ile geldiyse SESSİZCE eski
 * siparişi döndürmüyoruz — bu, istemcinin fark etmeyeceği bir hatayı (ör.
 * yeniden kullanılmış/çakışan bir idempotency key, ya da bir programlama
 * hatası) gizleyebilir. Bunun yerine net bir `IdempotencyKeyConflictError`
 * fırlatılır; bu hatanın HTTP karşılığı (ör. 409 Conflict) route katmanının
 * işidir (bu tur route yazmıyor).
 */
function assertSamePayload(existing: OrderWithItems, input: CheckoutInput, mergedItems: CheckoutItemInput[]): void {
  const sameScalarFields =
    existing.paymentMethod === input.paymentMethod &&
    existing.giftPackagingSelected === (input.giftPackagingSelected ?? false) &&
    existing.contactFullName === input.contact.fullName &&
    existing.contactPhone === input.contact.phone &&
    existing.contactEmail === input.contact.email &&
    existing.deliveryAddressLine === input.deliveryAddress.addressLine &&
    existing.deliveryCity === input.deliveryAddress.city &&
    existing.deliveryDistrict === input.deliveryAddress.district &&
    existing.deliveryPostalCode === input.deliveryAddress.postalCode &&
    existing.deliveryCountry === input.deliveryAddress.country

  const existingItems = [...existing.items]
    .map((item) => ({ variantId: item.variantId, quantity: item.quantity }))
    .sort((a, b) => a.variantId.localeCompare(b.variantId))
  const incomingItems = [...mergedItems].sort((a, b) => a.variantId.localeCompare(b.variantId))

  const sameItems =
    existingItems.length === incomingItems.length &&
    existingItems.every(
      (item, index) => item.variantId === incomingItems[index].variantId && item.quantity === incomingItems[index].quantity
    )

  if (!sameScalarFields || !sameItems) {
    throw new IdempotencyKeyConflictError(input.orderIdempotencyKey)
  }
}

/**
 * Benzersiz bir `orderNumber` üretir. Çakışma ihtimali istatistiksel olarak
 * ihmal edilebilir düzeydedir (tarih + 6 haneli rastgele suffix), bu yüzden
 * burada "önce kontrol et" yaklaşımı yeterli görüldü — `orderIdempotencyKey`
 * gibi güvenlik-kritik bir tekillik DEĞİLDİR, yalnızca insana dönük bir
 * referans numarasıdır (bkz. `order-number.ts`). Yine de DB'deki
 * `@unique` kısıtlaması nihai garantidir; bu döngü yalnızca pratik çakışma
 * ihtimalini sıfıra yaklaştırır.
 */
async function generateUniqueOrderNumber(tx: PrismaNS.TransactionClient): Promise<string> {
  for (let attempt = 0; attempt < MAX_ORDER_NUMBER_ATTEMPTS; attempt++) {
    const candidate = generateOrderNumber()
    const clash = await tx.order.findUnique({ where: { orderNumber: candidate }, select: { id: true } })
    if (!clash) return candidate
  }
  throw new CommerceError("Benzersiz sipariş numarası üretilemedi, lütfen tekrar deneyin")
}

function toResult(order: OrderWithItems): CreateOrderResult {
  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    // `.toFixed(2)` — Prisma'nın Decimal (decimal.js) `.toString()`'i tam
    // sayı değerlerde ondalık basamakları KIRPAR (ör. 500.00 → "500"); para
    // birimi gösteriminde her zaman 2 ondalık basamak istiyoruz.
    total: order.total.toFixed(2),
    currency: order.currency,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
  }
}
