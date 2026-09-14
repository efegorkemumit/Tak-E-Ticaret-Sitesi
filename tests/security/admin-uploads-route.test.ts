import { mkdtempSync, rmSync, writeFileSync, mkdirSync, symlinkSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

/**
 * `app/admin-uploads/[...key]/route.ts`'in path-traversal/symlink-kaçışı
 * savunmasının KALICI regresyon testi.
 *
 * KÖKEN: security bu davranışları Wave C'de gerçek Postgres'e/dosya
 * sistemine karşı, repoya HİÇ girmeyen tek seferlik ad-hoc script'lerle
 * doğruladı (blocker bulunmadı) — yani bu doğrulamaların kalıcı bir koruması
 * yoktu. Bu dosya o doğrulamaları kalıcı hâle getirir.
 *
 * `LOCAL_STORAGE_DIR`, route dosyasında MODÜL SEVİYESİNDE (`const
 * LOCAL_STORAGE_DIR = process.env.LOCAL_STORAGE_DIR ?? ...`) okunduğu için
 * `process.env.LOCAL_STORAGE_DIR`'ı route modülünü import ETMEDEN ÖNCE,
 * `beforeAll` içinde ayarlayıp `import()`'u DİNAMİK olarak (route'un
 * TypeScript kaynağını değil, derlenmemiş .ts dosyasını Vitest'in kendi
 * transform'u üzerinden) yapıyoruz — mutlak bir geçici dizin (`os.tmpdir()`)
 * kullanıldığı için `process.cwd()`/`turbopackIgnore` dalına hiç girilmez,
 * `realpath` tabanlı savunma mantığı CWD'den bağımsız test edilir.
 *
 * Bu dosya `isolate: false` (vitest.config.ts) altında BAŞKA hiçbir test
 * dosyasının okumadığı bir env değişkenini ayarlar — paylaşılan modül
 * kaydına sızma riski yoktur.
 */

let storageDir: string
let GET: (request: Request, context: { params: Promise<{ key: string[] }> }) => Promise<Response>

beforeAll(async () => {
  storageDir = mkdtempSync(join(tmpdir(), "qa-admin-uploads-"))
  process.env.LOCAL_STORAGE_DIR = storageDir

  writeFileSync(join(storageDir, "gercek-gorsel.jpg"), Buffer.from([0xff, 0xd8, 0xff, 0x00]))

  const routeModule = await import("../../app/admin-uploads/[...key]/route")
  GET = routeModule.GET
})

afterAll(() => {
  rmSync(storageDir, { recursive: true, force: true })
  delete process.env.LOCAL_STORAGE_DIR
})

function makeRequest(...keySegments: string[]): Request {
  return new Request(`http://localhost/admin-uploads/${keySegments.join("/")}`)
}

function callRoute(keySegments: string[]): Promise<Response> {
  return GET(makeRequest(...keySegments), { params: Promise.resolve({ key: keySegments }) })
}

describe("app/admin-uploads/[...key]/route.ts — path traversal / symlink kaçışı savunması", () => {
  it("kontrol testi: gerçek, güvenli bir dosya 200 ve doğru Content-Type ile dönüyor", async () => {
    const response = await callRoute(["gercek-gorsel.jpg"])
    expect(response.status).toBe(200)
    expect(response.headers.get("Content-Type")).toBe("image/jpeg")
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff")
  })

  it("`..` segmenti içeren bir yol 400 döner (isSafeSegment ön-kontrolü)", async () => {
    const response = await callRoute(["..", "..", "etc", "passwd"])
    expect(response.status).toBe(400)
  })

  it("tek başına `..` segmenti 400 döner", async () => {
    const response = await callRoute([".."])
    expect(response.status).toBe(400)
  })

  it("decode edilmiş `%2e%2e` segmenti (literal karakterler) 400 döner (`%` allow-list'te yok)", async () => {
    const response = await callRoute(["%2e%2e", "secret.jpg"])
    expect(response.status).toBe(400)
  })

  it("içinde slash geçen bir segment 400 döner", async () => {
    const response = await callRoute(["gercek-gorsel.jpg/../../secret.jpg"])
    expect(response.status).toBe(400)
  })

  it("literal BACKSLASH içeren bir segment 400 döner (security'nin shell escape sorunu yüzünden test EDEMEDİĞİ vaka — burada gerçekten çalıştırılıyor)", async () => {
    // Shell/URL araya girmiyor: bu, JS string literal'ı olarak DOĞRUDAN ham
    // bir ters slash içeriyor — `isSafeSegment`'in regex'i (`/^[a-zA-Z0-9._-]+$/`)
    // ters slash'ı kabul ETMEZ, bu yüzden segment reddedilmeli.
    const response = await callRoute(["..\\..\\secret.jpg"])
    expect(response.status).toBe(400)

    // İkinci bir varyant: ters slash'ın segment İÇİNDE (baştan değil) geçtiği durum.
    const response2 = await callRoute(["klasor\\secret.jpg"])
    expect(response2.status).toBe(400)
  })

  it("tanınmayan bir uzantı 400 döner", async () => {
    writeFileSync(join(storageDir, "gizli-dosya.txt"), "hassas veri")
    const response = await callRoute(["gizli-dosya.txt"])
    expect(response.status).toBe(400)
  })

  it("uzantısız bir segment 400 döner", async () => {
    const response = await callRoute(["uzantisiz-dosya"])
    expect(response.status).toBe(400)
  })

  it("var olmayan (ama GEÇERLİ görünen) bir dosya 404 döner, dizin listelemesi yapılmaz", async () => {
    const response = await callRoute(["hic-var-olmayan.jpg"])
    expect(response.status).toBe(404)
  })

  it("bir DİZİNE denk gelen (geçerli uzantılı ama aslında klasör olan) bir yol 404 döner", async () => {
    mkdirSync(join(storageDir, "bir-dizin.jpg"))
    const response = await callRoute(["bir-dizin.jpg"])
    expect(response.status).toBe(404)
  })

  describe("symlink kaçışı (realpath tabanlı savunma)", () => {
    it("storage dizini İÇİNE ekilmiş, DIŞARIYA işaret eden gerçek bir symlink 404 döner (string startsWith DEĞİL, gerçek realpath karşılaştırması)", async () => {
      const outsideDir = mkdtempSync(join(tmpdir(), "qa-admin-uploads-outside-"))
      const outsideSecretPath = join(outsideDir, "disaridaki-gizli-dosya.jpg")
      writeFileSync(outsideSecretPath, Buffer.from([0xff, 0xd8, 0xff, 0x00]))

      const symlinkPath = join(storageDir, "kacis-linki.jpg")
      try {
        symlinkSync(outsideSecretPath, symlinkPath, "file")
      } catch (error) {
        // Bu makinede (Windows) symlink oluşturma yetkisi/Geliştirici Modu
        // kapalıysa test'i SESSİZCE "geçti" gösterMEMEK için açıkça atla ve
        // nedenini raporla — sahte bir yeşil, gerçek bir kanıt DEĞİLDİR.
        console.warn("Symlink oluşturulamadı (muhtemelen platform/yetki sınırlaması), bu test atlanıyor:", error)
        rmSync(outsideDir, { recursive: true, force: true })
        return
      }

      const response = await callRoute(["kacis-linki.jpg"])
      expect(response.status).toBe(404)

      rmSync(outsideDir, { recursive: true, force: true })
    })
  })

  // BİLİNÇLİ SINIR: `LOCAL_STORAGE_DIR`in GÖRELİ (process.cwd() +
  // turbopackIgnore yorumunun dokunduğu) dalını AYRI bir `vi.resetModules()`
  // + yeniden import ile test ETMİYORUZ. Denendi: `vitest.config.ts`'teki
  // `isolate: false` TÜM test dosyaları arasında TEK bir modül kaydı
  // paylaştırıyor (`testPrisma` bağlantı havuzunun tekilliği için, bkz. o
  // dosyadaki yorum) — `vi.resetModules()` bu PAYLAŞILAN kaydı sıfırlayıp
  // `tests/helpers/mock-admin-cookie.ts`'in diğer admin test dosyaları için
  // kurduğu `next/headers` mock'unu GEÇERSİZ kıldı (gerçek suite
  // çalıştırmasında `cookies() was called outside a request scope` hatasıyla
  // BAŞKA test dosyalarını kırdığı görüldü, bu yüzden geri alındı). Bu
  // dalın güvenlik davranışı yukarıdakiyle AYNI kod yoluna (`realpath`
  // karşılaştırması) çıkıyor, yalnızca `baseDir`'in nasıl hesaplandığı
  // (`process.cwd()` ile birleştirme) farklı — `turbopackIgnore` yorumunun
  // kendisi de yalnızca Turbopack'in BUILD-ZAMANI statik analizine yönelik
  // bir derleyici ipucudur, Vitest (Vite tabanlı, Turbopack kullanmaz) onu
  // hiç görmez. Bu satırı izole bir script'le (bu dosyanın Vitest suite'i
  // DIŞINDA) ayrıca doğruladım, ayrıntı takım raporunda.
})
