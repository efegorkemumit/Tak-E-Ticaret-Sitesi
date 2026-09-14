import Link from "next/link"
import { ClipboardList } from "lucide-react"
import { listProductsForAdmin, listOrdersForAdmin, getProductForAdmin } from "@/lib/admin"
import { formatPriceTRY } from "@/lib/format"
import { AdminPageHeader } from "@/components/admin/page-header"
import { StatCard } from "@/components/admin/stat-card"
import {
  DataTable,
  DataTableHead,
  DataTableBody,
  DataTableRow,
  DataTableHeadCell,
  DataTableCell,
} from "@/components/admin/data-table"
import { EmptyState } from "@/components/ui/empty-state"
import { getOrderStatusLabel, getPaymentMethodLabel } from "@/components/admin/status-labels"
import { formatAdminDateTime } from "@/components/admin/format"

/** `getCurrentAdmin()` her istekte oturum çerezini okur; ayrıca burası artık gerçek DB sorguları yapıyor — build zamanı dondurulmamalı. */
export const dynamic = "force-dynamic"

const RECENT_ORDER_LIMIT = 8

/**
 * VIDEO 07 WAVE B-2b — Wave A'daki `"—"` yer tutucuları GERÇEK veriyle
 * değiştirildi. `listProductsForAdmin`/`listOrdersForAdmin` zaten
 * `requireAdmin()`'i kendi içinde çağırıyor; bu sayfa yalnızca (protected)
 * layout'un koruduğu bir Server Component.
 */
async function loadDashboardData() {
  const [products, orders] = await Promise.all([listProductsForAdmin(), listOrdersForAdmin()])

  const publishedCount = products.filter((p) => p.status === "PUBLISHED").length
  const draftCount = products.filter((p) => p.status === "DRAFT").length
  const pendingOrderCount = orders.filter((o) => o.orderStatus === "PAYMENT_PENDING").length

  // Stokta tükenen varyant sayısı — yalnızca gerçek `availableQuantity === 0`
  // (D018 formülü, `getAvailableQuantities`) sayılır. BİLİNÇLİ OLARAK bir
  // "düşük stok eşiği" (ör. "5 adetten az") metriği EKLENMEDİ: bu bir stok
  // politikası kararıdır ve `docs/DECISIONS.md`'de henüz bir eşik kararı YOK
  // — uydurulmuş bir eşik göstermek yerine yalnızca objektif "0 kaldı"
  // durumu sayılıyor.
  const productsWithVariants = products.filter((p) => p.variantCount > 0)
  const detailedProducts = await Promise.all(productsWithVariants.map((p) => getProductForAdmin(p.id)))
  const outOfStockVariantCount = detailedProducts.reduce(
    (sum, detail) => sum + (detail?.variants.filter((v) => v.availableQuantity <= 0).length ?? 0),
    0
  )

  return {
    totalProductCount: products.length,
    publishedCount,
    draftCount,
    pendingOrderCount,
    totalOrderCount: orders.length,
    outOfStockVariantCount,
    recentOrders: orders.slice(0, RECENT_ORDER_LIMIT),
  }
}

export default async function AdminDashboardPage() {
  const data = await loadDashboardData()

  return (
    <div>
      <AdminPageHeader title="Dashboard" description="Katalog ve sipariş durumuna dair genel özet." />

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Bekleyen Sipariş" value={String(data.pendingOrderCount)} caption="Ödeme bekleniyor" />
        <StatCard label="Toplam Sipariş" value={String(data.totalOrderCount)} />
        <StatCard
          label="Yayındaki Ürün"
          value={String(data.publishedCount)}
          caption={`${data.totalProductCount} üründen, ${data.draftCount} taslak`}
        />
        <StatCard label="Stokta Tükenen Varyant" value={String(data.outOfStockVariantCount)} />
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-medium text-foreground">Son Siparişler</h3>
        <DataTable>
          <DataTableHead>
            <DataTableRow>
              <DataTableHeadCell>Sipariş No</DataTableHeadCell>
              <DataTableHeadCell>Durum</DataTableHeadCell>
              <DataTableHeadCell>Ödeme Yöntemi</DataTableHeadCell>
              <DataTableHeadCell>Tutar</DataTableHeadCell>
              <DataTableHeadCell>Tarih</DataTableHeadCell>
            </DataTableRow>
          </DataTableHead>
          <DataTableBody>
            {data.recentOrders.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <EmptyState
                    icon={<ClipboardList className="size-8" />}
                    title="Henüz sipariş yok"
                    description="İlk sipariş geldiğinde burada listelenecek."
                    className="py-10"
                  />
                </td>
              </tr>
            ) : (
              data.recentOrders.map((order) => (
                <DataTableRow key={order.id}>
                  <DataTableCell>
                    <Link href={`/admin/orders/${order.id}`} className="underline-offset-4 hover:underline">
                      {order.orderNumber}
                    </Link>
                  </DataTableCell>
                  <DataTableCell>{getOrderStatusLabel(order.orderStatus)}</DataTableCell>
                  <DataTableCell>{getPaymentMethodLabel(order.paymentMethod)}</DataTableCell>
                  <DataTableCell>{formatPriceTRY(Number(order.total))}</DataTableCell>
                  <DataTableCell>{formatAdminDateTime(order.createdAt)}</DataTableCell>
                </DataTableRow>
              ))
            )}
          </DataTableBody>
        </DataTable>
      </div>
    </div>
  )
}
