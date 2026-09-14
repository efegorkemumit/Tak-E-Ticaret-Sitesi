import { notFound } from "next/navigation"
import { getOrderDetailById } from "@/lib/admin"
import { formatPriceTRY } from "@/lib/format"
import { AdminPageHeader } from "@/components/admin/page-header"
import {
  DataTable,
  DataTableHead,
  DataTableBody,
  DataTableRow,
  DataTableHeadCell,
  DataTableCell,
} from "@/components/admin/data-table"
import { OrderStatusTransitionForm } from "@/components/admin/order-status-transition-form"
import { getOrderStatusLabel, getPaymentMethodLabel, getPaymentStatusLabel } from "@/components/admin/status-labels"
import { formatAdminDateTime } from "@/components/admin/format"
import { updateOrderStatusAction } from "../actions"

export const dynamic = "force-dynamic"

/**
 * D026 sert kuralı: `paymentStatus` burada YALNIZCA GÖRÜNTÜLENİR (bkz.
 * aşağıdaki salt-okunur `<dl>` satırı) — hiçbir düzenleme kontrolü yok.
 * Sipariş durumu geçişi ayrı bir bölümde, `OrderStatusTransitionForm` ile.
 */
export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await getOrderDetailById(id)
  if (!order) notFound()

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader title={order.orderNumber} description={formatAdminDateTime(order.createdAt)} />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-md border border-border p-4">
          <h3 className="mb-3 text-sm font-medium text-foreground">Müşteri</h3>
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
        </section>

        <section className="rounded-md border border-border p-4">
          <h3 className="mb-3 text-sm font-medium text-foreground">Teslimat Adresi</h3>
          <p className="text-sm text-foreground">
            {order.deliveryAddress.addressLine}
            <br />
            {order.deliveryAddress.district} / {order.deliveryAddress.city} {order.deliveryAddress.postalCode}
            <br />
            {order.deliveryAddress.country}
          </p>
        </section>
      </div>

      <section>
        <h3 className="mb-3 text-sm font-medium text-foreground">Kalemler</h3>
        <DataTable>
          <DataTableHead>
            <DataTableRow>
              <DataTableHeadCell>Ürün</DataTableHeadCell>
              <DataTableHeadCell>SKU</DataTableHeadCell>
              <DataTableHeadCell>Adet</DataTableHeadCell>
              <DataTableHeadCell>Birim Fiyat</DataTableHeadCell>
              <DataTableHeadCell>Toplam</DataTableHeadCell>
            </DataTableRow>
          </DataTableHead>
          <DataTableBody>
            {order.items.map((item, index) => (
              <DataTableRow key={`${item.skuSnapshot}-${index}`}>
                <DataTableCell>
                  {item.productNameSnapshot}
                  <span className="block text-xs text-muted-foreground">{item.variantDescriptionSnapshot}</span>
                </DataTableCell>
                <DataTableCell className="text-muted-foreground">{item.skuSnapshot}</DataTableCell>
                <DataTableCell>{item.quantity}</DataTableCell>
                <DataTableCell>{formatPriceTRY(Number(item.unitPriceSnapshot))}</DataTableCell>
                <DataTableCell>{formatPriceTRY(Number(item.lineTotal))}</DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>

        <dl className="mt-3 flex max-w-xs flex-col gap-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Ara Toplam</dt>
            <dd className="text-foreground">{formatPriceTRY(Number(order.subtotal))}</dd>
          </div>
          <div className="flex justify-between font-medium">
            <dt className="text-foreground">Toplam</dt>
            <dd className="text-foreground">{formatPriceTRY(Number(order.total))}</dd>
          </div>
          {order.giftPackagingSelected && <p className="text-xs text-muted-foreground">Hediye paketleme seçildi.</p>}
        </dl>
      </section>

      <section className="rounded-md border border-border p-4">
        <h3 className="mb-3 text-sm font-medium text-foreground">Ödeme (salt okunur)</h3>
        <dl className="flex flex-col gap-1.5 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Yöntem</dt>
            <dd className="text-foreground">{getPaymentMethodLabel(order.paymentMethod)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Durum</dt>
            <dd className="text-foreground">{getPaymentStatusLabel(order.paymentStatus)}</dd>
          </div>
        </dl>
        <p className="mt-2 text-xs text-muted-foreground">
          Ödeme durumu bu panelden değiştirilemez (D026) — yalnızca payments modülü günceller.
        </p>
      </section>

      <section className="rounded-md border border-border p-4">
        <h3 className="mb-3 text-sm font-medium text-foreground">Sipariş Durumu</h3>
        <p className="mb-4 text-sm text-foreground">Şu anki durum: {getOrderStatusLabel(order.orderStatus)}</p>
        {order.shippingCarrier && (
          <p className="mb-2 text-sm text-muted-foreground">
            Kargo: {order.shippingCarrier}
            {order.trackingNumber && ` — Takip No: ${order.trackingNumber}`}
          </p>
        )}
        <OrderStatusTransitionForm orderId={order.id} currentStatus={order.orderStatus} action={updateOrderStatusAction} />
      </section>
    </div>
  )
}
