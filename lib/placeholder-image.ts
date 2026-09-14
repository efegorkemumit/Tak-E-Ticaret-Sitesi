/**
 * `ProductImage` modeli artık şemada var (`CatalogImageDto`,
 * `lib/commerce/catalog.ts`) — bu dosya ARTIK birincil görsel kaynağı
 * DEĞİLDİR, yalnızca iki meşru fallback senaryosu için kullanılır:
 *
 * 1. Bir ürünün henüz hiç görseli yüklenmemişse (`product.images` boş dizi).
 * 2. Ana sayfadaki editorial/koleksiyon-tanıtım blokları (`EditorialAsymmetricBlock`
 *    vb.) — bunlar `Product` ile ilişkili değildir, lisanslı stok/editorial
 *    görsel (D013) tedarik edilene kadar bu placeholder'ı kullanır.
 *
 * Her iki durumda da `isPlaceholder: true` ile işaretlenir; `ProductCard`/
 * `ProductGallery` bunu D012 guard'ı olarak kullanıp "Örnek görsel" rozetini
 * gösterir — gerçek `product.images` verisiyle aynı `{ url, alt, isPlaceholder }`
 * şeklini paylaştığı için component'lerin kendisi bu iki kaynak arasında
 * ayrım yapmaz.
 */
export const PLACEHOLDER_IMAGE_URL = "/fixtures/placeholder-jewelry.svg"

export interface DisplayImage {
  url: string
  alt: string
  isPlaceholder: boolean
}

export function getPlaceholderImage(alt: string): DisplayImage {
  return { url: PLACEHOLDER_IMAGE_URL, alt, isPlaceholder: true }
}
