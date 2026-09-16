/**
 * Sipariş listesi/detayı + sipariş durumu geçişi.
 *
 * ÖDEME SINIRI (D026 — sert kural): admin `paymentMethod`/`paymentStatus`'u
 * GÖREBİLİR, DEĞİŞTİREMEZ. `updateOrderStatusSchema`'da (bkz. `./schemas.ts`)
 * bilinçli olarak `paymentStatus` alanı YOKTUR; Zod objesi varsayılan olarak
 * TANIMSIZ alanları STRIP eder (`.passthrough()` KULLANILMADI), bu yüzden
 * client fazladan bir `paymentStatus` gönderse bile sunucu bunu asla okumaz.
 *
 * PII (§5.2): her okuma fonksiyonu da `requireAdmin()` çağırır — sipariş
 * detayındaki ad/adres/telefon yalnızca kimliği doğrulanmış admin'e gider.
 */
import type { Prisma, PrismaClient } from "../generated/prisma/client"
import { OrderStatus, ReservationStatus } from "../generated/prisma/client"
import type { OrderStatus as OrderStatusType } from "../generated/prisma/enums"
import type { OrderModel } from "../generated/prisma/models"
import { prisma } from "../prisma"
import { requireAdmin } from "../auth"
import { isValidOrderStatusTransition } from "./order-status"
import { updateOrderStatusSchema, orderListFilterSchema } from "./schemas"
import { OrderNotFoundError, InvalidOrderStatusTransitionError, genericAdminError } from "./errors"

// ---------------------------------------------------------------------------
// DTO'lar
// ---------------------------------------------------------------------------

export interface AdminOrderListItemDto {
  id: string
  orderNumber: string
  orderStatus: OrderStatusType
  paymentStatus: string
  paymentMethod: string
  total: string
  currency: string
  createdAt: string
}

export interface AdminOrderItemDto {
  skuSnapshot: string
  productNameSnapshot: string
  variantDescriptionSnapshot: string
  unitPriceSnapshot: string
  quantity: number
  lineTotal: string
}

export interface AdminOrderDetailDto {
  id: string
  orderNumber: string
  createdAt: string
  contact: { fullName: string; phone: string; email: string }
  deliveryAddress: { addressLine: string; city: string; district: string; postalCode: string; country: string }
  items: AdminOrderItemDto[]
  subtotal: string
  total: string
  currency: string
  giftPackagingSelected: boolean
  orderStatus: OrderStatusType
  paymentMethod: string
  paymentStatus: string
  shippingCarrier: string | null
  trackingNumber: string | null
  shippedAt: string | null
}

/** `export` — `./payments.ts` aynı detay şeklini yeniden tanımlamak yerine bunu kullanır. */
export const ORDER_DETAIL_INCLUDE = { items: true } satisfies Prisma.OrderInclude
type OrderWithItems = Prisma.OrderGetPayload<{ include: typeof ORDER_DETAIL_INCLUDE }>

function mapOrderToListItemDto(order: OrderModel): AdminOrderListItemDto {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    total: order.total.toFixed(2),
    currency: order.currency,
    createdAt: order.createdAt.toISOString(),
  }
}

/** `export` — `./payments.ts` DTO map'lemesinin ikinci bir kopyasını YAZMAZ, bunu çağırır. */
export function mapOrderToDetailDto(order: OrderWithItems): AdminOrderDetailDto {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    createdAt: order.createdAt.toISOString(),
    contact: { fullName: order.contactFullName, phone: order.contactPhone, email: order.contactEmail },
    deliveryAddress: {
      addressLine: order.deliveryAddressLine,
      city: order.deliveryCity,
      district: order.deliveryDistrict,
      postalCode: order.deliveryPostalCode,
      country: order.deliveryCountry,
    },
    items: order.items.map((item) => ({
      skuSnapshot: item.skuSnapshot,
      productNameSnapshot: item.productNameSnapshot,
      variantDescriptionSnapshot: item.variantDescriptionSnapshot,
      unitPriceSnapshot: item.unitPriceSnapshot.toFixed(2),
      quantity: item.quantity,
      lineTotal: item.lineTotal.toFixed(2),
    })),
    subtotal: order.subtotal.toFixed(2),
    total: order.total.toFixed(2),
    currency: order.currency,
    giftPackagingSelected: order.giftPackagingSelected,
    orderStatus: order.orderStatus,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    shippingCarrier: order.shippingCarrier,
    trackingNumber: order.trackingNumber,
    shippedAt: order.shippedAt ? order.shippedAt.toISOString() : null,
  }
}

// ---------------------------------------------------------------------------
// Okuma
// ---------------------------------------------------------------------------

export async function listOrdersForAdmin(rawFilter: unknown = {}, client: PrismaClient = prisma): Promise<AdminOrderListItemDto[]> {
  await requireAdmin(client)
  const parsedFilter = orderListFilterSchema.safeParse(rawFilter)
  const filter = parsedFilter.success ? parsedFilter.data : {}

  const orders = await client.order.findMany({
    where: {
      ...(filter.orderNumber ? { orderNumber: { contains: filter.orderNumber, mode: "insensitive" } } : {}),
      ...(filter.orderStatus ? { orderStatus: filter.orderStatus } : {}),
      ...(filter.paymentMethod ? { paymentMethod: filter.paymentMethod } : {}),
      // VIDEO 09 — havale kuyruğu: BANK_TRANSFER + PENDING birlikte
      // filtrelenerek D007'nin manuel onay çalışma listesi elde edilir.
      ...(filter.paymentStatus ? { paymentStatus: filter.paymentStatus } : {}),
    },
    orderBy: { createdAt: "desc" },
  })
  return orders.map(mapOrderToListItemDto)
}

export async function getOrderDetailById(id: string, client: PrismaClient = prisma): Promise<AdminOrderDetailDto | null> {
  await requireAdmin(client)
  const order = await client.order.findUnique({ where: { id }, include: ORDER_DETAIL_INCLUDE })
  return order ? mapOrderToDetailDto(order) : null
}

export async function getOrderDetailByOrderNumber(orderNumber: string, client: PrismaClient = prisma): Promise<AdminOrderDetailDto | null> {
  await requireAdmin(client)
  const order = await client.order.findUnique({ where: { orderNumber }, include: ORDER_DETAIL_INCLUDE })
  return order ? mapOrderToDetailDto(order) : null
}

// ---------------------------------------------------------------------------
// Sipariş durumu geçişi (bkz. `./order-status.ts` — OTORİTER geçiş tablosu)
// ---------------------------------------------------------------------------

export type UpdateOrderStatusErrorCode = "INVALID_INPUT" | "ORDER_NOT_FOUND" | "INVALID_TRANSITION" | "UNKNOWN_ERROR"
export type UpdateOrderStatusResult =
  | { success: true; order: AdminOrderDetailDto }
  | { success: false; error: { code: UpdateOrderStatusErrorCode; message: string } }

/**
 * Durum güncelleme + (CANCELLED ise) D018 rezervasyon serbest bırakma TEK
 * fonksiyonda, AYNI transaction'dadır (görev talimatı — ayrı bir cron/job'a
 * bölünmez).
 *
 * Çift korumalı: (1) `Order` satırı `FOR UPDATE` ile kilitlenir, geçiş
 * kontrolü kilitli değere göre yapılır — eşzamanlı iki geçiş isteği artık
 * sırayla işlenir, ikincisi güncel (ilkinin sonucunu gören) durumu görür.
 * (2) `InventoryReservation` release'i KOŞULLU bir `updateMany`
 * (`WHERE status = 'ACTIVE'`) ile yapılır — "önce oku sonra yaz" YERİNE tek
 * atomik UPDATE; bu, aynı siparişi ikinci kez iptal etmeye çalışan bir
 * çağrının ne yeni bir release yapmasını NE DE `releasedAt`'i
 * değiştirmesini DB seviyesinde garanti eder (Video 06 TOCTOU dersi).
 */
export async function updateOrderStatus(rawInput: unknown, client: PrismaClient = prisma): Promise<UpdateOrderStatusResult> {
  await requireAdmin(client)

  const parsed = updateOrderStatusSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { success: false, error: { code: "INVALID_INPUT", message: parsed.error.issues[0]?.message ?? "Geçersiz girdi." } }
  }
  const { orderId, targetStatus, shippingCarrier, trackingNumber } = parsed.data

  try {
    const updatedOrder = await client.$transaction(async (tx) => {
      const lockedRows = await tx.$queryRaw<{ id: string; orderStatus: OrderStatusType }[]>`
        SELECT "id", "orderStatus" FROM "Order" WHERE "id" = ${orderId} FOR UPDATE
      `
      const current = lockedRows[0]
      if (!current) throw new OrderNotFoundError(orderId)

      if (!isValidOrderStatusTransition(current.orderStatus, targetStatus)) {
        throw new InvalidOrderStatusTransitionError(current.orderStatus, targetStatus)
      }

      const data: Prisma.OrderUpdateInput = { orderStatus: targetStatus }
      if (targetStatus === OrderStatus.SHIPPED) {
        data.shippedAt = new Date()
        if (shippingCarrier !== undefined) data.shippingCarrier = shippingCarrier
        if (trackingNumber !== undefined) data.trackingNumber = trackingNumber
      }

      const order = await tx.order.update({ where: { id: orderId }, data, include: ORDER_DETAIL_INCLUDE })

      if (targetStatus === OrderStatus.CANCELLED) {
        await tx.inventoryReservation.updateMany({
          where: { orderId, status: ReservationStatus.ACTIVE },
          data: { status: ReservationStatus.RELEASED, releasedAt: new Date() },
        })
      }

      return order
    })

    return { success: true, order: mapOrderToDetailDto(updatedOrder) }
  } catch (error) {
    if (error instanceof OrderNotFoundError) {
      return { success: false, error: { code: "ORDER_NOT_FOUND", message: "Sipariş bulunamadı." } }
    }
    if (error instanceof InvalidOrderStatusTransitionError) {
      return { success: false, error: { code: "INVALID_TRANSITION", message: error.message } }
    }
    return { success: false, error: genericAdminError() }
  }
}
