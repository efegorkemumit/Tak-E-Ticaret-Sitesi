/**
 * Admin sidebar/mobil navigasyonun tek doğruluk kaynağı — hem `AdminSidebar`
 * (aktif link vurgusu) hem `AdminMobileNav` hem `AdminTopbar` (sayfa başlığını
 * mevcut path'ten türetmek için) burayı kullanır, liste tek yerde tanımlanır.
 *
 * Wave B'de bu route'ların (Dashboard hariç) sayfaları henüz yok — bu bir
 * Wave A shell turu, sidebar/menü iskeleti şimdiden kuruluyor.
 */
export interface AdminNavItem {
  label: string
  href: string
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin" },
  { label: "Ürünler", href: "/admin/products" },
  { label: "Kategoriler", href: "/admin/categories" },
  { label: "Koleksiyonlar", href: "/admin/collections" },
  { label: "Öznitelikler", href: "/admin/attributes" },
  { label: "Siparişler", href: "/admin/orders" },
]

/**
 * `/admin` yalnızca TAM eşleşmede aktif sayılır (aksi halde her admin
 * sayfasında Dashboard da aktif görünürdü); diğer tüm öğeler prefix eşleşmesi
 * kullanır (ör. `/admin/products/123` hâlâ "Ürünler"i vurgular).
 */
export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin"
  return pathname === href || pathname.startsWith(`${href}/`)
}

/** Topbar'ın "sayfa başlığı" alanı için mevcut path'e karşılık gelen nav etiketini döner. */
export function getActiveNavLabel(pathname: string): string {
  const match = ADMIN_NAV_ITEMS.find((item) => isNavItemActive(pathname, item.href))
  return match?.label ?? "Admin Paneli"
}
