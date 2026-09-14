import { randomBytes } from "node:crypto"

/**
 * `ORD-YYYYMMDD-XXXXXX` biçiminde, insan-okunabilir ama TAHMİN EDİLMESİ ZOR
 * bir sipariş numarası üretir. Sıradan artan bir sayaç (`ORD-000001` gibi)
 * bilinçli olarak KULLANILMAZ — security'nin planlama turundaki
 * recommendation'ıyla tutarlı (sipariş numarasının opak/rastgele üretilmesi;
 * `docs/AGENT_TEAM.md` Recommendations). Bu bir proje kararı değil, bir
 * implementasyon detayıdır.
 *
 * Not: `orderNumber` sistemler arası otomatik eşleştirmenin canonical
 * anahtarı DEĞİLDİR (o `Order.id`'dir, bkz. `docs/ARCHITECTURE.md` §5) —
 * yalnızca insana dönük bir referanstır (havale açıklaması, olası manuel
 * Shopier eşleştirmesi). Bu yüzden burada kriptografik olmayan ama tahmin
 * edilmesi pratikte zor bir rastgelelik yeterlidir.
 */
export function generateOrderNumber(now: Date = new Date()): string {
  const datePart = [
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, "0"),
    String(now.getUTCDate()).padStart(2, "0"),
  ].join("")

  const suffix = randomBytes(6)
    .toString("base64")
    .replace(/[^A-Z0-9]/gi, "")
    .toUpperCase()
    .padEnd(6, "0")
    .slice(0, 6)

  return `ORD-${datePart}-${suffix}`
}
