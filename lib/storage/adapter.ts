/**
 * Vendor'a yapışmayan (vendor-agnostic) object storage soyutlaması (D024).
 * Admin görsel yükleme iş mantığı yalnızca bu arayüze bağımlı olmalıdır —
 * hangi somut adaptörün (S3/R2/MinIO/yerel) aktif olduğunu bilmesine gerek
 * yoktur (bkz. `./index.ts` → `getStorageAdapter`).
 */
export interface StorageAdapter {
  /** `key` çağıran tarafından üretilir (bkz. `./key.ts` → `generateStorageKey`) — kullanıcı dosya adı asla path olarak kullanılmaz. */
  put(key: string, body: Buffer, contentType: string): Promise<{ url: string }>
  /** Yoksayılabilir hata: anahtar zaten silinmişse (ör. tekrar deneme) sessizce başarılı sayılır — idempotent. */
  delete(key: string): Promise<void>
}
