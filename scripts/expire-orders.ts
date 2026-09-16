/**
 * `lib/commerce/expire-orders.ts` domain job'ının ELLE çalıştırılabilir
 * sarmalayıcısı (D018 — havale bekleme süresi dolan siparişlerin iptali).
 *
 * Çalıştırma: `npm run expire-orders`
 *
 * Bu bir HTTP yüzeyi DEĞİLDİR — bir shell'den, bir cron'dan veya deploy
 * platformunun zamanlayıcısından çağrılır; bu yüzden admin oturumu aramaz
 * (bkz. domain job'ın dosya başlığı). Production scheduler bağlantısı VIDEO
 * 10'un konusudur; burada yalnızca job'ı tetikleyen ince bir kabuk var.
 *
 * `prisma/seed.ts` ile aynı bağlantı deseni: Prisma 7'nin `"prisma-client"`
 * generator'ı `DATABASE_URL`'i örtük okumaz, bağlantı açıkça bir sürücü
 * adaptörü üzerinden verilir. Üretim singleton'ı (`lib/prisma.ts`) yerine
 * script'e ÖZEL bir client kullanıyoruz ki iş bitince bağlantıyı kapatıp
 * süreç temiz şekilde sonlanabilsin.
 */
import "dotenv/config"
import { PrismaClient } from "../lib/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { expireOverdueBankTransferOrders } from "../lib/commerce/expire-orders"

async function main(): Promise<void> {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  const prisma = new PrismaClient({ adapter })

  try {
    const result = await expireOverdueBankTransferOrders({ client: prisma })

    console.log("Süresi dolan havale siparişleri taraması tamamlandı.")
    console.log(`  Taranan aday sipariş : ${result.scannedOrderCount}`)
    console.log(`  İptal edilen sipariş : ${result.cancelledOrderIds.length}`)
    console.log(`  Serbest bırakılan rez: ${result.releasedReservationCount}`)
    if (result.cancelledOrderIds.length > 0) {
      console.log(`  İptal edilen id'ler  : ${result.cancelledOrderIds.join(", ")}`)
    }
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error: unknown) => {
  // `process.exit` YERİNE `exitCode` — böylece Node, kuyruktaki işleri
  // (bağlantı kapatma, log flush) tamamlayıp doğal olarak sonlanır.
  process.exitCode = 1
  console.error("Süresi dolan sipariş taraması başarısız oldu:", error)
})
