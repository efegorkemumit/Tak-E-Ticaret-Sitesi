import { ClipboardList, Clock, Receipt, Package, PackageX } from "lucide-react"
import { listProductsForAdmin, listOrdersForAdmin, getProductForAdmin } from "@/lib/admin"
import { formatPriceTRY } from "@/lib/format"
import { AdminPageHeader } from "@/components/admin/page-header"
import { StatCard } from "@/components/admin/stat-card"
import {
  DataTable,
  DataTableHead,
  DataTableBody,
  DataTableClickableRow,
  DataTableHeadCell,
  DataTableCell,
} from "@/components/admin/data-table"
import { AdminMobileRecordCard } from "@/components/admin/mobile-record-card"
import { OrderStatusBadge } from "@/components/admin/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { getPaymentMethodLabel } from "@/components/admin/status-labels"
import { formatAdminDateTime } from "@/components/admin/format"

/** `getCurrentAdmin()` her istekte oturum çerezini okur; ayrıca burası artık gerçek DB sorguları yapıyor — build zamanı dondurulmamalı. */
export const dynamic = "force-dynamic"

const RECENT_ORDER_LIMIT = 8

/**
 * `listProductsForAdmin`/`listOrdersForAdmin` zaten `requireAdmin()`'i kendi
 * içinde çağırıyor; bu sayfa yalnızca (protected) layout'un koruduğu bir
 * Server Component.
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
      <AdminPageHeader title="Genel Bakış" description="Katalog ve sipariş durumuna dair genel özet." />

      {/* DÜZELTME (final QA) — 4 sütun eşiği `lg:` (1024) → `xl:` (1280).
          1024–1279 aralığında sidebar (248px) zaten görünür oluyor ama
          padding hâlâ dar (24px); 4 dar sütun etiket/caption metnini 3-4
          parçalı satıra bölüyordu (`ad-dashboard-1024` bulgusu). Bu aralık
          artık 768 ile aynı temiz 2 sütunu kullanıyor, 4 sütun yalnızca
          gerçekten yeterli genişlik olduğunda (`xl:`, 32px padding) başlıyor. */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Clock} label="Bekleyen Sipariş" value={String(data.pendingOrderCount)} caption="Ödeme bekleniyor" />
        <StatCard icon={Receipt} label="Toplam Sipariş" value={String(data.totalOrderCount)} />
        <StatCard
          icon={Package}
          label="Yayındaki Ürün"
          value={String(data.publishedCount)}
          caption={`${data.totalProductCount} üründen, ${data.draftCount} taslak`}
        />
        <StatCard
          icon={PackageX}
          label="Stokta Tükenen Varyant"
          value={String(data.outOfStockVariantCount)}
          tone={data.outOfStockVariantCount > 0 ? "warning" : "neutral"}
        />
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-admin-section-title font-semibold text-foreground">Son Siparişler</h3>

        {data.recentOrders.length === 0 ? (
          <DataTable>
            <DataTableBody>
              <tr>
                <td>
                  <EmptyState
                    icon={<ClipboardList className="size-8" />}
                    title="Henüz sipariş yok"
                    description="İlk sipariş geldiğinde burada listelenecek."
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
                  <DataTableHeadCell className="w-px whitespace-nowrap">Durum</DataTableHeadCell>
                  <DataTableHeadCell className="w-px whitespace-nowrap">Ödeme Yöntemi</DataTableHeadCell>
                  <DataTableHeadCell className="text-right">Tutar</DataTableHeadCell>
                  <DataTableHeadCell className="w-px whitespace-nowrap">Tarih</DataTableHeadCell>
                  <DataTableHeadCell />
                </tr>
              </DataTableHead>
              <DataTableBody>
                {data.recentOrders.map((order) => (
                  <DataTableClickableRow key={order.id} href={`/admin/orders/${order.id}`}>
                    <DataTableCell className="whitespace-nowrap font-medium">{order.orderNumber}</DataTableCell>
                    <DataTableCell>
                      <OrderStatusBadge status={order.orderStatus} />
                    </DataTableCell>
                    <DataTableCell className="whitespace-nowrap">{getPaymentMethodLabel(order.paymentMethod)}</DataTableCell>
                    <DataTableCell className="text-right font-medium tabular-nums">{formatPriceTRY(Number(order.total))}</DataTableCell>
                    <DataTableCell className="whitespace-nowrap text-muted-foreground">{formatAdminDateTime(order.createdAt)}</DataTableCell>
                  </DataTableClickableRow>
                ))}
              </DataTableBody>
            </DataTable>

            <div className="flex flex-col gap-2 lg:hidden">
              {data.recentOrders.map((order) => (
                <AdminMobileRecordCard
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  title={order.orderNumber}
                  badge={<OrderStatusBadge status={order.orderStatus} />}
                  meta={`${getPaymentMethodLabel(order.paymentMethod)} · ${formatAdminDateTime(order.createdAt)}`}
                  value={formatPriceTRY(Number(order.total))}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
