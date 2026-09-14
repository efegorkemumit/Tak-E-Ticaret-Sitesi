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
