import "dotenv/config"

/**
 * Bu test paketi GERÇEK bir PostgreSQL'e karşı çalışır (mock/in-memory DB
 * değil) — `lib/commerce/` servis katmanının transaction/kilit davranışı
 * (özellikle stok yarış koşulu testi, bkz. `create-order.concurrency.test.ts`)
 * gerçek bir DB olmadan anlamlı biçimde doğrulanamaz. Bu da testleri
 * DOĞASI GEREĞİ YIKICI yapar: `tests/helpers/factories.ts` →
 * `resetCommerceTables()`, her testten önce hedef veritabanını TRUNCATE
 * CASCADE eder (geri döndürülemez).
 *
 * GÜVENLİK GEÇMİŞİ (neden bu kadar katı kontrol var):
 * İlk sürüm yalnızca `DATABASE_URL` boş mu / literal "PLACEHOLDER" string'i
 * mi içeriyor diye bakıyordu — qa bu makinede `localhost:5432`'de GERÇEKTEN
 * dinleyen bir Postgres sunucusu olduğunu doğruladı (committed `.env`'deki
 * `DATABASE_URL` o sunucuya bağlanmaya çalışıp yalnızca kimlik bilgisi
 * geçersiz olduğu için başarısız oluyordu — sunucunun kendisi gerçek ve
 * erişilebilirdi). İkinci sürüm `ALLOW_DESTRUCTIVE_TEST_DB=1` bayrağı ekledi
 * ama hâlâ üretim singleton'ının (`lib/prisma.ts`) okuduğu AYNI `DATABASE_URL`'i
 * kullanıyordu — team-lead bunun yeterli izolasyon olmadığını, testlerin
 * üretimin okuduğu değişkeni HİÇ OKUMAMASI gerektiğini belirtti. Bu üçüncü
 * (nihai) sürüm üç BAĞIMSIZ katman uyguluyor:
 *
 *   1. Testler `DATABASE_URL`'i DEĞİL, tamamen ayrı bir `TEST_DATABASE_URL`
 *      değişkenini okur (bkz. `tests/helpers/test-prisma.ts`) — üretim
 *      singleton'ı hiçbir test dosyası tarafından import EDİLMEZ,
 *      `lib/commerce/create-order.ts` artık test edilebilirlik için bir
 *      `client` dependency injection parametresi kabul ediyor.
 *   2. Açık bir onay bayrağı: `ALLOW_DESTRUCTIVE_TEST_DB=1` — hiçbir ortamda
 *      "varsayılan olarak açık" gelmez.
 *   3. Deseni doğrula: `TEST_DATABASE_URL`, `npx prisma dev`'in ürettiği
 *      ephemeral sunuculara özgü belirgin işaretleri taşımalı (host
 *      localhost/127.0.0.1 VE veritabanı adı `template1`) — bu, gerçek bir
 *      staging/prod bağlantı string'inin yanlışlıkla buraya kopyalanmasına
 *      karşı ek bir sağlamlık kontrolüdür.
 *
 * Kurulum:
 *
 *   npx prisma dev -n commerce-test-db --db-port 51213 --port 51214 -d
 *   TEST_DATABASE_URL="postgres://postgres:postgres@localhost:51213/template1?sslmode=disable" \
 *     npx prisma migrate deploy
 *   ALLOW_DESTRUCTIVE_TEST_DB=1 \
 *     TEST_DATABASE_URL="postgres://postgres:postgres@localhost:51213/template1?sslmode=disable" \
 *     npx vitest run
 */

if (process.env.ALLOW_DESTRUCTIVE_TEST_DB !== "1") {
  throw new Error(
    "Bu test paketi hedef veritabanını TRUNCATE eder (geri döndürülemez). " +
      "ALLOW_DESTRUCTIVE_TEST_DB=1 ortam değişkenini AÇIKÇA ayarlamadan hiçbir test çalışmaz. " +
      "Bu dosyanın başındaki yorumda tam kurulum/çalıştırma komutları var."
  )
}

const testDatabaseUrl = process.env.TEST_DATABASE_URL

if (!testDatabaseUrl) {
  throw new Error(
    "TEST_DATABASE_URL tanımlı değil. Testler ASLA uygulamanın kullandığı DATABASE_URL'i " +
      "okumaz/kullanmaz — ayrı, açıkça test amaçlı bir TEST_DATABASE_URL sağlamalısınız " +
      "(bkz. bu dosyanın başındaki kurulum notu)."
  )
}

if (testDatabaseUrl === process.env.DATABASE_URL) {
  throw new Error(
    "TEST_DATABASE_URL, DATABASE_URL ile AYNI olamaz — bu, testlerin üretim/gerçek " +
      "veritabanını TRUNCATE etmesini önlemek için var olan izolasyonu geçersiz kılar. " +
      "Ayrı, atılabilir bir test veritabanı (ör. `npx prisma dev`) kullanın."
  )
}

let parsedUrl: URL
try {
  // Prisma bağlantı string'i `postgres://` şemasını kullanır, `URL` bunu
  // native olarak ayrıştırabilir.
  parsedUrl = new URL(testDatabaseUrl)
} catch {
  throw new Error(`TEST_DATABASE_URL geçerli bir bağlantı string'i değil: ${testDatabaseUrl}`)
}

const isLocalHost = parsedUrl.hostname === "localhost" || parsedUrl.hostname === "127.0.0.1"
// `npx prisma dev`'in ürettiği ephemeral sunucular her zaman `template1`
// veritabanını kullanır (bu oturumda birden fazla kez doğrulandı) — bu,
// "bu gerçekten bir prisma dev ephemeral instance'ı" için makul bir işaret.
const looksLikeDatabaseName = parsedUrl.pathname.replace(/^\//, "") === "template1"

if (!isLocalHost || !looksLikeDatabaseName) {
  throw new Error(
    "TEST_DATABASE_URL, `npx prisma dev` ile üretilen ephemeral bir sunucuya " +
      "benzemiyor (host localhost/127.0.0.1 VE veritabanı adı 'template1' bekleniyordu, " +
      `alınan: host='${parsedUrl.hostname}' database='${parsedUrl.pathname}'). ` +
      "Uzak/gerçek görünen bir veritabanına karşı yanlışlıkla TRUNCATE çalıştırılmasını " +
      "önlemek için bu kontrol kasıtlı olarak katıdır — gerçekten farklı bir test kurulumu " +
      "kullanmanız gerekiyorsa bu dosyadaki deseni bilinçli olarak güncelleyin."
  )
}
