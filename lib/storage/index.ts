/**
 * Aktif storage adaptörünü seçer — credential varsa S3(-uyumlu), yoksa yerel
 * geliştirme adaptörü. Hangi adaptörün seçildiği `getActiveStorageAdapterKind()`
 * ile açıkça sorgulanabilir.
 *
 * ENJEKTE EDİLEBİLİRLİK (Wave A ek talebi): `getStorageAdapter()` yalnızca
 * ÜRETİM varsayılanıdır (env-sürüşlü, modül seviyesinde cache'lenir). Bu
 * modülden Bu turda YAZILMAYAN Wave B admin görsel-yükleme servisleri,
 * `lib/commerce/create-order.ts`'teki `client: PrismaClient = prisma`
 * deseniyle AYNI ŞEKİLDE, aktif adaptörü kendi içinden çağırmak yerine bir
 * `adapter: StorageAdapter = getStorageAdapter()` PARAMETRESİ olarak
 * almalıdır — böylece qa, `LocalStorageAdapter`'ı gerçek buluta gitmeyen,
 * geçici bir dizine (`os.tmpdir()`) işaret eden AYRI bir örnekle enjekte
 * edebilir. Bu yüzden `LocalStorageAdapter`/`S3StorageAdapter` sınıfları da
 * (yalnızca arayüz değil) burada doğrudan re-export edilir.
 *
 * `server-only` paketi BİLİNÇLİ OLARAK kullanılmadı (bkz.
 * `lib/auth/password.ts`'teki gerekçe notu — Vitest ile uyumsuz); koruma
 * S3 adaptöründe `@aws-sdk/client-s3`'ten, yerel adaptörde `node:fs`'ten
 * doğal olarak gelir.
 */
import type { StorageAdapter } from "./adapter"
import { S3StorageAdapter } from "./s3-adapter"
import { LocalStorageAdapter } from "./local-adapter"

export type { StorageAdapter } from "./adapter"
export { S3StorageAdapter } from "./s3-adapter"
export type { S3StorageAdapterConfig } from "./s3-adapter"
export { LocalStorageAdapter } from "./local-adapter"
export type { LocalStorageAdapterConfig } from "./local-adapter"
export { generateStorageKey, UnsupportedImageMimeTypeError } from "./key"
export { reorderProductImages, setMainProductImage } from "./reorder-images"

const LOCAL_STORAGE_DIR = process.env.LOCAL_STORAGE_DIR ?? ".local-uploads"
const LOCAL_STORAGE_URL_PREFIX = process.env.LOCAL_STORAGE_URL_PREFIX ?? "/admin-uploads"

/** S3(-uyumlu) adaptörün aktif olması için dolu olması gereken TÜM env değişkenleri. */
const REQUIRED_S3_ENV_VAR_NAMES = [
  "STORAGE_S3_BUCKET",
  "STORAGE_S3_REGION",
  "STORAGE_S3_ACCESS_KEY_ID",
  "STORAGE_S3_SECRET_ACCESS_KEY",
  "STORAGE_S3_PUBLIC_URL_BASE",
] as const

/** Eksik olan S3 env değişkenlerinin İSİMLERİNİ döner (hiçbir DEĞER/secret taşımaz). */
function getMissingS3EnvVarNames(): string[] {
  return REQUIRED_S3_ENV_VAR_NAMES.filter((name) => !process.env[name])
}

function hasS3Credentials(): boolean {
  return getMissingS3EnvVarNames().length === 0
}

export function getActiveStorageAdapterKind(): "s3" | "local" {
  return hasS3Credentials() ? "s3" : "local"
}

let cachedAdapter: StorageAdapter | undefined

/**
 * Üretim varsayılanı — env'e göre otomatik seçilen, cache'lenen adaptör.
 * Testler bunun yerine `new LocalStorageAdapter(...)`'ı DOĞRUDAN enjekte
 * etmelidir.
 *
 * GÜVENLİ FALLBACK UYARISI (security bulgusu): S3 credential'ları eksikken
 * yerel adaptöre sessizce düşmek development'ta doğru/beklenen davranıştır,
 * ama `NODE_ENV === "production"` iken bu SESSİZCE olursa D024'ün tam olarak
 * önlemeye çalıştığı riski (görsellerin geçici bir dosya sistemine yazılıp
 * bir sonraki deploy/instance'ta kaybolması) fark edilmeden üretime taşır.
 * Bu yüzden production'da yerel adaptöre düşülürse sunucu loguna NET bir
 * uyarı basılır — yalnızca EKSİK env değişkenlerinin İSİMLERİ (hiçbir
 * değer/secret) yazılır.
 */
export function getStorageAdapter(): StorageAdapter {
  if (cachedAdapter) return cachedAdapter

  if (getActiveStorageAdapterKind() === "s3") {
    cachedAdapter = new S3StorageAdapter({
      bucket: process.env.STORAGE_S3_BUCKET!,
      region: process.env.STORAGE_S3_REGION!,
      endpoint: process.env.STORAGE_S3_ENDPOINT,
      accessKeyId: process.env.STORAGE_S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.STORAGE_S3_SECRET_ACCESS_KEY!,
      forcePathStyle: process.env.STORAGE_S3_FORCE_PATH_STYLE === "true",
      publicUrlBase: process.env.STORAGE_S3_PUBLIC_URL_BASE!,
    })
  } else {
    if (process.env.NODE_ENV === "production") {
      // Kasıtlı ops/deployment uyarısı — PII/secret İÇERMEZ (yalnızca env değişkeni adları).
      console.warn(
        "[lib/storage] UYARI: production ortamında S3(-uyumlu) storage credential'ları eksik " +
          `(eksik değişkenler: ${getMissingS3EnvVarNames().join(", ")}) — yerel (kalıcı OLMAYAN) diske ` +
          "düşülüyor. Bu, D024'ün önlemeye çalıştığı veri kaybı riskidir: yüklenen görseller bir sonraki " +
          "deploy'da veya çoklu instance'ta kaybolabilir. Yukarıdaki env değişkenlerini ayarlayın."
      )
    }
    cachedAdapter = new LocalStorageAdapter({
      baseDir: LOCAL_STORAGE_DIR,
      urlPrefix: LOCAL_STORAGE_URL_PREFIX,
    })
  }

  return cachedAdapter
}
