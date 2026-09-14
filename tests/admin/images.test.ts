import "../helpers/mock-admin-cookie"
import { existsSync, mkdtempSync, rmSync } from "node:fs"
import { readdirSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { testPrisma } from "../helpers/test-prisma"
import { ProductStatus } from "../../lib/generated/prisma/client"
import { createProduct } from "../../lib/admin/products"
import { uploadProductImage, deleteProductImage, reorderProductImagesAsAdmin, setMainProductImageAsAdmin } from "../../lib/admin/images"
import { LocalStorageAdapter } from "../../lib/storage"
import { AdminAuthRequiredError } from "../../lib/auth"
import { createAuthenticatedAdmin, createCategory, resetCommerceTables } from "../helpers/factories"
import { setMockAdminCookie, clearMockAdminCookie } from "../helpers/mock-admin-cookie"

// Gerçek buluta HİÇ gitmeyen, yalnızca bu test dosyasına özel geçici bir
// dizine yazan LocalStorageAdapter — Wave A talebi. `os.tmpdir()` tabanlı,
// `afterEach`'te silinir.
let tempDir: string
let adapter: LocalStorageAdapter

beforeEach(async () => {
  await resetCommerceTables()
  tempDir = mkdtempSync(join(tmpdir(), "qa-storage-"))
  adapter = new LocalStorageAdapter({ baseDir: tempDir, urlPrefix: "/admin-uploads" })
})

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true })
})

// Gerçek magic-byte imzaları — yalnızca ilk baytlar yeterli (bkz. image-validation.ts).
const VALID_JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46])
const VALID_PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00])
// SVG (veya herhangi bir metin dosyası) — `.jpg` yüklenmiş GİBİ davranılsa
// bile gerçek ilk baytları hiçbir allow-list imzasına uymaz. `<script>`
// içerebilen SVG'nin bilinçli olarak reddedilmesi image-validation.ts'in
// açık tasarım amacıdır (stored XSS önleme).
const SPOOFED_SVG = Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>")

async function setupProduct(): Promise<string> {
  const { token } = await createAuthenticatedAdmin()
  setMockAdminCookie(token)
  const category = await createCategory()
  // İsim/slug her çağrıda BENZERSİZ olmalı — bazı testler (ör. "paylaşılan
  // storageKey") bu yardımcıyı aynı test İÇİNDE birden fazla kez çağırır.
  const unique = Math.random().toString(36).slice(2, 8)
  const product = await createProduct(
    { name: `Görsel Testi ${unique}`, categoryId: category.id, status: ProductStatus.PUBLISHED },
    testPrisma
  )
  if (!product.success) throw new Error("setup başarısız")
  return product.product.id
}

describe("Admin ürün görseli yönetimi (S/T/U — D024)", () => {
  it("oturumsuz çağrı reddedilir", async () => {
    clearMockAdminCookie()
    await expect(
      uploadProductImage({ productId: "x", alt: "x", fileBuffer: VALID_JPEG }, testPrisma, adapter)
    ).rejects.toBeInstanceOf(AdminAuthRequiredError)
  })

  it("(S) gerçek bir JPEG, yerel test adapter'ına yüklenir, DB satırı isPlaceholder=false ile yazılır", async () => {
    const productId = await setupProduct()

    const result = await uploadProductImage({ productId, alt: "Gerçek ürün fotoğrafı", fileBuffer: VALID_JPEG }, testPrisma, adapter)

    expect(result.success).toBe(true)
    if (!result.success) throw new Error("beklenmedik hata")
    expect(result.image.isPlaceholder).toBe(false)
    expect(result.image.url).toMatch(/^\/admin-uploads\/product-images\/[0-9a-f]+\.jpg$/)

    // Dosya GERÇEKTEN geçici dizine yazılmış mı (gerçek buluta değil).
    const writtenFiles = readdirSync(join(tempDir, "product-images"))
    expect(writtenFiles).toHaveLength(1)
    expect(writtenFiles[0]).toMatch(/\.jpg$/)

    const row = await testPrisma.productImage.findUniqueOrThrow({ where: { id: result.image.id } })
    expect(row.storageKey).toBeTruthy()
    expect(row.isPlaceholder).toBe(false)
  })

  it("(S) PNG de kabul edilir (allow-list'teki diğer formatlardan biri)", async () => {
    const productId = await setupProduct()
    const result = await uploadProductImage({ productId, alt: "PNG test", fileBuffer: VALID_PNG }, testPrisma, adapter)
    expect(result.success).toBe(true)
    if (!result.success) throw new Error("beklenmedik hata")
    expect(result.image.url).toMatch(/\.png$/)
  })

  it("(S) MIME spoof: SVG içeriği (script içerebilir) GERÇEK baytlarına göre REDDEDİLİR, DB'ye hiçbir satır yazılmaz", async () => {
    const productId = await setupProduct()

    const result = await uploadProductImage({ productId, alt: "Kötücül dosya", fileBuffer: SPOOFED_SVG }, testPrisma, adapter)

    expect(result.success).toBe(false)
    if (result.success) throw new Error("beklenmedik başarı")
    expect(result.error.code).toBe("INVALID_IMAGE")

    const rows = await testPrisma.productImage.findMany({ where: { productId } })
    expect(rows).toHaveLength(0)
    // Storage'a da HİÇ yazılmamış olmalı (validasyon storage çağrısından önce).
    expect(existsSync(join(tempDir, "product-images"))).toBe(false)
  })

  it("(S) var olmayan bir ürüne yükleme PRODUCT_NOT_FOUND döner", async () => {
    const { token } = await createAuthenticatedAdmin()
    setMockAdminCookie(token)

    const result = await uploadProductImage({ productId: "yok-boyle-bir-urun", alt: "x", fileBuffer: VALID_JPEG }, testPrisma, adapter)

    expect(result.success).toBe(false)
    if (result.success) throw new Error("beklenmedik başarı")
    expect(result.error.code).toBe("PRODUCT_NOT_FOUND")
  })

  it("(T) ana görsel/sıralama: ilk (index 0) ve üçüncü (index 2) görselin yerini değiştirmek unique ihlali OLMADAN doğru sonuçlanır", async () => {
    const productId = await setupProduct()
    const first = await uploadProductImage({ productId, alt: "1", fileBuffer: VALID_JPEG }, testPrisma, adapter)
    const second = await uploadProductImage({ productId, alt: "2", fileBuffer: VALID_JPEG }, testPrisma, adapter)
    const third = await uploadProductImage({ productId, alt: "3", fileBuffer: VALID_JPEG }, testPrisma, adapter)
    if (!first.success || !second.success || !third.success) throw new Error("setup başarısız")

    // Ham sıra: [1, 2, 3] (sortOrder 0,1,2). Birinci ile üçüncünün yerini değiştir: [3, 2, 1].
    const reordered = await reorderProductImagesAsAdmin(
      productId,
      [third.image.id, second.image.id, first.image.id],
      testPrisma
    )
    expect(reordered.success).toBe(true)

    const images = await testPrisma.productImage.findMany({ where: { productId }, orderBy: { sortOrder: "asc" } })
    expect(images.map((i) => i.id)).toEqual([third.image.id, second.image.id, first.image.id])
    expect(images.map((i) => i.sortOrder)).toEqual([0, 1, 2])
    // @@unique([productId, sortOrder]) ihlali OLMADAN (naif implementasyon
    // tam burada patlardı) — hata fırlatılmadığı zaten yukarıda `success: true`
    // ile kanıtlandı, ek olarak her sortOrder'ın BENZERSİZ olduğunu da doğrula.
    expect(new Set(images.map((i) => i.sortOrder)).size).toBe(3)
  })

  it("(T) setMainProductImageAsAdmin, ana görsel OLMAYAN bir görseli sortOrder=0 yapar, diğerlerinin göreli sırası korunur", async () => {
    const productId = await setupProduct()
    const first = await uploadProductImage({ productId, alt: "1", fileBuffer: VALID_JPEG }, testPrisma, adapter)
    const second = await uploadProductImage({ productId, alt: "2", fileBuffer: VALID_JPEG }, testPrisma, adapter)
    const third = await uploadProductImage({ productId, alt: "3", fileBuffer: VALID_JPEG }, testPrisma, adapter)
    if (!first.success || !second.success || !third.success) throw new Error("setup başarısız")

    const result = await setMainProductImageAsAdmin(productId, third.image.id, testPrisma)
    expect(result.success).toBe(true)

    const images = await testPrisma.productImage.findMany({ where: { productId }, orderBy: { sortOrder: "asc" } })
    expect(images[0].id).toBe(third.image.id)
    expect(images.map((i) => i.id)).toEqual([third.image.id, first.image.id, second.image.id])
  })

  it("(U) görsel silme: hem DB satırı hem storage nesnesi silinir", async () => {
    const productId = await setupProduct()
    const uploaded = await uploadProductImage({ productId, alt: "Silinecek", fileBuffer: VALID_JPEG }, testPrisma, adapter)
    if (!uploaded.success) throw new Error("setup başarısız")
    const storageKey = (await testPrisma.productImage.findUniqueOrThrow({ where: { id: uploaded.image.id } })).storageKey!

    const result = await deleteProductImage(uploaded.image.id, productId, testPrisma, adapter)
    expect(result.success).toBe(true)

    const row = await testPrisma.productImage.findUnique({ where: { id: uploaded.image.id } })
    expect(row).toBeNull()
    expect(existsSync(join(tempDir, storageKey))).toBe(false)
  })

  it("(U) aynı storageKey'i PAYLAŞAN iki satırdan birini silmek, diğeri hâlâ referans verdiği için storage nesnesini SİLMEZ", async () => {
    const productId = await setupProduct()
    const uploaded = await uploadProductImage({ productId, alt: "Paylaşılan", fileBuffer: VALID_JPEG }, testPrisma, adapter)
    if (!uploaded.success) throw new Error("setup başarısız")
    const sharedStorageKey = (await testPrisma.productImage.findUniqueOrThrow({ where: { id: uploaded.image.id } })).storageKey!

    // İkinci ürüne, AYNI storageKey'i (farklı sortOrder ile) elle bağlayan
    // ikinci bir ProductImage satırı kur — gerçek dünyada bu, örneğin ileride
    // "görseli başka üründe de kullan" özelliğiyle olabilir; bu turda bunu
    // doğrudan testPrisma ile simüle ediyoruz.
    const secondProductId = await setupProduct()
    const sharedRow = await testPrisma.productImage.create({
      data: { productId: secondProductId, url: uploaded.image.url, alt: "Aynı asset", storageKey: sharedStorageKey, isPlaceholder: false, sortOrder: 0 },
    })

    const result = await deleteProductImage(uploaded.image.id, productId, testPrisma, adapter)
    expect(result.success).toBe(true)

    // İlk satır silindi...
    expect(await testPrisma.productImage.findUnique({ where: { id: uploaded.image.id } })).toBeNull()
    // ...ama ikinci satır HÂLÂ AYAKTA ve storage nesnesi hâlâ diskte —
    // "başka bir satır tarafından kullanılan asset yanlışlıkla silinmedi".
    expect(await testPrisma.productImage.findUnique({ where: { id: sharedRow.id } })).not.toBeNull()
    expect(existsSync(join(tempDir, sharedStorageKey))).toBe(true)
  })

  it("(U) var olmayan bir görsel id'si IMAGE_NOT_FOUND döner", async () => {
    const productId = await setupProduct()

    const result = await deleteProductImage("yok-boyle-bir-gorsel", productId, testPrisma, adapter)

    expect(result.success).toBe(false)
    if (result.success) throw new Error("beklenmedik başarı")
    expect(result.error.code).toBe("IMAGE_NOT_FOUND")
  })

  it("(U, IDOR düzeltmesi girdi doğrulaması) boş productId de IMAGE_NOT_FOUND döner (deleteProductImage'da ayrı bir Zod şeması YOK — id+productId birlikte aranıyor, eşleşme olmayınca IMAGE_NOT_FOUND'a düşüyor; updateVariant/updateVariantStock'taki INVALID_INPUT'tan farklı, ama satır YİNE silinmiyor)", async () => {
    const productId = await setupProduct()
    const uploaded = await uploadProductImage({ productId, alt: "Boş productId testi", fileBuffer: VALID_JPEG }, testPrisma, adapter)
    if (!uploaded.success) throw new Error("setup başarısız")

    const result = await deleteProductImage(uploaded.image.id, "", testPrisma, adapter)

    expect(result.success).toBe(false)
    if (result.success) throw new Error("beklenmedik başarı")
    expect(result.error.code).toBe("IMAGE_NOT_FOUND")
    expect(await testPrisma.productImage.findUnique({ where: { id: uploaded.image.id } })).not.toBeNull()
  })

  it("(U, IDOR düzeltmesi — security C-2) DOĞRU görsel id'si ama YANLIŞ (başka bir ürünün) productId'siyle silme IMAGE_NOT_FOUND döner, satır ve storage nesnesi HÂLÂ AYAKTA", async () => {
    const productId = await setupProduct()
    const uploaded = await uploadProductImage({ productId, alt: "IDOR hedefi", fileBuffer: VALID_JPEG }, testPrisma, adapter)
    if (!uploaded.success) throw new Error("setup başarısız")
    const storageKey = (await testPrisma.productImage.findUniqueOrThrow({ where: { id: uploaded.image.id } })).storageKey!
    const otherProductId = await setupProduct()

    const result = await deleteProductImage(uploaded.image.id, otherProductId, testPrisma, adapter)

    expect(result.success).toBe(false)
    if (result.success) throw new Error("beklenmedik başarı")
    expect(result.error.code).toBe("IMAGE_NOT_FOUND")

    expect(await testPrisma.productImage.findUnique({ where: { id: uploaded.image.id } })).not.toBeNull()
    expect(existsSync(join(tempDir, storageKey))).toBe(true)
  })
})
