/**
 * Storage key üretimi — kullanıcının yüklediği dosyanın ADI hiçbir zaman bir
 * path olarak KULLANILMAZ (path traversal'ı yapısal olarak imkânsız kılar).
 * Anahtar tamamen sunucu tarafında, kriptografik olarak rastgele üretilir;
 * uzantı yalnızca DOĞRULANMIŞ (sunucunun kendi kontrol ettiği bir allow-list
 * karşısında) MIME tipinden türetilir — dosya adından/uzantısından DEĞİL.
 *
 * `server-only` paketi BİLİNÇLİ OLARAK kullanılmadı (bkz.
 * `lib/auth/password.ts`'teki gerekçe notu — Vitest ile uyumsuz); koruma
 * `node:crypto` bağımlılığından doğal olarak gelir.
 */
import { randomBytes } from "node:crypto"

const ALLOWED_IMAGE_MIME_TO_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
}

export class UnsupportedImageMimeTypeError extends Error {
  constructor(public readonly mimeType: string) {
    super(`Desteklenmeyen görsel MIME tipi: ${mimeType}`)
    this.name = "UnsupportedImageMimeTypeError"
  }
}

/** @throws {UnsupportedImageMimeTypeError} `mimeType` allow-list'te değilse. */
export function generateStorageKey(mimeType: string): string {
  const extension = ALLOWED_IMAGE_MIME_TO_EXTENSION[mimeType]
  if (!extension) {
    throw new UnsupportedImageMimeTypeError(mimeType)
  }
  const randomName = randomBytes(16).toString("hex")
  return `product-images/${randomName}.${extension}`
}
