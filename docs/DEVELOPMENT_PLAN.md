# Geliştirme Planı — Takı E-Ticaret Sitesi

> Bu belge, multi-agent planlama turunun birleşik raporuna ve storefront↔commerce↔payments contract alignment sonucuna (`CONTRACT_ALIGNMENT: PASS`) dayanır. Mimari sınırlar için `docs/ARCHITECTURE.md`'ye, görev detayları için `docs/TASK_BREAKDOWN.md`'ye, hemen başlanabilecek işler için `docs/FIRST_WAVE.md`'ye bakın. Kesin doğruluk kaynağı her zaman `docs/DECISIONS.md` ve `docs/OPEN_QUESTIONS.md`'dir.

Proje 9 ana faza ayrılmıştır. Fazlar büyük ölçüde sıralı olsa da bazıları (özellikle Design System/Storefront/Commerce) örtüşerek ilerleyebilir — sıralamayı belirleyen şey OPEN kararların hangi fazı bloke ettiğidir (bkz. her fazın Entry Conditions'ı).

---

## 1. Foundation

**Amaç:** Hiçbir iş mantığı içermeyen, salt teknik iskelet — repo, tooling, temel klasör mimarisi, güvenlik hijyeni.

**Primary Agent:** Team Lead (orkestrasyon) + security (hijyen denetimi: `.gitignore`, `.env.example`)

**Dependencies:** Yok — ilk fazdır.

**Entry Conditions:** `docs/BRIEF_READINESS.md`'nin READY_WITH_CONDITIONS sonucu ve teknoloji seti kararı (Next.js/TS/Tailwind/shadcn-ui/PostgreSQL/Prisma — CONFIRMED, `docs/PROJECT_BRIEF.md`).

**Exit Criteria:** Repo iskeleti kurulu; `.gitignore` (`.env*`, `node_modules`, `.next` dahil) ve `.env.example` (yalnızca placeholder anahtar adı) mevcut; temel klasör mimarisi (app/route grupları, domain katmanları için yer tutucu) üzerinde mutabakat var.

---

## 2. Design System

**Amaç:** Marka kimliği OPEN olduğu için nötr/placeholder token sistemi + kavramsal component envanteri kurmak; storefront'un tüketeceği bir token sözleşmesi üretmek.

**Primary Agent:** brand-ui

**Dependencies:** Foundation

**Entry Conditions:** Foundation tamamlanmış; `frontend-design` ve `licensed-media-scout` skill'leri kullanılabilir.

**Exit Criteria:** Token isimlendirme sözleşmesi storefront ile sabitlenmiş; nötr placeholder tema taslağı (tipografi ölçeği, spacing scale) belgelenmiş; kavramsal component envanteri shadcn/ui seçimleriyle eşleştirilmiş; hero/koleksiyon/editorial/marka hikâyesi görsel ihtiyaç listesi çıkarılmış.

---

## 3. Storefront

**Amaç:** 14 müşteri sayfasının route/component iskeletini, design token'ları tüketecek şekilde kurmak.

**Primary Agent:** storefront

**Dependencies:** Design System (token sözleşmesi), Commerce (taslak veri kontratı — zaten mevcut)

**Entry Conditions:** Token sözleşmesi hazır; Storefront↔Commerce kontratı (`docs/ARCHITECTURE.md` §4.1) zaten `PASS` durumda.

**Exit Criteria:** 14 route'un tamamı placeholder içerikle, varsayılan Server Component yaklaşımıyla kurulu; component prop/tip taslakları (ProductCard, generic VariantSelector, CartLineItem, CartSummary vb.) commerce kontratıyla uyumlu; checkout submit butonunun disabled/loading state iskeleti mevcut.

---

## 4. Commerce

**Amaç:** Product/Category/Collection/Variant/Stock/Cart/Order domain'inin kavramsal (nihai olmayan) modelini ve admin CRUD iş mantığı planını kurmak.

**Primary Agent:** commerce

**Dependencies:** Foundation, `jewelry-commerce` skill

**Entry Conditions:** OPEN #3/#4 kategorileri/varyant yapısı kabul edilerek esnek/opsiyonel öznitelik modeliyle ilerlenmesi onaylanmış.

**Exit Criteria:** Kavramsal varlık/ilişki haritası (taslak, `.prisma` değil) belgelenmiş; Order durum listesi taslağı hazır; DB-seviyesi atomik stok azaltma ilkesi (politikadan bağımsız) mimariye not düşülmüş; Storefront↔Commerce ve Commerce↔Payments kontratları mutabık (zaten `PASS`).

---

## 5. Checkout

**Amaç:** Storefront UI'ı ile commerce'in Order oluşturma mantığını, hizalanmış kontrata göre uçtan uca (ama gerçek ödeme sağlayıcısı olmadan, mock/stub ile) birleştirmek.

**Primary Agent:** storefront (UI) + commerce (Order oluşturma) — ortak sorumluluk

**Dependencies:** Storefront, Commerce, Payments (PaymentProvider arayüzü + ödeme yöntemi seçim UI kontratı)

**Entry Conditions:** Storefront↔Commerce↔Payments contract alignment `PASS` (zaten sağlandı — bkz. `docs/ARCHITECTURE.md` §4).

**Exit Criteria:** Checkout submit, `orderIdempotencyKey` ile idempotent şekilde Order üretiyor (gerçek ödeme sağlayıcısı olmadan, mock sonuçla); double-submit senaryosu (aynı key ile iki istek) tek Order'a düşüyor; hediye paketi/kargo alanları placeholder değerle çalışıyor.

---

## 6. Payments

**Amaç:** Provider-agnostic `PaymentProvider` soyutlamasını ve Havale/EFT akışını uçtan uca kurmak. Shopier entegrasyonu yalnızca gerçek hesapla doğrulama (D009/D010) tamamlandıktan sonra bu fazın bir alt-adımı olarak devam eder.

**Primary Agent:** payments

**Dependencies:** Commerce (Order-Payment kontratı — zaten `PASS`), Checkout iskeleti

**Entry Conditions:** Order-Payment kontratı mutabık; Havale/EFT için ek bir OPEN karar yok (D006/D007 zaten kesin). Shopier alt-adımı için ayrı bir giriş koşulu: gerçek Shopier hesabıyla teknik araştırmanın tamamlanmış olması (#9).

**Exit Criteria:** `PaymentProvider` arayüzü (başlatma/durum sorgulama/sonuç bildirimi) tanımlı; Havale/EFT ucu-uca çalışıyor (admin manuel onay → payments kaydı → commerce durum güncelleme); Shopier entegrasyonu ya tamamlanmış ya da açıkça "OPEN #9 bekliyor" olarak işaretli, hiçbir doğrulanmamış varsayım kodlanmamış.

---

## 7. Admin

**Amaç:** Tek admin rolüyle (D005) çalışan yönetim panelini kurmak — ürün/kategori/koleksiyon/varyant/stok/fiyat yönetimi, sipariş listesi/detayı, havale manuel onayı, site ayarları (iletişim, IBAN/açıklama, kargo ücreti/ücretsiz sınırı).

**Primary Agent:** commerce (domain/iş mantığı) — storefront ile birlikte (admin UI), security (auth guard)

**Dependencies:** Commerce, Security (trust boundary tanımı), Design System

**Entry Conditions:** Commerce domain taslağı hazır; security'nin admin trust boundary analizi (`docs/ARCHITECTURE.md` referanslı) mevcut.

**Exit Criteria:** Admin login + dashboard shell çalışıyor; merkezi bir guard/middleware TÜM admin route/API'lerini koruyor (sayfa-sayfa değil); ürün/kategori/koleksiyon/varyant CRUD ekranları (esnek şema ile) çalışıyor; sipariş listesi/detayı + havale manuel onay akışı çalışıyor; site ayarları (placeholder IBAN/kargo değerleriyle) yönetilebiliyor.

---

## 8. QA / Security

**Amaç:** Bu, diğer fazlara paralel yürüyen kesitsel bir fazdır — her modülün çıktısını kabul kriterleri ve trust boundary'ler açısından sürekli doğrulamak.

**Primary Agent:** qa + security

**Dependencies:** İlgili modülün (storefront/commerce/payments/admin) o anki çıktısı

**Entry Conditions:** 14 kabul kriterinin modül/test-seviyesi eşleştirmesi zaten tamamlandı (qa raporu); trust boundary analizi zaten tamamlandı (security raporu).

**Exit Criteria:** Test klasör yapısı ve framework seçimi (Vitest/Playwright, kavramsal) belgelenmiş; `.gitignore`/merkezi admin guard gibi first-wave güvenlik hijyeni (gerçek repo/kod oluşturulduğunda) uygulanmış; OPEN kararlara bağlı test senaryoları (stok yarış koşulu, Shopier eşleştirme, sipariş sorgulama doğrulaması) ilgili karar netleşene kadar `BLOCKED_BY_DECISION` olarak işaretli kalıyor.

**Not (test araçları ayrımı):** `.claude/skills/webapp-testing` skill'i (Python tabanlı Playwright) geliştirme sırasında ad-hoc/keşif amaçlı manuel doğrulama ve hata ayıklama için kullanılır; CI'da koşacak resmi E2E test suite'inin (muhtemelen `@playwright/test`, TypeScript, proje diliyle tutarlı) yerini almaz — ikisi tamamlayıcı, ayrı araçlardır.

---

## 9. Deployment

**Amaç:** Canlıya çıkmadan önce gereken tüm "canlı öncesi" kararları ve teknik hazırlığı tamamlamak.

**Primary Agent:** Team Lead (koordinasyon) + security (launch checklist)

**Dependencies:** Tüm önceki fazlar fonksiyonel olarak tamamlanmış olmalı

**Entry Conditions:** `docs/BRIEF_READINESS.md` Bölüm 8'deki "Canlıya Çıkmadan Önce Çözülmesi Gerekenler" listesinin tamamı (iade/değişim kuralları #13, fatura süreci #14, hukuki metinler, görsel tedarik/lisans kaydı #11, admin güvenlik önlemleri Risk R4, performans hedefi, bildirim kanalı #10) proje sahibi tarafından karara bağlanmış olmalı.

**Exit Criteria:** Production ortam değişkenleri/secret'ları güvenli şekilde yapılandırılmış; CSP/HSTS/HTTPS launch checklist tamamlanmış; tüm statik/hukuki sayfalar nihai metinle yayında; sistem gerçek müşteri trafiğine açılabilir durumda.

---

## Faz Bağımlılık Özeti

```
Foundation → Design System ─┬→ Storefront ─┐
                             │              ├→ Checkout → Payments ─┐
             Commerce ───────┴──────────────┘                      ├→ QA/Security (paralel, sürekli) → Deployment
                             └───────────────→ Admin ───────────────┘
```

QA/Security fazı diğer tüm fazlara paralel yürür; ayrı bir "bitiş noktası" değil, her fazın çıktısını sürekli doğrulayan bir kesittir.
