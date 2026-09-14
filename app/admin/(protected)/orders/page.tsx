import Link from "next/link"
import { ClipboardList } from "lucide-react"
import { listOrdersForAdmin } from "@/lib/admin"
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
import { EmptyState } from "@/components/ui/empty-state"
import { OrderFilterForm } from "@/components/admin/order-filter-form"
import { getOrderStatusLabel, getPaymentMethodLabel } from "@/components/admin/status-labels"
import { formatAdminDateTime } from "@/components/admin/format"

export const dynamic = "force-dynamic"

/**
 * Filtreler URL query param'larından okunur (bkz. `OrderFilterForm`).
 * `listOrdersForAdmin` geçersiz/eksik param'ları kendi içinde `safeParse` ile
 * yoksayar (bkz. `lib/admin/orders.ts`) — burada ayrıca bir doğrulama YOK.
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

  return (
    <div>
      <AdminPageHeader title="Siparişler" description="Ödeme durumu (D026) yalnızca görüntülenir — yalnızca sipariş durumu buradan değiştirilir." />

      <OrderFilterForm
        initialOrderNumber={params.orderNumber ?? ""}
        initialOrderStatus={params.orderStatus ?? ""}
        initialPaymentMethod={params.paymentMethod ?? ""}
      />

      <DataTable>
        <DataTableHead>
          <DataTableRow>
            <DataTableHeadCell>Sipariş No</DataTableHeadCell>
            <DataTableHeadCell>Durum</DataTableHeadCell>
            <DataTableHeadCell>Ödeme Yöntemi</DataTableHeadCell>
            <DataTableHeadCell>Tutar</DataTableHeadCell>
            <DataTableHeadCell>Tarih</DataTableHeadCell>
            <DataTableHeadCell />
          </DataTableRow>
        </DataTableHead>
        <DataTableBody>
          {orders.length === 0 ? (
            <tr>
              <td colSpan={6}>
                <EmptyState
                  icon={<ClipboardList className="size-8" />}
                  title="Sipariş bulunamadı"
                  description="Filtrelerle eşleşen bir sipariş yok."
                  className="py-10"
                />
              </td>
            </tr>
          ) : (
            orders.map((order) => (
              <DataTableRow key={order.id}>
                <DataTableCell>{order.orderNumber}</DataTableCell>
                <DataTableCell>{getOrderStatusLabel(order.orderStatus)}</DataTableCell>
                <DataTableCell>{getPaymentMethodLabel(order.paymentMethod)}</DataTableCell>
                <DataTableCell>{formatPriceTRY(Number(order.total))}</DataTableCell>
                <DataTableCell className="text-muted-foreground">{formatAdminDateTime(order.createdAt)}</DataTableCell>
                <DataTableCell className="text-right">
                  <Link href={`/admin/orders/${order.id}`} className="text-sm underline-offset-4 hover:underline">
                    Detay
                  </Link>
                </DataTableCell>
              </DataTableRow>
            ))
          )}
        </DataTableBody>
      </DataTable>
    </div>
  )
}
