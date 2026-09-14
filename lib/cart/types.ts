/**
 * Client-side sepet veri modeli (D022 — sunucuda kalıcı bir Cart/CartItem
 * kaydı YOK, sepetin tamamı yalnızca burada, localStorage'da yaşar).
 *
 * KRİTİK: `unitPrice`, `productName`, `attributeSummary`, `image` gibi
 * alanlar YALNIZCA GÖRÜNTÜLEME amaçlıdır. Checkout'ta sunucuya asla
 * gönderilmezler — sunucu her zaman yalnızca `variantId`+`quantity`'yi kabul
 * eder ve fiyat/ürün bilgisini kendi veritabanından yeniden çözer
 * (`docs/ARCHITECTURE.md` §4.1 "Kritik ilke"). Bu alanlar bayatlayabilir
 * (ör. fiyat admin panelden değiştirilmiş olabilir) — sepette gösterilen
 * tutar her zaman bir ÖNİZLEMEDİR, nihai tutar checkout sonucundan gelir.
 */
export interface CartLine {
  variantId: string
  quantity: number
  productSlug: string
  productName: string
  /** Ör. "Beden: 16" — seçilebilir özniteliği olmayan ürünlerde boş string. */
  attributeSummary: string
  /** Ekleme anındaki fiyat, yalnızca önizleme (bkz. dosya başı not). */
  unitPrice: string
  image: { url: string; alt: string; isPlaceholder: boolean }
  giftPackagingAvailable: boolean
}

export interface CartState {
  lines: CartLine[]
}
