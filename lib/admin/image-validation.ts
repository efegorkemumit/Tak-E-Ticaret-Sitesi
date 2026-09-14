/**
 * Görsel yükleme güvenlik doğrulaması — client'ın bildirdiği `Content-Type`'a
 * ASLA güvenilmez (MIME spoofing gerçek bir saldırı vektörüdür); MIME tipi
 * yalnızca dosyanın GERÇEK ilk baytlarından (magic bytes/dosya imzası)
 * tespit edilir. SVG bilinçli olarak DESTEKLENMEZ — SVG içinde `<script>`
 * çalışabilir, bir "görsel" yükleme özelliği bu şekilde stored XSS'e
 * dönüşebilir.
 *
 * Saf fonksiyonlar — DB/storage'a dokunmaz.
 */

export type DetectedImageMimeType = "image/jpeg" | "image/png" | "image/webp" | "image/avif"

/** Makul bir üst sınır — mücevher ürün fotoğrafı için 8 MB fazlasıyla yeterli, aşırı büyük yüklemeleri erkenden reddeder. */
export const MAX_IMAGE_UPLOAD_BYTES = 8 * 1024 * 1024

function matchesSignature(buffer: Buffer, offset: number, signature: number[]): boolean {
  if (buffer.length < offset + signature.length) return false
  return signature.every((byte, index) => buffer[offset + index] === byte)
}

/**
 * Yalnızca allow-list'teki 4 formatı tanır. Bilinçli olarak "başka bir şey
 * olabilir" gibi sezgisel/toleranslı bir tespite İZİN VERİLMEZ — tanınamayan
 * her şey reddedilir (fail-safe).
 */
export function detectImageMimeType(buffer: Buffer): DetectedImageMimeType | null {
  if (matchesSignature(buffer, 0, [0xff, 0xd8, 0xff])) return "image/jpeg"
  if (matchesSignature(buffer, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png"
  // RIFF....WEBP — bayt 0-3 "RIFF", bayt 8-11 "WEBP" (bayt 4-7 dosya boyutu, atlanır).
  if (matchesSignature(buffer, 0, [0x52, 0x49, 0x46, 0x46]) && matchesSignature(buffer, 8, [0x57, 0x45, 0x42, 0x50])) {
    return "image/webp"
  }
  // ISOBMFF ftyp box — bayt 4-7 "ftyp", bayt 8-11 marka ("avif"/"avis"). HEIC/HEIF gibi diğer ftyp markaları BİLİNÇLİ OLARAK kabul edilmez.
  if (
    matchesSignature(buffer, 4, [0x66, 0x74, 0x79, 0x70]) &&
    (matchesSignature(buffer, 8, [0x61, 0x76, 0x69, 0x66]) || matchesSignature(buffer, 8, [0x61, 0x76, 0x69, 0x73]))
  ) {
    return "image/avif"
  }
  return null
}

export interface ImageUploadValidationResult {
  ok: boolean
  mimeType?: DetectedImageMimeType
  reason?: string
}

export function validateImageUpload(buffer: Buffer): ImageUploadValidationResult {
  if (buffer.byteLength === 0) {
    return { ok: false, reason: "Dosya boş." }
  }
  if (buffer.byteLength > MAX_IMAGE_UPLOAD_BYTES) {
    return { ok: false, reason: `Dosya çok büyük (maksimum ${MAX_IMAGE_UPLOAD_BYTES / (1024 * 1024)} MB).` }
  }
  const detected = detectImageMimeType(buffer)
  if (!detected) {
    return {
      ok: false,
      reason: "Desteklenmeyen veya tanınamayan görsel formatı. Yalnızca JPEG, PNG, WebP veya AVIF kabul edilir.",
    }
  }
  return { ok: true, mimeType: detected }
}
