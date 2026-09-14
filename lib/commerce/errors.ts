/**
 * Commerce servis katmanının fırlattığı hata tipleri.
 *
 * Amaç: hiçbir ham Prisma/DB hatası (bağlantı string'i, sürücü hata mesajı,
 * SQL parçası vb.) hiçbir zaman doğrudan çağırana/istemciye sızmasın. Bu
 * sınıflar, "neden başarısız olduğu" bilgisini yapılandırılmış ve güvenle
 * dışarı taşınabilir şekilde taşır; HTTP durum kodu eşlemesi (ör. 404/409/422)
 * route katmanının işidir — bu tur route yazmıyor, yalnızca servis hatasını
 * tanımlıyor.
 */
import { Prisma } from "../generated/prisma/client"

/**
 * P2002 (unique constraint) hatasının BELİRLİ bir alana ait olup olmadığını
 * kontrol eder — "önce SELECT et, sonra INSERT et" (yarış koşulu taşır)
 * yerine "dene, çakışırsa yakala" deseninin ortak yardımcı fonksiyonu.
 * `create-order.ts`'te idempotency key çakışması için kurulan desenin
 * genelleştirilmiş hâli — Wave B'de `lib/admin/` (slug/SKU/sortOrder
 * benzersizliği için) de bunu kullanır, aynı formülün ikinci bir kopyası
 * yazılmaz.
 *
 * GERÇEK REGRESYON DÜZELTMESİ (Wave B sırasında gerçek eşzamanlı bir
 * `orderIdempotencyKey` çakışması test edilerek bulundu — bkz. takım
 * raporu): `@prisma/adapter-pg` + Prisma 7.10 ile P2002 hatasının
 * `error.meta.target` (alan adı dizisi) ALANI ARTIK DOLMUYOR; bunun yerine
 * ham Postgres kısıt adı `error.meta.driverAdapterError.cause.constraint.index`
 * altında geliyor (ör. `"Order_orderIdempotencyKey_key"`). Bu fonksiyon
 * ESKİ şekli hâlâ destekler (başka bir Prisma/adapter kombinasyonunda geri
 * dönebilir diye) ve YENİ şekli de kontrol eder — Prisma'nın `@unique`/
 * `@@unique` için varsayılan adlandırma kuralı `<Model>_<alan(lar)>_key`
 * olduğundan, hedef alan adının kısıt adının bir alt dizesi olması
 * güvenilir bir sinyaldir (gerçek DB'ye karşı doğrulandı).
 */
export function isUniqueConstraintViolation(error: unknown, targetField: string): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return false
  }

  const meta = error.meta as
    | { target?: unknown; driverAdapterError?: { cause?: { constraint?: { index?: unknown } } } }
    | undefined

  if (Array.isArray(meta?.target) && (meta.target as unknown[]).includes(targetField)) {
    return true
  }

  const constraintIndex = meta?.driverAdapterError?.cause?.constraint?.index
  return typeof constraintIndex === "string" && constraintIndex.includes(targetField)
}

export class CommerceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = new.target.name
  }
}

/** Zod doğrulaması dışında kalan, ama yine de geçersiz olan girdi durumları için. */
export class InvalidCheckoutInputError extends CommerceError {}

export class VariantNotFoundError extends CommerceError {
  constructor(public readonly variantIds: string[]) {
    super(`Variant(lar) bulunamadı: ${variantIds.join(", ")}`)
  }
}

/** D021 — yalnızca PUBLISHED ürünler satın alınabilir. */
export class ProductNotPurchasableError extends CommerceError {
  constructor(
    public readonly variantId: string,
    public readonly productStatus: string
  ) {
    super(`Variant ${variantId} satın alınamaz: ürünün yayın durumu ${productStatus}`)
  }
}

export class InsufficientStockError extends CommerceError {
  constructor(
    public readonly variantId: string,
    public readonly requestedQuantity: number,
    public readonly availableQuantity: number
  ) {
    super(
      `Yetersiz stok: variant ${variantId} için ${requestedQuantity} adet istendi, ` +
        `${availableQuantity} adet kullanılabilir`
    )
  }
}

/**
 * Aynı `orderIdempotencyKey` daha önce FARKLI bir sipariş içeriğiyle
 * kullanılmış (bkz. `create-order.ts` → `assertSamePayload`). Bu durumda
 * eski siparişi sessizce döndürmüyoruz — bu, istemcinin fark etmediği bir
 * hatayı (ör. yeniden kullanılmış/çakışan bir idempotency key) gizleyebilir.
 */
export class IdempotencyKeyConflictError extends CommerceError {
  constructor(public readonly orderIdempotencyKey: string) {
    super(`orderIdempotencyKey '${orderIdempotencyKey}' farklı bir sipariş içeriğiyle daha önce kullanılmış`)
  }
}
