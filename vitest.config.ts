import { defineConfig } from "vitest/config"

/**
 * QA-002/QA-003 (`docs/TASK_BREAKDOWN.md`) ile tutarlı, minimal Vitest
 * kurulumu — bu turda yalnızca `lib/commerce/` servis katmanı için gerçek
 * (ephemeral, yerel) bir PostgreSQL'e karşı çalışan integration testleri
 * içindir. `tests/setup.ts`, testler için ayrı bir DATABASE_URL gerektirir
 * (bkz. o dosyadaki not) — gerçek/committed `.env` asla kullanılmaz.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    // Concurrency (oversell) testi bilinçli olarak eşzamanlı istek gönderir;
    // dosyalar arası paralellik test izolasyonunu bozabileceği için (aynı
    // test DB'sini paylaşıyorlar) dosyalar sıralı çalıştırılır.
    fileParallelism: false,
    // Vitest varsayılan olarak her test dosyasını izole bir modül kaydıyla
    // çalıştırır — bu, `tests/helpers/test-prisma.ts`'teki modül-seviyesi
    // `PrismaClient`'ın HER dosya için ayrı ayrı (ve birbirinden habersiz)
    // yeniden oluşturulup birden fazla bağlantı havuzu açmasına yol açar.
    // Birden fazla test dosyası aynı anda çalıştırıldığında (`npx vitest run`,
    // tek dosya değil) bu, yerel ephemeral `prisma dev` sunucusunun bağlantı
    // kapasitesini aşıp "Connection terminated unexpectedly" hatalarına yol
    // açtığı gözlemlendi. `isolate: false`, modül kaydını (ve dolayısıyla
    // `testPrisma` singleton'ını) tüm test dosyaları arasında PAYLAŞTIRIR —
    // `fileParallelism: false` ile birlikte tek bir bağlantı havuzu yeterli
    // olur.
    isolate: false,
  },
})
