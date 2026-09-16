import { notFound } from "next/navigation"
import { getOrderDetailById } from "@/lib/admin"
import { formatPriceTRY } from "@/lib/format"
import { AdminPageHeader } from "@/components/admin/page-header"
import { AdminFormSection } from "@/components/admin/form-section"
import {
  DataTable,
  DataTableHead,
  DataTableBody,
  DataTableRow,
  DataTableHeadCell,
  DataTableCell,
} from "@/components/admin/data-table"
import { OrderStatusTransitionForm } from "@/components/admin/order-status-transition-form"
import { OrderPaymentActions } from "@/components/admin/order-payment-actions"
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/status-badge"
import { getPaymentMethodLabel } from "@/components/admin/status-labels"
import { formatAdminDateTime } from "@/components/admin/format"
import { updateOrderStatusAction, confirmOrderPaymentAction, rejectOrderPaymentAction } from "../actions"

export const dynamic = "force-dynamic"

/**
 * VIDEO 09 — D026 GEVŞETİLDİ: `paymentStatus` artık salt okunur DEĞİL;
 * havale/EFT siparişlerinde "Ödeme" kartından onaylanıp reddedilebilir
 * (D007 — manuel onay). Sipariş durumu (`orderStatus`) ise ayrı bir alandır
 * ve ödeme onayıyla otomatik değişmez.
 *
 * VIDEO 08 STEP 3 (part 2) — spec'in istediği gruplama BİREBİR: Sipariş /
 * Müşteri / Teslimat / Ürünler / Ödeme / Kargo, her biri kendi kartı.
 */
export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await getOrderDetailById(id)
  if (!order) notFound()

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader title={order.orderNumber} description={formatAdminDateTime(order.createdAt)} />

      <AdminFormSection title="Sipariş">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-muted-foreground">Şu anki durum:</span>
          <OrderStatusBadge status={order.orderStatus} />
        </div>
        <OrderStatusTransitionForm orderId={order.id} currentStatus={order.orderStatus} action={updateOrderStatusAction} />
      </AdminFormSection>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminFormSection title="Müşteri">
          <dl className="flex flex-col gap-1.5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Ad Soyad</dt>
              <dd className="text-foreground">{order.contact.fullName}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Telefon</dt>
              <dd className="text-foreground">{order.contact.phone}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">E-posta</dt>
              <dd className="text-foreground">{order.contact.email}</dd>
            </div>
          </dl>
        </AdminFormSection>

        <AdminFormSection title="Teslimat">
          <p className="text-sm text-foreground">
            {order.deliveryAddress.addressLine}
            <br />
            {order.deliveryAddress.district} / {order.deliveryAddress.city} {order.deliveryAddress.postalCode}
            <br />
            {order.deliveryAddress.country}
          </p>
        </AdminFormSection>
      </div>

      <AdminFormSection title="Ürünler">
        <DataTable>
          <DataTableHead>
            <DataTableRow>
              <DataTableHeadCell>Ürün</DataTableHeadCell>
              <DataTableHeadCell className="w-px whitespace-nowrap">SKU</DataTableHeadCell>
              <DataTableHeadCell className="w-px whitespace-nowrap text-right">Adet</DataTableHeadCell>
              <DataTableHeadCell className="w-px whitespace-nowrap text-right">Birim Fiyat</DataTableHeadCell>
              <DataTableHeadCell className="w-px whitespace-nowrap text-right">Toplam</DataTableHeadCell>
            </DataTableRow>
          </DataTableHead>
          <DataTableBody>
            {order.items.map((item, index) => (
              <DataTableRow key={`${item.skuSnapshot}-${index}`}>
                <DataTableCell>
                  {item.productNameSnapshot}
                  <span className="block text-xs text-muted-foreground">{item.variantDescriptionSnapshot}</span>
                </DataTableCell>
                <DataTableCell className="whitespace-nowrap text-muted-foreground">{item.skuSnapshot}</DataTableCell>
                <DataTableCell className="text-right tabular-nums">{item.quantity}</DataTableCell>
                <DataTableCell className="text-right tabular-nums">{formatPriceTRY(Number(item.unitPriceSnapshot))}</DataTableCell>
                <DataTableCell className="text-right tabular-nums">{formatPriceTRY(Number(item.lineTotal))}</DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>

        <dl className="mt-3 flex max-w-xs flex-col gap-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Ara Toplam</dt>
            <dd className="text-foreground tabular-nums">{formatPriceTRY(Number(order.subtotal))}</dd>
          </div>
          <div className="flex justify-between font-medium">
            <dt className="text-foreground">Toplam</dt>
            <dd className="text-foreground tabular-nums">{formatPriceTRY(Number(order.total))}</dd>
          </div>
          {order.giftPackagingSelected && <p className="text-xs text-muted-foreground">Hediye paketleme seçildi.</p>}
        </dl>
      </AdminFormSection>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminFormSection
          title="Ödeme"
          description="Havale/EFT ödemeleri bu karttan manuel olarak onaylanır veya reddedilir (D007). Sipariş durumu ayrı bir alandır ve ödeme onayıyla otomatik değişmez."
        >
          <dl className="flex flex-col gap-1.5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Yöntem</dt>
              <dd className="text-foreground">{getPaymentMethodLabel(order.paymentMethod)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Durum</dt>
              <dd>
                <PaymentStatusBadge status={order.paymentStatus} />
              </dd>
            </div>
          </dl>

          <OrderPaymentActions
            orderId={order.id}
            paymentMethod={order.paymentMethod}
            paymentStatus={order.paymentStatus}
            confirmAction={confirmOrderPaymentAction}
            rejectAction={rejectOrderPaymentAction}
          />
        </AdminFormSection>

        <AdminFormSection title="Kargo">
          {order.shippingCarrier ? (
            <dl className="flex flex-col gap-1.5 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Kargo Firması</dt>
                <dd className="text-foreground">{order.shippingCarrier}</dd>
              </div>
              {order.trackingNumber && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Takip No</dt>
                  <dd className="text-foreground">{order.trackingNumber}</dd>
                </div>
              )}
              {order.shippedAt && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Kargoya Veriliş</dt>
                  <dd className="text-foreground">{formatAdminDateTime(order.shippedAt)}</dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">Henüz kargo bilgisi girilmedi — sipariş &ldquo;Kargoya Verildi&rdquo; durumuna geçtiğinde girilebilir.</p>
          )}
        </AdminFormSection>
      </div>
    </div>
  )
}
