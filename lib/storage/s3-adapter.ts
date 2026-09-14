/**
 * S3-uyumlu (S3 / Cloudflare R2 / MinIO) storage adaptörü — üretim.
 * `docs/DECISIONS.md` D024: somut sağlayıcı seçimi hâlâ OPEN, bu yüzden bu
 * adaptör tamamen env-sürüşlü (endpoint/region/bucket/credentials) tutulur;
 * hiçbir sağlayıcıya özgü davranış varsayılmaz.
 *
 * `server-only` paketi BİLİNÇLİ OLARAK kullanılmadı (bkz.
 * `lib/auth/password.ts`'teki gerekçe notu); koruma `@aws-sdk/client-s3`'ün
 * Node-only bağımlılıklarından doğal olarak gelir.
 */
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import type { StorageAdapter } from "./adapter"

export interface S3StorageAdapterConfig {
  bucket: string
  region: string
  /** R2/MinIO gibi S3-uyumlu ama farklı bir endpoint'e sahip sağlayıcılar için. AWS S3'ün kendisinde boş bırakılır. */
  endpoint?: string
  accessKeyId: string
  secretAccessKey: string
  /** MinIO gibi path-style adresleme gerektiren sağlayıcılar için. */
  forcePathStyle?: boolean
  /** Nesnenin herkese açık URL'sini oluşturmak için taban adres (ör. CDN/bucket public domain). Sonunda `/` OLMAMALI. */
  publicUrlBase: string
}

export class S3StorageAdapter implements StorageAdapter {
  private readonly client: S3Client
  private readonly bucket: string
  private readonly publicUrlBase: string

  constructor(config: S3StorageAdapterConfig) {
    this.bucket = config.bucket
    this.publicUrlBase = config.publicUrlBase.replace(/\/+$/, "")
    this.client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      forcePathStyle: config.forcePathStyle ?? false,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    })
  }

  async put(key: string, body: Buffer, contentType: string): Promise<{ url: string }> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      })
    )
    return { url: `${this.publicUrlBase}/${key}` }
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }))
  }
}
