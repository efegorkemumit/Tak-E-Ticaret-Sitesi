/**
 * `lib/storage/local-adapter.ts`'in döndürdüğü `/admin-uploads/<key>`
 * URL'lerini fiilen servis eden Route Handler — yalnızca gerçek bir object
 * storage credential'ı YOKKEN (yerel geliştirme) devreye girer; üretimde S3
 * adaptörü aktifse bu route hiç kullanılmaz (URL doğrudan bucket/CDN'e
 * işaret eder).
 *
 * GÜVENLİK (bu route'un TEK amacı bu olduğu için özellikle titiz):
 * - Her path segmenti allow-list bir regex'le doğrulanır (`..`, mutlak yol,
 *   ters slash içeren HİÇBİR segment kabul edilmez).
 * - Yalnızca bilinen 4 görsel uzantısı (jpg/jpeg/png/webp/avif) servis edilir.
 * - Çözümlenen MUTLAK yolun gerçekten (`fs.realpath` ile, sembolik link
 *   kaçışına karşı) `LOCAL_STORAGE_DIR`'İN İÇİNDE kaldığı doğrulanır —
 *   yalnızca string `startsWith` kontrolü sembolik linklerle atlatılabilir.
 * - Dizin listelemesi YAPILMAZ — yalnızca tek bir dosya okunur/döndürülür,
 *   bir dizine denk gelirse 404 döner (`readFile` zaten bunu bir hata olarak
 *   fırlatır).
 */
import { NextResponse } from "next/server"
import { readFile, realpath } from "node:fs/promises"
import { join, isAbsolute, sep } from "node:path"

const LOCAL_STORAGE_DIR = process.env.LOCAL_STORAGE_DIR ?? ".local-uploads"

const EXTENSION_TO_CONTENT_TYPE: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
}

const SAFE_SEGMENT_PATTERN = /^[a-zA-Z0-9._-]+$/

function isSafeSegment(segment: string): boolean {
  return SAFE_SEGMENT_PATTERN.test(segment) && segment !== "." && segment !== ".."
}

export async function GET(_request: Request, context: { params: Promise<{ key: string[] }> }): Promise<Response> {
  const { key: keySegments } = await context.params

  if (!Array.isArray(keySegments) || keySegments.length === 0 || !keySegments.every(isSafeSegment)) {
    return new NextResponse(null, { status: 400 })
  }

  const lastSegment = keySegments[keySegments.length - 1]
  const extension = lastSegment.includes(".") ? lastSegment.split(".").pop()!.toLowerCase() : ""
  const contentType = EXTENSION_TO_CONTENT_TYPE[extension]
  if (!contentType) {
    return new NextResponse(null, { status: 400 })
  }

  // `turbopackIgnore` — bkz. `lib/storage/local-adapter.ts`'teki aynı yorum:
  // bu çağrı, `baseDir` (mutlak değilse) sabit/bilinen bir alt klasöre
  // çözüldüğü hâlde Turbopack'in TÜM projeyi trace edip deploy paketine
  // dahil etmesine yol açıyordu (build boyutu sorunu, güvenlik açığı DEĞİL).
  // Aşağıdaki `realpath` tabanlı sembolik-link/path-traversal savunması
  // BOZULMADI.
  const baseDir = isAbsolute(LOCAL_STORAGE_DIR)
    ? LOCAL_STORAGE_DIR
    : join(/*turbopackIgnore: true*/ process.cwd(), LOCAL_STORAGE_DIR)
  const requestedPath = join(baseDir, ...keySegments)

  try {
    // Sembolik link kaçışına karşı: STRING prefix kontrolü değil, gerçek
    // (symlink çözülmüş) yol karşılaştırması.
    const [realBaseDir, realRequestedPath] = await Promise.all([realpath(baseDir), realpath(requestedPath)])
    const isWithinBaseDir = realRequestedPath === realBaseDir || realRequestedPath.startsWith(realBaseDir + sep)
    if (!isWithinBaseDir) {
      return new NextResponse(null, { status: 404 })
    }

    const fileBuffer = await readFile(realRequestedPath)
    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
        // Tarayıcının bildirilen Content-Type'ı "iyileştirmeye" çalışıp
        // içeriği farklı yorumlamasını (MIME sniffing) engeller.
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch {
    // Dosya yok, bir dizine denk geldi, ya da realpath/erişim hatası —
    // hepsi aynı 404'e düşürülür; iç dosya sistemi hatasının detayı sızmaz.
    return new NextResponse(null, { status: 404 })
  }
}
