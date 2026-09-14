/**
 * VIDEO 08 STEP 2 düzeltmesi (brand-ui kararı) — `ProductGallery` artık
 * `next/image`'ı `fill` içinde sabit bir `aspect-*` kapsayıcıya HAPSETMİYOR
 * (letterbox üretiyordu); bunun yerine görselin GERÇEK piksel boyutuyla
 * (`width`/`height`) intrinsic render ediyor, `w-full h-auto` ile konteynere
 * orantılı ölçekleniyor — tarayıcı düzeni görsel yüklenmeden ÖNCE bu oranla
 * ayırdığı için CLS üretmez.
 *
 * Bu boyutlar DB'de YOK (`ProductImage` bir width/height alanı taşımıyor,
 * `lib/**`'e yeni bir alan eklemedim) — yalnızca bugün `public/images/`'te
 * GERÇEKTEN var olan statik dosyalar için elle doğrulanmış (`PIL Image.open
 * (...).size`) bir eşleşme. Eşleşmeyen bir URL için `getImageDimensions`
 * `null` döner; çağıran taraf bu durumda GÜVENLİ bir kareye (mevcut
 * placeholder'ın kendi gerçek boyutu zaten burada tanımlı) düşer — hiçbir
 * görsel bozuk/kırık render olmaz.
 */
const KNOWN_IMAGE_DIMENSIONS: Record<string, { width: number; height: number }> = {
  "/images/yuzuk_gercek_12.webp": { width: 1024, height: 683 },
  "/images/kupe_gercek_08.webp": { width: 1024, height: 768 },
  // Yerel SVG placeholder (`lib/placeholder-image.ts`) — kendi `viewBox`'ı
  // 800×800, gerçek bir fotoğraf değil ama aynı intrinsic-render yoluyla
  // tutarlı şekilde render edilmesi için burada da tanımlı.
  "/fixtures/placeholder-jewelry.svg": { width: 800, height: 800 },
}

function getImageDimensions(url: string): { width: number; height: number } | null {
  return KNOWN_IMAGE_DIMENSIONS[url] ?? null
}

export { getImageDimensions }
