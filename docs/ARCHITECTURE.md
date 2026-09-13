# Mimari Belgesi — Takı E-Ticaret Sitesi

> Bu belge, multi-agent planlama turunun (brand-ui, storefront, commerce, payments, qa, security) birleşik raporuna ve ardından storefront↔commerce↔payments arasında yürütülen contract alignment turunun (`CONTRACT_ALIGNMENT: PASS`) sonucuna dayanır. Kesin doğruluk kaynağı her zaman `docs/PROJECT_BRIEF.md`, `docs/OPEN_QUESTIONS.md`, `docs/DECISIONS.md`, `docs/BRIEF_READINESS.md` ve `docs/AGENT_TEAM.md`'dir; bu belge onlarla çelişirse kaynak belgeler esastır. Henüz hiçbir uygulama kodu, dependency, Next.js projesi veya Prisma şeması oluşturulmamıştır — bu tamamen bir mimari planlama belgesidir.

---

## 1. System Overview

Sistem, Next.js + TypeScript + Tailwind CSS + shadcn/ui + PostgreSQL + Prisma teknoloji setiyle (CONFIRMED, `docs/PROJECT_BRIEF.md`) kurulacak, guest-checkout tabanlı (D004), tek admin rollü (D005), Türkiye pazarına (D001), Türkçe (D002) ve TRY (D003) para birimine yönelik bir e-ticaret sistemidir. Müşteri tarafı (storefront) ve yönetim paneli (admin), ortak bir commerce domain'i üzerinden çalışır; ödeme, sağlayıcıdan bağımsız bir soyutlama (D008) arkasında Shopier ve Havale/EFT (D006) olmak üzere iki yöntemi destekler.

Sistem dört ana modülden oluşur: **Storefront** (müşteri arayüzü), **Commerce** (ürün/katalog/sepet/sipariş domain'i ve admin iş mantığı), **Payments** (sağlayıcıdan bağımsız ödeme katmanı), ve bunları çevreleyen **Design System**, **QA** ve **Security** kesitleri.

## 2. Module Ownership

| Modül | Sahip (agent) | Kapsam |
|---|---|---|
| Design System | brand-ui (ui-designer) | Token sistemi, component envanteri, erişilebilirlik ilkeleri, asset ihtiyaç planlaması |
| Storefront | storefront (frontend-developer) | Müşteri arayüzü, route yapısı, component implementasyonu |
| Commerce | commerce (backend-developer) | Product/Category/Collection/Variant/Stock/Cart/Order domain'i, admin commerce iş mantığı |
| Payments | payments (payment-integration) | PaymentProvider soyutlaması, Shopier/Havale-EFT entegrasyonu, ödeme-sipariş eşleştirmesi |
| QA | qa (test-automator) | Test stratejisi, kabul kriteri eşleştirmesi, test altyapısı |
| Security | security (security-auditor) | Trust boundary analizi, güvenlik risk/recommendation yönetimi |

Bu tablo `docs/AGENT_TEAM.md`'deki "Team Members" tablosunun mimari yansımasıdır; ownership sınırları orada tanımlanan "Must Not Do" kurallarıyla birlikte geçerlidir.

## 3. Domain Boundaries

Commerce domain'i, `jewelry-commerce` skill'inin terminolojisiyle tutarlı şu varlıkları kapsar (kesin şema değil, kavramsal sınır):

- **Category** — navigasyonel, nispeten sabit sınıflandırma.
- **Collection** — tematik/sezonluk, kategoriler arası kesişebilen küratörlü gruplama.
- **Product** — katalog seviyesinde görünürlük/içerik birimi. Şu anki, henüz `docs/DECISIONS.md`'ye taşınmamış mühendislik tercihinde (bkz. §7) tek başına satılabilir birim olarak modellenmiyor.
- **Variant** — bu tercihte satılabilir birim adayı: öznitelik kombinasyonu + SKU/Price/Stock'un varyant seviyesinde tutulması önerisi. **Bu son madde §7'de listelenen, henüz onaylanmamış bir mühendislik önerisidir — kesin mimari karar değildir.** Tüm öznitelikler (materyal, kaplama, renk, taş türü, ölçü, zincir uzunluğu) opsiyonel tutulur (OPEN #4 netleşene kadar).
- **Cart** — guest'e bağlı, geçici, satır bazlı fiyat/adet taşıyan yapı.
- **Order** — commerce'in sahiplendiği tek gerçeklik kaynağı; sipariş numarası, teslimat/iletişim bilgisi, satır kalemi anlık görüntüsü (snapshot), ödeme yöntemi, kendi sipariş durumu (`orderStatus` — Ödeme Bekliyor/Hazırlanıyor/Kargoya Verildi/Teslim Edildi/İptal Edildi/İade Edildi), kargo takip kodunu taşır. **Ham/jenerik `paymentStatus` (PENDING/CONFIRMED/FAILED) Order'ın kendi alanı değildir**, yalnızca Payment kaydında tutulur (bkz. §4.3/§5.3) — commerce, payments'tan gelen bu sinyale göre kendi `orderStatus`'unu günceller.
- **Payment** — payments'ın sahiplendiği, Order'a `orderId` üzerinden bağlı ayrı bir kayıt; ödeme durumu ve sağlayıcı referansını taşır.

Bu sınırların en kritik ilkesi: **Order ownership tamamen commerce'te kalır; payments Order domainini yeniden tasarlamaz veya Order.status'a doğrudan yazmaz.**

## 4. Cross-Module Contracts

Aşağıdaki üç kontrat, storefront↔commerce↔payments arasında yürütülen contract alignment turunda (`CONTRACT_ALIGNMENT: PASS`) üç tarafça da mutabık kalınmıştır. Tamamı alan-seviyeli/kavramsaldır — kod veya şema değildir — ve ilgili OPEN kararlardan (#4, #8, #9) bağımsız çalışacak şekilde tasarlanmıştır.

### 4.1 Storefront → Commerce Kontratı

Checkout submit sırasında storefront'un commerce'e gönderdiği minimum alanlar:

- `cartReference` — hangi sepetin siparişe dönüştüğü.
- `orderIdempotencyKey` — storefront'ta checkout sayfası **mount anında bir kez** üretilir; retry/çift tıklamada değişmeden yeniden gönderilir; sepet değişip yeniden checkout'a girilirse yeni key üretilir.
- `contact`: fullName, phone, email.
- `deliveryAddress`: addressLine, city, district, postalCode (ülke TR sabit — D001).
- `giftPackagingSelected`: opsiyonel boolean — checkout'a etkisi (ücret vb.) hâlâ OPEN (`docs/PROJECT_BRIEF.md` Bölüm 10); backend şimdilik yalnızca kaydeder, ücretlendirme mantığı yoktur.
- `paymentMethod`: `"SHOPIER" | "BANK_TRANSFER"` (D006) — provider'a özgü hiçbir alan bu istekte yer almaz.

### 4.2 Commerce → Payments Kontratı

Commerce, Order oluşturduktan sonra payments'a minimum şu bilgiyi verir:

- `orderId`, `orderNumber`, `totalAmount`, `currency` (TRY — D003), `paymentMethod`, `orderIdempotencyKey`.
- **Bilinçli olarak dışarıda bırakılan:** müşteri PII'si (isim/adres/telefon) ve line-item kırılımı. Shopier'in gerçek entegrasyon yöntemi netleşmeden (D009/D010) bunlara ihtiyaç olup olmadığı bilinmediği için commerce bunları baştan itmez; payments gerekirse `orderId` üzerinden on-demand sorgular.

### 4.3 Payments → Commerce Kontratı

Payments, sonucu commerce'e (transport mekanizmasından bağımsız) şu minimum alanlarla bildirir:

- `orderId`, `paymentMethod`, `paymentStatus`: `"PENDING" | "CONFIRMED" | "FAILED"` (jenerik, Shopier'e özgü durum adı yok — D010).
- `providerReference` — opak string (Havale'de admin'in dekont/eşleştirme notu; Shopier'de içeriği yöntem netleşmeden tanımlanmadı; Havale/EFT'te null olabilir).
- `occurredAt`/`confirmedAt` — audit zaman damgası. `confirmedBy` ortak kontratın parçası değildir, payments'ın kendi audit kaydında kalır.
- `errorReason` — opsiyonel, jenerik (provider'a özel hata kodu sızdırılmaz).

## 5. Trust Boundaries

Bu bölüm, security'nin planlama raporundaki trust boundary analizini beş alt sınıra ayırır. `docs/AGENT_TEAM.md`'deki security'nin "Primary Responsibility" tanımıyla (Admin/Order Lookup/Payment/Secret/PII) birebir eşleşir.

### 5.1 Admin

- **Güvenilir:** Panelde geçerli, süresi dolmamış bir admin oturumuna sahip istek (sunucu tarafı session/JWT doğrulaması).
- **Güvenilmez:** Panel URL'sine erişen herhangi bir kimliksiz/anonim istek; client tarafında tutulan herhangi bir "isAdmin" bayrağı.
- **Sınırda doğrulanması gereken:** Her admin route/API çağrısında sunucu tarafı merkezi guard/middleware (yalnızca login sayfasında değil, her işlemde). D005 gereği tek rol olduğundan karmaşık bir yetki matrisi gerekmez.

### 5.2 Order Lookup

- **Güvenilir:** Baştan kimse güvenilir değildir — bu, D004 ile tutarlı, kimliksiz herhangi bir ziyaretçinin erişebileceği public bir formdur.
- **Güvenilmez:** Sipariş numarasını bilen/tahmin eden/deneyen herhangi bir üçüncü kişi.
- **Sınırda doğrulanması gereken:** D015 gereği sipariş numarası TEK BAŞINA yeterli değildir; sipariş no + ikinci bir doğrulama alanı (kesin alan OPEN #12) birlikte sunucu tarafında eşleşmelidir.

### 5.3 Payment Boundary

- **Order↔Payment kimlikleri:** `orderId` (dahili, kararlı, sistemsel/otomatik eşleştirmenin canonical anahtarı), `orderNumber` (yalnızca insana dönük/manuel eşleştirme — havale açıklaması, olası manuel Shopier eşleştirmesi), `orderIdempotencyKey` (storefront üretir, commerce unique constraint ile korur), `providerReference` (opak, provider'a özgü iç yapısı commerce/storefront'a hiç açılmaz).
- **Provider-specific alanlar yalnızca payments katmanında kalır:** olası webhook/callback payload'ı, olası imza/secret doğrulama verisi, sağlayıcının kendi durum kodları, olası SDK/iframe detayları — bunların hiçbiri Shopier için henüz doğrulanmamıştır (D009/D010), yöntem netleşince payments katmanında ayrıca ele alınacaktır. Storefront ve commerce bunları hiç görmez, sınırı geçen tek şey opak `providerReference` string'idir.
- **Storefront, provider'a özgü Shopier detaylarını (redirect/embedded/provider button) şimdiden bilmez ve bilmesine gerek yoktur.** Checkout, yalnızca jenerik, genişleyebilir `nextStep: { type: "REDIRECT" | "NONE", url? }` sözleşmesine dayanır; Shopier yöntemi (#9/D009-D010) netleşince yeni bir `type` case'i eklemek yeterli olacaktır — hiçbir mimari şimdiden kesin seçilmemiştir.

### 5.4 Secret

- **Güvenilir:** Sunucu tarafı ortam değişkenleri, deploy platformunun secret store'u.
- **Güvenilmez:** Git deposu, client bundle (Next.js'te `NEXT_PUBLIC_` öneki olmayan hiçbir değer client'a sızmamalı), loglar, hata mesajları.
- **Sınırda doğrulanması gereken:** `.env.example` yalnızca anahtar adlarını içerir; `.gitignore` bu sınırın en somut mekanik korumasıdır (bkz. `docs/FIRST_WAVE.md` FW-04/FW-05).

### 5.5 PII (Kişisel Veri)

- **Güvenilir:** Sipariş verisini (ad, adres, telefon, e-posta) yalnızca kimliği doğrulanmış admin veya doğru doğrulama alanıyla sipariş sahibinin kendisi görebilir.
- **Güvenilmez:** Diğer tüm kimliksiz istekler, log/analytics/hata izleme araçları (varsayılan olarak PII'yi maskelenmemiş şekilde toplayabilir).
- **Sınırda doğrulanması gereken:** Sunucu loglarına/hata izlemeye PII'nin redakte edilmeden yazılmaması; hiçbir API yanıtının başka bir müşterinin PII'sini sızdırmaması (özellikle order lookup).

## 6. Idempotency Ownership

D017 ("idempotent sipariş ve ödeme akışları") ilkesinin mimari karşılığı:

- **Key üreticisi:** storefront, checkout sayfası mount anında, client state'te (sessionStorage/form state) — buton tıklamasında değil.
- **Aynı kalma süresi:** tüm checkout denemesi boyunca (retry/çift tıklama/sayfa yenileme dahil) — yeniden üretilmez, yeniden kullanılır. Aynı key, ödeme adımına devam çağrılarında da yeniden kullanılır.
- **Yeni key gereken durum:** yalnızca müşteri checkout'tan çıkıp sepeti değiştirip yeniden girdiğinde.
- **Çift gönderim engeli:** storefront'ta submit butonunun disable+loading state'e alınması ilk savunma katmanıdır; **asıl garanti commerce'in Order tablosunda `orderIdempotencyKey` üzerindeki DB-seviyesi unique constraint'idir** — aynı key ile ikinci istek gelirse yeni Order açılmaz, mevcut `orderNumber` ile aynı Order döner.
- **Ödeme retry ayrımı:** ayrı bir "payment-attempt key" fikri değerlendirilip geri çekilmiştir; tek order-level `orderIdempotencyKey` yeterli kabul edilmiştir. Payments kendi attempt state machine'inde önceki deneme PENDING/CONFIRMED ise mevcut sonucu döndürür (dedupe), FAILED (terminal) ise aynı key ile gelen çağrıyı meşru bir retry sayar.
- **Defense-in-depth:** merkezi tek bir hakem yoktur — commerce kendi order/stok mutasyonunu (aynı `orderId` için ikinci kez stok düşürme/durum geçişi olmaması), payments kendi payment-status kaydını (aynı key/`providerReference` için ikinci kez yazmama) kendi tarafında bağımsız olarak korur.

## 7. Open Architecture Decisions

Aşağıdakiler bu belgede **kesinleştirilmemiştir** — mimari, hangi yönde sonuçlanırlarsa sonuçlansınlar çalışacak şekilde tasarlanmıştır:

| Konu | Kaynak | Bu mimarideki durumu |
|---|---|---|
| Kesin ürün kategorileri | `docs/OPEN_QUESTIONS.md` #3 | Esnek/genişletilebilir Category yapısı varsayımı |
| Kesin varyant yapısı | #4 | Tüm öznitelikler opsiyonel, generic attribute modeli |
| Stok düşme/rezervasyon politikası | #8, `docs/DECISIONS.md` D016 | Kontrat bu politikadan bağımsız çalışır (stok, Order'ın iç adımı, Order-Payment sınırının parçası değil); DB-seviyesi atomik azaltma ilkesi politikadan bağımsız olarak şimdiden geçerlidir |
| Shopier teknik entegrasyon yöntemi | #9, D009/D010 | PaymentProvider tamamen soyut; hiçbir Shopier'e özgü alan/davranış varsayılmadı |
| Görsel tedarik kaynağı | #11 | Panel görsel yükleme özelliğiyle hazır tutuluyor |
| Sipariş sorgulama doğrulama alanı | #12, D015 | Generic "doğrulama bilgisi" alanı; kesin alan (e-posta/telefon) netleşmeden implementasyon kilitlenmez |
| Hediye paketi checkout etkisi | `docs/PROJECT_BRIEF.md` Bölüm 10 | Opsiyonel/gizlenebilir slot, ücretlendirme mantığı yok |
| Kargo ücreti/ücretsiz kargo sınırı | #5/#6/#7 | §4.1'deki checkout kontratına dahil edilmedi — kargo ücreti sunucu tarafında (commerce) hesaplanır ve yalnızca sonuç toplamına yansır; storefront'un göndereceği bir alan değildir. Nihai ücret/sınır değeri OPEN. |

**Henüz `docs/DECISIONS.md`'ye taşınmamış mühendislik önerileri** (proje kararı değil, ilgili teammate'in tercihi — Lead/proje sahibi onayı gerekir): SKU/fiyat/stok'un her zaman Variant seviyesinde tutulması (bkz. §3); Category-Collection çoktan-çoğa ilişki; `PaymentMethod` enum adlarının `SHOPIER`/`BANK_TRANSFER` olması (bu son madde yalnızca D006'nın isimlendirme yansımasıdır, yeni bir karar değildir).

**Security'nin koşullu/recommendation nitelikli önerileri** (kesin karar değil): webhook imza doğrulaması ve buna bağlı sağlayıcı-bildirim dedup katmanı (yalnızca Shopier webhook desteği doğrulanırsa geçerli — §6'daki `orderIdempotencyKey` mekanizması sipariş/ödeme akışını zaten kapsıyor, ama henüz var olmayan bir Shopier webhook'unu kapsamaz), admin rate limiting/lockout, sipariş sorgulamada opak sipariş no/jenerik hata mesajı, CSP/HSTS/HTTPS launch checklist. Bunlar `docs/AGENT_TEAM.md`'deki Recommendations listesiyle tutarlıdır.
