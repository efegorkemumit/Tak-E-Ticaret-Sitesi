/**
 * D018 — havale/EFT bekleme süresi dolmuş siparişlerin otomatik iptali ve
 * rezerve stoğun serbest bırakılması.
 *
 * BU BİR SİSTEM/DOMAIN JOB'IDIR, BİR HTTP İSTEĞİ DEĞİLDİR. Bu yüzden
 * bilinçli olarak `requireAdmin` ÇAĞIRMAZ — ortada bir admin oturumu yoktur,
 * çağıran bir cron/scheduler ya da `scripts/expire-orders.ts`'tir. Buna
 * karşılık bu modülün dışarıya hiçbir Server Action/route yüzeyi YOKTUR;
 * bir gün HTTP üzerinden tetiklenecek olursa, yetkilendirme O KATMANIN işi
 * olur ve burada asla "isteğe güvenen" bir varsayım yapılmaz.
 *
 * Production scheduler bağlantısı (cron/queue/deploy platformu zamanlayıcısı)
 * VIDEO 10'un konusudur; bu turda domain job'ı ve elle çalıştırılabilir
 * script'i hazırdır.
 *
 * NEDEN `paymentStatus` PENDING KALIR: Süre dolması, ödemenin BAŞARISIZ
 * olduğu anlamına gelmez — müşteri havaleyi hiç yapmamıştır, reddedilen bir
 * ödeme yoktur. `FAILED`, admin'in ödemeyi açıkça REDDETTİĞİ durum için
 * ayrılmıştır (bkz. `lib/admin/payments.ts` → `rejectOrderPayment`). Bu yüzden
 * burada yalnızca `orderStatus` CANCELLED'a geçer; iki alanın kasıtlı ayrımı
 * korunur (`docs/ARCHITECTURE.md` §3). D018'in kendisi de ayrı bir "süresi
 * doldu" durumu uydurmamayı, mevcut CANCELLED'ı kullanmayı söyler.
 *
 * FİZİKSEL STOK DÜŞÜRÜLMEZ/GERİ EKLENMEZ: Rezervasyon `Variant.stockQuantity`'yi
 * hiç azaltmamıştı; rezervasyonu RELEASED yapmak, `availableQuantity =
 * stockQuantity - Σ(ACTIVE rezervasyon)` formülü sayesinde o adedi
 * kendiliğinden yeniden satılabilir kılar. Burada stoğa bir şey eklemek ÇİFT
 * SAYIM olurdu.
 */
import { OrderStatus, PaymentMethod, PaymentStatus, ReservationStatus } from "../generated/prisma/client"
import type { PrismaClient } from "../generated/prisma/client"
import type { OrderStatus as OrderStatusType, PaymentStatus as PaymentStatusType } from "../generated/prisma/enums"
import { prisma } from "../prisma"

export interface ExpireOverdueOrdersResult {
  /** Taramada aday bulunan sipariş sayısı (kilit sonrası elenenler dahil). */
  scannedOrderCount: number
  /** Gerçekten CANCELLED'a geçirilen siparişlerin id'leri. */
  cancelledOrderIds: string[]
  /** RELEASED'a çevrilen rezervasyon satırı sayısı. */
  releasedReservationCount: number
}

/** `FOR UPDATE` ile kilitlenen satırdan okunan minimum alan kümesi. */
interface LockedOrderRow {
  id: string
  paymentMethod: string
  paymentStatus: PaymentStatusType
  orderStatus: OrderStatusType
}

/**
 * Süre aşımıyla iptal edilebilecek TEK sipariş durumu.
 *
 * NEDEN BİR "İPTAL EDİLEMEZ" KARA LİSTESİ DEĞİL DE TEK BEYAZ LİSTE:
 * İlk sürüm `[CANCELLED, RETURNED]` dışındaki HER durumu iptal edilebilir
 * sayıyordu. Bu, gerçek verideki bir senaryoda yakalandı (VIDEO 09 tarayıcı
 * testi): ödemesi hâlâ PENDING görünen ama admin'in ÇOKTAN `PREPARING`/
 * `SHIPPED`/`DELIVERED` durumuna ilerlettiği bir sipariş, bu job tarafından
 * sessizce `CANCELLED` yapılıyordu — yani fiilen kargolanmış/teslim edilmiş
 * bir sipariş otomatik olarak iptal ediliyordu. Bu gerçek bir veri kaybı
 * riskidir.
 *
 * İlke: bir admin siparişi `PAYMENT_PENDING`'in ötesine taşıdıysa, o sipariş
 * üzerinde BİLİNÇLİ bir işletme kararı vermiş demektir; otomatik bir zaman
 * aşımı job'ı bu kararı geri alamaz. D018'in "süre dolunca iptal et" kuralı,
 * hâlâ ödeme bekleyen (ve başka hiçbir işlem görmemiş) siparişler içindir.
 *
 * BİLİNÇLİ TAKAS (security incelemesinde ayrıca işaretlendi): Bu daraltma,
 * ödemesi hâlâ PENDING iken admin'in `PREPARING`/`SHIPPED`/`DELIVERED`'a
 * ilerlettiği bir havale siparişinin ACTIVE rezervasyonlarının artık HİÇBİR
 * OTOMATİK YOLLA serbest bırakılmaması demektir; o rezervasyonlar süresiz
 * ACTIVE kalır ve `availableQuantity`'yi kalıcı olarak düşürür. Bu durumdan
 * çıkış elle yapılır: admin ya ödemeyi onaylar (rezervasyon CONSUMED olur) ya
 * reddeder (RELEASED olur) ya da siparişi iptal eder. Takas bilinçlidir —
 * fiilen kargolanmış/teslim edilmiş bir siparişi otomatik iptal etmek, birkaç
 * adet stoğun elle serbest bırakılmasını beklemekten çok daha ağır bir
 * hatadır. Pratikte bu durum zaten anormaldir: admin normalde ödemeyi
 * onaylamadan siparişi hazırlamaya başlamaz.
 *
 * Tip bilinçli olarak `OrderStatusType` olarak genişletildi — aksi halde
 * TypeScript değeri literal tipine daraltır ve kilit sonrası kontrolde okunan
 * GERÇEK durumla karşılaştırma yapılamaz.
 */
const EXPIRABLE_ORDER_STATUS: OrderStatusType = OrderStatus.PAYMENT_PENDING

/**
 * Bekleme süresi dolmuş havale siparişlerini iptal eder ve rezervasyonlarını
 * serbest bırakır.
 *
 * TAMAMEN IDEMPOTENT: İkinci kez çalıştırıldığında 0 aday bulur (iptal edilen
 * siparişler artık `orderStatus = CANCELLED` olduğu için — yani tek izinli
 * `PAYMENT_PENDING` değerinde olmadığı için — tarama filtresine takılmaz,
 * rezervasyonları da artık ACTIVE değildir).
 *
 * Her sipariş AYRI bir transaction'da işlenir — tek bir siparişteki
 * beklenmedik bir durum (ör. araya giren bir admin işlemi) tüm turu
 * düşürmesin, kalan siparişler yine de temizlensin diye. Tur boyunca tek bir
 * dev transaction açmak, ayrıca uzun süreli satır kilitleriyle checkout
 * akışını bloke etme riski taşırdı.
 *
 * `now` ve `client` bilinçli olarak dışarıdan verilebilir (dependency
 * injection): `now` sayesinde testler saatin ilerlemesini beklemek yerine
 * zamanı kendileri belirler, `client` sayesinde testler ayrı bir test
 * veritabanına bağlı kendi `PrismaClient`'ını geçer.
 */
export async function expireOverdueBankTransferOrders(options: {
  now?: Date
  client?: PrismaClient
} = {}): Promise<ExpireOverdueOrdersResult> {
  const now = options.now ?? new Date()
  const client = options.client ?? prisma

  const candidates = await client.order.findMany({
    where: {
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      paymentStatus: PaymentStatus.PENDING,
      orderStatus: EXPIRABLE_ORDER_STATUS,
      // En az bir ACTIVE rezervasyonun süresi dolmuş olmalı. Süresi dolmamış
      // rezervasyonu olan bir sipariş burada hiç aday olmaz.
      reservations: { some: { status: ReservationStatus.ACTIVE, expiresAt: { lte: now } } },
    },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  })

  const cancelledOrderIds: string[] = []
  let releasedReservationCount = 0

  for (const candidate of candidates) {
    const outcome = await client.$transaction(async (tx) => {
      // Kilit ZORUNLU: yukarıdaki tarama kilitsizdi, dolayısıyla okunan
      // değerler şu an BAYAT olabilir (bu arada admin ödemeyi onaylamış ya da
      // siparişi iptal etmiş olabilir). Tüm koşullar kilit ALTINDA tekrar
      // doğrulanır — aksi halde ödemesi yeni onaylanmış bir siparişin
      // rezervasyonlarını serbest bırakabilirdik.
      const lockedRows = await tx.$queryRaw<LockedOrderRow[]>`
        SELECT "id", "paymentMethod", "paymentStatus", "orderStatus"
        FROM "Order" WHERE "id" = ${candidate.id} FOR UPDATE
      `
      const current = lockedRows[0]
      if (!current) return null
      if (current.paymentMethod !== PaymentMethod.BANK_TRANSFER) return null
      if (current.paymentStatus !== PaymentStatus.PENDING) return null
      if (current.orderStatus !== EXPIRABLE_ORDER_STATUS) return null

      const overdueReservationCount = await tx.inventoryReservation.count({
        where: { orderId: candidate.id, status: ReservationStatus.ACTIVE, expiresAt: { lte: now } },
      })
      if (overdueReservationCount === 0) return null

      // KOŞULLU updateMany — "önce oku sonra yaz" DEĞİL. `count === 0` ise
      // araya bir yarış girmiştir; hiçbir rezervasyona dokunmadan çıkarız.
      const cancelled = await tx.order.updateMany({
        where: {
          id: candidate.id,
          paymentStatus: PaymentStatus.PENDING,
          orderStatus: EXPIRABLE_ORDER_STATUS,
        },
        // `paymentStatus` BİLİNÇLİ OLARAK dokunulmaz, PENDING kalır (bkz.
        // dosya başlığı).
        data: { orderStatus: OrderStatus.CANCELLED },
      })
      if (cancelled.count === 0) return null

      // Siparişin TÜM aktif rezervasyonları serbest bırakılır (yalnızca süresi
      // dolanlar değil): sipariş artık iptal edildiğine göre hiçbir satırının
      // stoğu kilitli kalmamalıdır.
      const released = await tx.inventoryReservation.updateMany({
        where: { orderId: candidate.id, status: ReservationStatus.ACTIVE },
        data: { status: ReservationStatus.RELEASED, releasedAt: now },
      })

      return { releasedCount: released.count }
    })

    if (outcome) {
      cancelledOrderIds.push(candidate.id)
      releasedReservationCount += outcome.releasedCount
    }
  }

  return {
    scannedOrderCount: candidates.length,
    cancelledOrderIds,
    releasedReservationCount,
  }
}
