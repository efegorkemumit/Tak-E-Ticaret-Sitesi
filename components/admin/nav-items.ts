import { LayoutDashboard, Package, FolderTree, Layers, Shapes, Receipt, type LucideIcon } from "lucide-react"

/**
 * Admin sidebar/mobil navigasyonun tek doğruluk kaynağı — hem `AdminSidebar`
 * hem `AdminMobileNav` hem `AdminTopbar` (breadcrumb'ın orta segmentini mevcut
 * path'ten türetmek için) burayı kullanır, liste tek yerde tanımlanır.
 *
 * VIDEO 08 STEP 3 — her öğeye bir `lucide-react` ikonu eklendi, öğeler
 * mantıksal gruplara ayrıldı (Katalog / Satış) — sidebar/mobil menü artık
 * `ADMIN_NAV_GROUPS`'u okuyor. `ADMIN_NAV_ITEMS` (düz liste) geriye dönük
 * uyumluluk için korunuyor — `isNavItemActive`/breadcrumb gibi gruplamayı
 * umursamayan tüketiciler hâlâ onu kullanabilir.
 */
export interface AdminNavItem {
  label: string
  href: string
  icon: LucideIcon
}

export interface AdminNavGroup {
  /** `null` — Dashboard gibi gruplama başlığı gerektirmeyen tekil üst öğe. */
  label: string | null
  items: AdminNavItem[]
}

/**
 * İkon eşlemesi `docs/DESIGN_DIRECTION.md`nin admin spesifikasyonuyla
 * BİREBİR (Dashboard→`LayoutDashboard`, Ürünler→`Package`, Kategoriler→
 * `FolderTree`, Koleksiyonlar→`Layers`, Siparişler→`Receipt`) — TEK istisna:
 * spec listesinde "Ayarlar→`Settings`" de vardı ama bizim `/admin/settings`
 * diye bir route'umuz YOK (kapsam dışı, bu turda İCAT EDİLMEDİ) ve spec
 * bizim gerçek "Öznitelikler" route'umuzdan hiç bahsetmiyordu (muhtemelen
 * genel bir referans listesiydi) — "Öznitelikler" mevcut `Shapes` ikonunu
 * korudu, "Ayarlar" eklenmedi.
 */
export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  // DÜZELTME (final inceleme) — "Dashboard" diğer tüm nav öğeleri Türkçeyken
  // tek İngilizce kelimeydi (D002 tutarsızlığı); "Genel Bakış" kullanıldı.
  { label: null, items: [{ label: "Genel Bakış", href: "/admin", icon: LayoutDashboard }] },
  {
    label: "Katalog",
    items: [
      { label: "Ürünler", href: "/admin/products", icon: Package },
      { label: "Kategoriler", href: "/admin/categories", icon: FolderTree },
      { label: "Koleksiyonlar", href: "/admin/collections", icon: Layers },
      { label: "Öznitelikler", href: "/admin/attributes", icon: Shapes },
    ],
  },
  { label: "Satış", items: [{ label: "Siparişler", href: "/admin/orders", icon: Receipt }] },
]

export const ADMIN_NAV_ITEMS: AdminNavItem[] = ADMIN_NAV_GROUPS.flatMap((group) => group.items)

/**
 * `/admin` yalnızca TAM eşleşmede aktif sayılır (aksi halde her admin
 * sayfasında Dashboard da aktif görünürdü); diğer tüm öğeler prefix eşleşmesi
 * kullanır (ör. `/admin/products/123` hâlâ "Ürünler"i vurgular).
 */
export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin"
  return pathname === href || pathname.startsWith(`${href}/`)
}

/** Geçerli path'e karşılık gelen nav öğesinin TAMAMINI (etiket + href) döner — breadcrumb'ın orta segmenti için. */
export function getActiveNavItem(pathname: string): AdminNavItem | undefined {
  return ADMIN_NAV_ITEMS.find((item) => isNavItemActive(pathname, item.href))
}
