import { Clock, PackageSearch, Truck, CheckCircle2, XCircle, Undo2, Archive, type LucideIcon } from "lucide-react"
import { cn } from "cn"
import { getOrderStatusLabel, getAdminPaymentStatusLabel, getProductStatusLabel } from "./status-labels"

/**
 * VIDEO 08 STEP 3 (part 2) — `docs/DESIGN_DIRECTION.md`'nin "Status Badge
 * Haritası" bölümüyle BİREBİR: üç durum ailesi (OrderStatus/PaymentStatus/
 * ProductStatus) görsel olarak birbirinden AYRIŞIR — aynı ham renk paleti,
 * farklı token + varyant kombinasyonu. Metinler (Türkçe etiketler) zaten
 * var olan `status-labels.ts`'ten geliyor — burada bir ikinci çeviri
 * tablosu YAZILMADI, yalnızca görsel (renk/ikon/varyant) katmanı eklendi.
 *
 * `token: "primary"` spec'in "accent" satırına karşılık gelir — bkz.
 * `app/globals.css`'teki gerekçe notu: ayrı bir "accent" token'ı YOK,
 * spec'in kendi kaynağı zaten `var(--primary)`.
 */
type BadgeToken = "success" | "warning" | "danger" | "primary" | "muted"
type BadgeVariant = "solid" | "outline"

const TOKEN_CLASSES: Record<BadgeToken, Record<BadgeVariant, string>> = {
  success: { solid: "bg-success/10 text-success", outline: "border border-success/30 text-success" },
  warning: { solid: "bg-warning/10 text-warning", outline: "border border-warning/30 text-warning" },
  danger: { solid: "bg-danger/10 text-danger", outline: "border border-danger/30 text-danger" },
  primary: { solid: "bg-primary/10 text-primary", outline: "border border-primary/30 text-primary" },
  muted: { solid: "bg-muted text-muted-foreground", outline: "border border-border text-muted-foreground" },
}

function Badge({
  label,
  token,
  variant,
  icon: Icon,
  interactive = true,
}: {
  label: string
  token: BadgeToken
  variant: BadgeVariant
  icon?: LucideIcon
  /** `false` — PaymentStatus (D026): tıklanabilir/etkileşimli HİSSİ verilmez. */
  interactive?: boolean
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 w-fit items-center gap-1 rounded-full bg-transparent px-2.5 text-xs font-medium whitespace-nowrap",
        TOKEN_CLASSES[token][variant],
        !interactive && "cursor-default"
      )}
    >
      {Icon && <Icon className="size-3" aria-hidden="true" />}
      {label}
    </span>
  )
}

const ORDER_STATUS_BADGE: Record<string, { token: BadgeToken; variant: BadgeVariant; icon: LucideIcon }> = {
  PAYMENT_PENDING: { token: "warning", variant: "solid", icon: Clock },
  PREPARING: { token: "muted", variant: "solid", icon: PackageSearch },
  SHIPPED: { token: "primary", variant: "solid", icon: Truck },
  DELIVERED: { token: "success", variant: "solid", icon: CheckCircle2 },
  // CANCELLED (solid) ile RETURNED (outline) BİLİNÇLİ OLARAK aynı "danger"
  // token'ını ama farklı varyantı kullanır — ikisi karıştırılmamalı (spec).
  CANCELLED: { token: "danger", variant: "solid", icon: XCircle },
  RETURNED: { token: "danger", variant: "outline", icon: Undo2 },
}

function OrderStatusBadge({ status }: { status: string }) {
  const config = ORDER_STATUS_BADGE[status]
  if (!config) return <Badge label={status} token="muted" variant="solid" />
  return <Badge label={getOrderStatusLabel(status)} token={config.token} variant={config.variant} icon={config.icon} />
}

const PAYMENT_STATUS_BADGE: Record<string, BadgeToken> = {
  PENDING: "warning",
  CONFIRMED: "success",
  FAILED: "danger",
}

/** D026 — bu dalgada salt okunur; OrderStatus'un dolu pillerinden kasıtlı olarak daha "sessiz" (outline, ikonsuz, etkileşimsiz). */
function PaymentStatusBadge({ status }: { status: string }) {
  const token = PAYMENT_STATUS_BADGE[status] ?? "muted"
  return <Badge label={getAdminPaymentStatusLabel(status)} token={token} variant="outline" interactive={false} />
}

const PRODUCT_STATUS_BADGE: Record<string, { token: BadgeToken; icon?: LucideIcon }> = {
  DRAFT: { token: "muted" },
  PUBLISHED: { token: "success" },
  ARCHIVED: { token: "muted", icon: Archive },
}

function ProductStatusBadge({ status }: { status: string }) {
  const config = PRODUCT_STATUS_BADGE[status] ?? { token: "muted" as const }
  return <Badge label={getProductStatusLabel(status)} token={config.token} variant="solid" icon={config.icon} />
}

export { OrderStatusBadge, PaymentStatusBadge, ProductStatusBadge }
