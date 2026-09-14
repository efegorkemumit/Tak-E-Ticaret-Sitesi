import { ClipboardList } from "lucide-react"
import { listOrdersForAdmin, getOrderDetailById } from "@/lib/admin"
import { formatPriceTRY } from "@/lib/format"
import { AdminPageHeader } from "@/components/admin/page-header"
import {
  DataTable,
  DataTableHead,
  DataTableBody,
  DataTableClickableRow,
  DataTableHeadCell,
  DataTableCell,
} from "@/components/admin/data-table"
import { AdminMobileRecordCard } from "@/components/admin/mobile-record-card"
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { OrderFilterForm } from "@/components/admin/order-filter-form"
import { getPaymentMethodLabel } from "@/components/admin/status-labels"
import { formatAdminDateTime } from "@/components/admin/format"

export const dynamic = "force-dynamic"

/**
 * Filtreler URL query param'larından okunur (bkz. `OrderFilterForm`).
 * `listOrdersForAdmin` geçersiz/eksik param'ları kendi içinde `safeParse` ile
 * yoksayar (bkz. `lib/admin/orders.ts`) — burada ayrıca bir doğrulama YOK.
 *
 * `AdminOrderListItemDto` müşteri adı TAŞIMIYOR (yalnızca sipariş özet
 * alanları) — spec'in istediği "Müşteri" sütunu için, ürün listesindeki AYNI
 * desen (`getProductForAdmin` N+1) burada `getOrderDetailById` ile
 * uygulandı; küçük sipariş hacminde kabul edilebilir bir maliyet.
 */
export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ orderNumber?: string; orderStatus?: string; paymentMethod?: string }>
}) {
  const params = await searchParams
  const orders = await listOrdersForAdmin({
    orderNumber: params.orderNumber,
    orderStatus: params.orderStatus,
    paymentMethod: params.paymentMethod,
  })
  const details = await Promise.all(orders.map((order) => getOrderDetailById(order.id)))
  const rows = orders.map((order, index) => ({ ...order, customerName: details[index]?.contact.fullName ?? "—" }))

  return (
    <div>
      <AdminPageHeader title="Siparişler" description="Ödeme durumu (D026) yalnızca görüntülenir — yalnızca sipariş durumu buradan değiştirilir." />

      <OrderFilterForm
        initialOrderNumber={params.orderNumber ?? ""}
        initialOrderStatus={params.orderStatus ?? ""}
        initialPaymentMethod={params.paymentMethod ?? ""}
      />

      {rows.length === 0 ? (
        <DataTable>
          <DataTableBody>
            <tr>
              <td>
                <EmptyState
                  icon={<ClipboardList className="size-8" />}
                  title="Sipariş bulunamadı"
                  description="Filtrelerle eşleşen bir sipariş yok."
                  className="py-10"
                />
              </td>
            </tr>
          </DataTableBody>
        </DataTable>
      ) : (
        <>
          <DataTable className="hidden lg:block">
            <DataTableHead>
              <tr>
                <DataTableHeadCell className="w-px whitespace-nowrap">Sipariş No</DataTableHeadCell>
                <DataTableHeadCell>Müşteri</DataTableHeadCell>
                <DataTableHeadCell className="w-px whitespace-nowrap">Sipariş Durumu</DataTableHeadCell>
                <DataTableHeadCell className="w-px whitespace-nowrap">Ödeme Durumu</DataTableHeadCell>
                <DataTableHeadCell className="w-px whitespace-nowrap">Ödeme Yöntemi</DataTableHeadCell>
                <DataTableHeadCell className="text-right">Tutar</DataTableHeadCell>
                <DataTableHeadCell className="w-px whitespace-nowrap">Tarih</DataTableHeadCell>
                <DataTableHeadCell />
              </tr>
            </DataTableHead>
            <DataTableBody>
              {rows.map((order) => (
                <DataTableClickableRow key={order.id} href={`/admin/orders/${order.id}`}>
                  <DataTableCell className="whitespace-nowrap font-medium">{order.orderNumber}</DataTableCell>
                  <DataTableCell className="text-muted-foreground">{order.customerName}</DataTableCell>
                  <DataTableCell>
                    <OrderStatusBadge status={order.orderStatus} />
                  </DataTableCell>
                  <DataTableCell>
                    <PaymentStatusBadge status={order.paymentStatus} />
                  </DataTableCell>
                  <DataTableCell className="whitespace-nowrap">{getPaymentMethodLabel(order.paymentMethod)}</DataTableCell>
                  <DataTableCell className="text-right font-medium tabular-nums">{formatPriceTRY(Number(order.total))}</DataTableCell>
                  <DataTableCell className="whitespace-nowrap text-muted-foreground">{formatAdminDateTime(order.createdAt)}</DataTableCell>
                </DataTableClickableRow>
              ))}
            </DataTableBody>
          </DataTable>

          <div className="flex flex-col gap-2 lg:hidden">
            {rows.map((order) => (
              <AdminMobileRecordCard
                key={order.id}
                href={`/admin/orders/${order.id}`}
                title={order.orderNumber}
                badge={<OrderStatusBadge status={order.orderStatus} />}
                secondaryBadge={
                  <>
                    <span className="text-admin-helper text-muted-foreground">Ödeme:</span>
                    <PaymentStatusBadge status={order.paymentStatus} />
                  </>
                }
                meta={`${order.customerName} · ${formatAdminDateTime(order.createdAt)}`}
                value={formatPriceTRY(Number(order.total))}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
