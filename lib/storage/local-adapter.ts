/**
 * Yerel geliştirme adaptörü — gerçek bir object storage credential'ı OLMADAN
 * admin görsel yükleme akışının uçtan uca test edilebilmesi içindir.
 *
 * ÖNEMLİ (D024'ün gerekçesiyle tutarlı): dosyalar `public/` İÇİNE YAZILMAZ.
 * `public/`, Next.js tarafından doğrudan statik servis edilir; oraya yazmak
 * D024'ün tam olarak kaçınmaya çalıştığı "geçici dosya sistemine güvenme"
 * yanılgısına yeniden düşmek olurdu (deploy'da/çoklu instance'ta kaybolma
 * riski). Bunun yerine repo DIŞI, `.gitignore`'lu bir klasöre yazılır.
 *
 * BİLİNÇLİ EKSİK (bu turun kapsamı): dosyayı tarayıcıya fiilen servis etmek
 * için `urlPrefix` altında bir Route Handler GEREKİR. Route Handler'lar
 * `app/` altında yaşar ve bu tur `app/` altına dokunmuyor (Wave A sınırı) —
 * bu yüzden `put()`'un döndürdüğü URL, admin UI'ı yazan taraf eşleşen bir
 * `app/<urlPrefix>/[...key]/route.ts` eklemeden 404 verir. Bkz. Wave A
 * raporundaki bu maddenin açık uyarısı.
 *
 * `server-only` paketi BİLİNÇLİ OLARAK kullanılmadı (bkz.
 * `lib/auth/password.ts`'teki gerekçe notu); koruma `node:fs`/`node:path`
 * bağımlılıklarından doğal olarak gelir.
 */
import { mkdir, writeFile, unlink } from "node:fs/promises"
import { join, dirname, isAbsolute } from "node:path"
import type { StorageAdapter } from "./adapter"

export interface LocalStorageAdapterConfig {
  /**
   * Dosyaların yazılacağı klasör. GÖRELİ bir yol verilirse `process.cwd()`'e
   * göre çözülür (üretim varsayılanı — repo dışı, gitignore'lu bir klasör).
   * MUTLAK bir yol verilirse OLDUĞU GİBİ kullanılır — qa/testler bunu
   * `os.tmpdir()` tabanlı geçici bir dizine enjekte edebilsin diye (Wave A ek
   * talebi: "test adapter'ı geçici bir dizinle enjekte edecek").
   */
  baseDir: string
  /** Bu klasörü servis edecek (henüz yazılmamış) Route Handler'ın URL prefix'i. */
  urlPrefix: string
}

export class LocalStorageAdapter implements StorageAdapter {
  constructor(private readonly config: LocalStorageAdapterConfig) {}

  async put(key: string, body: Buffer): Promise<{ url: string }> {
    const absolutePath = this.resolveAbsolutePath(key)
    await mkdir(dirname(absolutePath), { recursive: true })
    await writeFile(absolutePath, body)
    return { url: `${this.config.urlPrefix.replace(/\/+$/, "")}/${key}` }
  }

  async delete(key: string): Promise<void> {
    const absolutePath = this.resolveAbsolutePath(key)
    try {
      await unlink(absolutePath)
    } catch (error) {
      // Dosya zaten yoksa (ör. tekrar deneme) sessizce yut — silme idempotent olmalıdır.
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
    }
  }

  /**
   * `key` her zaman `generateStorageKey()` tarafından üretilir (kullanıcı
   * girdisi asla path olarak kullanılmaz), ama savunma amaçlı ikinci bir
   * katman olarak burada da path traversal'a karşı doğrulanır.
   */
  private resolveAbsolutePath(key: string): string {
    if (key.includes("..") || key.startsWith("/") || key.includes("\\")) {
      throw new Error(`Geçersiz storage key: ${key}`)
    }
    // `turbopackIgnore` — bu `join(process.cwd(), ...)` çağrısı Turbopack'in
    // statik analizinin "dinamik dosya sistemi erişimi" olarak yorumlayıp
    // TÜM projeyi (public/ dahil) deploy paketine dahil etmesine yol açıyordu
    // (güvenlik açığı DEĞİL, deploy boyutu sorunu — gerçek `npm run build`
    // çıktısında doğrulandı). `baseDir` zaten (mutlak değilse) her zaman
    // `process.cwd()`'e göre sabit/bilinen bir alt klasördür; path
    // traversal savunması (yukarıdaki `..`/`/`/`\` kontrolü VE
    // `local-adapter.ts` çağıranlarındaki `realpath` karşılaştırması)
    // BOZULMADI, bu yalnızca build-time trace davranışını hedefler.
    const resolvedBaseDir = isAbsolute(this.config.baseDir)
      ? this.config.baseDir
      : join(/*turbopackIgnore: true*/ process.cwd(), this.config.baseDir)
    return join(resolvedBaseDir, key)
  }
}
