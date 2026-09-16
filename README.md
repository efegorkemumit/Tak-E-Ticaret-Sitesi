# Takı E-Ticaret Sitesi — Claude Code Multi-Agent ile Sıfırdan Gerçek Bir Proje

Bu depo, **YouTube'da bölüm bölüm çekilen bir video serisinin** kaynak kodudur. Gerçek bir müşteri brief'inden yola çıkıp, **Claude Code multi-agent ekibiyle** çalışan bir takı e-ticaret sitesini sıfırdan inşa ediyoruz — planlamadan veritabanına, admin panelinden ödeme kanallarına kadar.

> 📺 **YouTube kanalı:** [youtube.com/@EfeGorkemUmit](https://www.youtube.com/@EfeGorkemUmit)
> 🌐 **Web sitesi:** [www.efegorkemumit.com](https://www.efegorkemumit.com)

Videolarda "AI ile 5 dakikada site yaptım" tarzı bir demo yok. Amaç tam tersi: **gerçek bir projede AI ekibiyle çalışmanın nasıl bir şey olduğunu** göstermek — karar vermek, karar kaydı tutmak, gerçek veritabanına karşı test yazmak, güvenlik incelemesi yapmak, ve AI'ın ürettiği kodu olduğu gibi kabul etmeyip düzeltmek.

---

## İçindekiler

- [Video serisi](#video-serisi)
- [Bu projede ne var?](#bu-projede-ne-var)
- [İki satın alma kanalı](#iki-satın-alma-kanalı)
- [Teknoloji](#teknoloji)
- [Kurulum](#kurulum)
- [Testler](#testler)
- [Proje yapısı](#proje-yapısı)
- [Karar kaydı kültürü](#karar-kaydı-kültürü)
- [Multi-agent ekip](#multi-agent-ekip)
- [Kapsam sınırları](#kapsam-sınırları-önemli)

---

## Video serisi

Her commit bir videoya karşılık geliyor — `git log` ile seriyi adım adım takip edebilirsin.

| # | Video | Ne yapıldı |
|---|---|---|
| 01 | Gerçek Müşteri Brief'i — Claude ile Projeyi Planlıyoruz | Ham müşteri notlarından yapılandırılmış brief + açık sorular listesi |
| 02 | Hazır Agent'larla Claude Code Multi-Agent Ekibini Kuruyoruz | `.claude/agents/` — rol bazlı agent tanımları |
| 03 | Claude Code Multi-Agent Ekibine Skill ve Plugin Ekledim | `.claude/skills/` — domain bilgisi ve araçlar |
| 04 | Claude Multi-Agent Ekibine Projeyi Planlatıyoruz | Mimari belgesi, modül sahipliği, ilk dalga görev kırılımı |
| 05 | Multi-Agent ile Gerçek Projeyi Kodluyoruz | Tasarım sisteminden çalışan storefront'a |
| 06 | Gerçek E-Ticaret Motorunu Kuruyoruz | PostgreSQL, Variant, stok rezervasyonu, sepet & checkout |
| 07 | Gerçek Admin Panelini Yapıyoruz | Ürün, stok, görsel ve sipariş yönetimi |
| 08 | AI Siteyi Yaptı Ama Tasarım Kötü Oldu | Storefront + Admin UI'ı baştan düzeltiyoruz |
| 09 | Shopier'i Siteye Bağlıyoruz | Shopier ürün/satış linkleri + Havale/EFT akışı |

---

## Bu projede ne var?

### Müşteri tarafı (storefront)

- Ana sayfa, ürün listesi, kategori ve koleksiyon sayfaları
- Ürün detayı — varyant seçici (beden/materyal/taş türü), galeri, bakım bilgisi
- Sepet (client-side, sayfa yenilemesinde korunur) ve misafir checkout (üyelik yok)
- Sipariş başarı ekranı — gerçek banka/IBAN bilgisi ve havale açıklaması
- `/siparis-sorgula` — sipariş numarası + e-posta ile public sipariş takibi

### Yönetim paneli

- Kendi oturum sistemi (üçüncü taraf kimlik servisi yok), argon2 parola hash'i
- Ürün / varyant / SKU / fiyat / stok yönetimi, görsel yükleme ve sıralama
- Kategori, koleksiyon ve esnek öznitelik (materyal, kaplama, taş türü, ölçü…) yönetimi
- Sipariş listesi, durum geçişleri, kargo takip bilgisi
- **Havale kuyruğu** — ödemeyi onaylama / reddetme
- `/admin/settings` — banka bilgisi, IBAN, havale açıklama şablonu, rezervasyon süresi

### Commerce motoru

- `Product` → `Variant` modeli: SKU, fiyat ve stok **yalnızca varyant seviyesinde**
- **Stok rezervasyonu**: sipariş oluşturulduğu anda stok rezerve edilir, ödeme onaylanınca kalıcı düşülür
- `availableQuantity = stockQuantity − Σ(aktif rezervasyon)` — tek, paylaşılan formül
- Transaction + `SELECT … FOR UPDATE` ile **oversell koruması** (eşzamanlılık testleriyle doğrulanmış)
- Idempotent sipariş oluşturma — çift tıklama veya retry ikinci sipariş açmaz
- 24 saatlik zaman aşımı job'ı — ödenmemiş havale siparişini iptal edip stoğu serbest bırakır

---

## İki satın alma kanalı

Video 09'un en önemli mimari kararı: **Shopier bizim checkout'umuzun içinde bir ödeme sağlayıcısı değil, ayrı bir satış kanalı.**

| | **Havale / EFT** | **Shopier** |
|---|---|---|
| Giriş | Ürün detayında **"Sepete Ekle"** | Ürün detayında **"Shopier'den Satın Al"** |
| Akış | Sepet → Checkout → `Order` | Kayıtlı Shopier ürün sayfasına yönlendirme |
| Sipariş kaydı | Bizim veritabanımız | Shopier'in kendi sistemi |
| Ödeme onayı | Admin panelinden manuel | Shopier panelinde |
| Stok | `InventoryReservation` + `Variant.stockQuantity` | Shopier'in kendi alanı |

Katalog ve stok için doğruluk kaynağı **her zaman bu veritabanıdır**; Shopier'e tek yönlü yazılır, Shopier'den geri okunmaz. `Product.shopierUrl` her yazma ve her okumada izinli Shopier domain'lerine karşı doğrulanır (`lib/shopier/url.ts`) — open redirect ve link injection yüzeyi bilinçli olarak kapatılmıştır.

---

## Teknoloji

| Katman | Seçim |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack), React 19 |
| Dil | TypeScript (strict) |
| Stil | Tailwind CSS v4, Base UI primitive'leri |
| Veritabanı | PostgreSQL 16 (Docker) |
| ORM | Prisma 7 + `@prisma/adapter-pg` |
| Test | Vitest — **gerçek PostgreSQL'e karşı**, mock DB yok |
| Auth | Kendi oturum sistemi, `@node-rs/argon2` |
| Storage | Object storage adapter (S3 uyumlu) + local adapter |

---

## Kurulum

### Gereksinimler

- Node.js 20.9+ (bu projede 22.x ile geliştirildi)
- Docker (PostgreSQL için)

### Adımlar

```bash
# 1. Bağımlılıklar
npm install

# 2. Veritabanını başlat (port 5435 — 5432 başka bir projede kullanıldığı için)
docker compose up -d

# 3. Ortam değişkenleri
cp .env.example .env
# .env içindeki DATABASE_URL placeholder'dır — docker compose ile gelen yerel
# veritabanına çevir:
#   DATABASE_URL="postgresql://postgres:postgres@localhost:5435/jewelry_store?schema=public"

# 4. Şemayı uygula
npx prisma migrate deploy
npx prisma generate

# 5. Demo veri (opsiyonel — açıkça DEMO olarak işaretli örnek ürünler)
npx prisma db seed

# 6. Geliştirme sunucusu
npm run dev
```

Site: <http://localhost:3000> • Panel: <http://localhost:3000/admin>

İlk admin hesabını `/admin/setup` üzerinden oluşturursun (yalnızca hiç admin yokken açıktır).

### Komutlar

```bash
npm run dev            # geliştirme sunucusu
npm run build          # production build
npm run typecheck      # next typegen + tsc --noEmit
npm run lint           # eslint
npm run test           # vitest (test DB gerektirir, aşağıya bkz.)
npm run expire-orders  # 24 saat zaman aşımı job'ını elle çalıştır
```

---

## Testler

**234 test / 24 dosya — hepsi gerçek bir PostgreSQL'e karşı çalışır.** Stok yarış koşulu, transaction ve kilit davranışı mock bir veritabanıyla anlamlı biçimde doğrulanamaz.

Testler hedef veritabanını `TRUNCATE CASCADE` eder. Bu yüzden **üç bağımsız güvenlik katmanı** vardır: testler `DATABASE_URL`'i asla okumaz, açık bir `ALLOW_DESTRUCTIVE_TEST_DB=1` onayı ister, ve bağlantı string'inin geçici (ephemeral) bir `prisma dev` sunucusuna benzemesini şart koşar.

```bash
# 1. Geçici test veritabanı başlat
npx prisma dev -n test-db --db-port 51213 --port 51214 -d
# → yazdırdığı url'i kullan (port meşgulse Prisma başka bir port seçer)

# 2. Şemayı test DB'sine uygula
#    DİKKAT: migrate deploy bağlantıyı DATABASE_URL'den okur, TEST_DATABASE_URL'den DEĞİL
DATABASE_URL="<prisma dev'in yazdırdığı url>" npx prisma migrate deploy

# 3. Testleri çalıştır
ALLOW_DESTRUCTIVE_TEST_DB=1 \
  TEST_DATABASE_URL="<aynı url>" \
  npx vitest run

# 4. İşin bitince temizle
npx prisma dev stop test-db && npx prisma dev rm test-db --force
```

Kapsanan kritik senaryolar: oversell koruması, idempotent sipariş, çift ödeme onayı (stok iki kez düşmez), ödeme reddi + rezervasyon serbest bırakma, 24 saat zaman aşımı, Shopier URL allowlist'i (userinfo/punycode/`endsWith` tuzakları dahil), sipariş sorgulamada account enumeration ve PII sızıntısı.

---

## Proje yapısı

```
app/
  (storefront)/       müşteri tarafı rotalar
  admin/(protected)/  yönetim paneli (auth guard'lı)
components/
  admin/  cart/  checkout/  product/  ui/  order-lookup/
lib/
  commerce/   sipariş, stok, katalog, sipariş sorgulama, zaman aşımı
  admin/      admin domain servisleri (hepsi requireAdmin çağırır)
  auth/       oturum, parola, rate limit
  settings/   SiteSettings, IBAN doğrulama, havale şablonu
  shopier/    Shopier URL allowlist doğrulayıcısı
  storage/    object storage adapter'ları
prisma/       şema, migration'lar, demo seed
tests/        gerçek PostgreSQL'e karşı integration testleri
docs/         brief, kararlar, mimari, açık sorular
```

---

## Karar kaydı kültürü

Bu projenin en önemli parçası `docs/` klasörü. AI ile çalışırken en büyük risk, modelin **doğrulanmamış bir varsayımı gerçekmiş gibi** koda gömmesi. Buna karşı proje boyunca şu belgeler tutuldu:

| Belge | İçerik |
|---|---|
| `docs/PROJECT_BRIEF.md` | Müşteri brief'inin yapılandırılmış hâli |
| `docs/DECISIONS.md` | **D001–D034** — her kesin karar, gerekçesi ve yeniden değerlendirme koşuluyla |
| `docs/OPEN_QUESTIONS.md` | Henüz cevaplanmamış sorular ve geçici varsayımlar |
| `docs/ARCHITECTURE.md` | Modül sınırları, kontratlar, trust boundary'ler |
| `docs/DESIGN_DIRECTION.md` | Tasarım yönü ve component envanteri |

Kod içindeki yorumlar da aynı disiplini izler: **"ne yaptığını" değil "neden böyle yaptığını"** anlatır. Bir kararın geçmişi silinmez — değişen bir karar `Değişti → bkz. D0XX` olarak işaretlenir.

---

## Multi-agent ekip

`.claude/agents/` altında tanımlı rol bazlı agent'lar:

| Agent | Sorumluluk |
|---|---|
| `backend-developer` | Ürün, varyant, stok, sepet, sipariş domain'i |
| `frontend-developer` | Storefront ve admin arayüzü |
| `payment-integration` | Ödeme kanalları, idempotency, ödeme güvenliği |
| `ui-designer` | Tasarım sistemi, erişilebilirlik |
| `test-automator` | Test stratejisi ve otomasyonu |
| `security-auditor` | Auth, ödeme, PII akışlarının güvenlik incelemesi |

`.claude/skills/` altında proje domain bilgisi (`jewelry-commerce`), görsel lisans araştırması (`licensed-media-scout`), tasarım rehberi ve Prisma skill'leri bulunur.

Ana oturum **team lead** olarak çalışır: işi paralel agent'lara böler, dosya sınırlarını belirler, çakışmaları çözer ve sonucu merkezi olarak doğrular.

---

## Kapsam sınırları (önemli)

Bu bir **geliştirme aşamasındaki MVP**'dir, canlıya alınmış bir mağaza değildir.

- Marka adı, logo ve kurumsal kimlik hâlâ `[MARKA_ADI]` gibi **placeholder**
- Katalogdaki ürünler açıkça **DEMO** olarak işaretli örnek verilerdir
- **MVP dışı** (bilinçli): müşteri üyeliği, favoriler, ürün yorumları, kupon sistemi, çoklu para birimi, uluslararası satış
- Kargo ücreti / ücretsiz kargo sınırı henüz karara bağlanmadı
- Sistem **fatura/e-Fatura üretmez** — Shopier satışlarının muhasebesi Shopier ekosistemine bırakılmıştır
- Rate limit bellek içidir; çok instance'lı bir dağıtımda yeniden değerlendirilmelidir
- Zaman aşımı job'ı hazır ama production scheduler'a **henüz bağlanmadı**

Görsel politikası da bilinçli bir karardır: ürün kartlarında ve ürün detayında **yalnızca gerçek ürün fotoğrafı** kullanılır; lisanslı stok görseller yalnızca hero/koleksiyon kapağı/editorial alanlarda kullanılabilir. Projede **hiçbir ürün görseli AI ile üretilmez**.

---

## Bağlantılar

- 📺 YouTube: [youtube.com/@EfeGorkemUmit](https://www.youtube.com/@EfeGorkemUmit)
- 🌐 Web: [www.efegorkemumit.com](https://www.efegorkemumit.com)

Soruların veya önerilerin varsa video altındaki yorumlardan yazabilirsin.
