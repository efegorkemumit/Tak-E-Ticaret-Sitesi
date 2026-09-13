# Görev Kırılımı — Takı E-Ticaret Sitesi

> Bu belge, `docs/DEVELOPMENT_PLAN.md`'deki 9 fazı agent bazında somut görevlere ayırır. Kaynak: multi-agent planlama raporu + storefront↔commerce↔payments contract alignment (`CONTRACT_ALIGNMENT: PASS`). Kesin doğruluk kaynağı `docs/DECISIONS.md` ve `docs/OPEN_QUESTIONS.md`'dir; bu belge hiçbirini değiştirmez.
>
> **Status değerleri:** `READY` (hemen planlanabilir/başlanabilir, hiçbir OPEN karara bağlı değil), `DONE` (bu planlama sürecinde zaten tamamlandı — kod değil, sözleşme/analiz çıktısı), `BLOCKED_BY_DECISION` (ilgili OPEN karar netleşmeden başlanamaz/tamamlanamaz).
>
> ID önekleri: `UI-` (brand-ui), `FE-` (storefront), `COM-` (commerce), `PAY-` (payments), `QA-` (qa), `SEC-` (security).

---

## UI — brand-ui

| ID | Task | Primary Owner | Dependencies | Decision Gate | Status |
|---|---|---|---|---|---|
| UI-001 | Design token isimlendirme sözleşmesi (renk/tipografi/spacing) | brand-ui | — | — | READY |
| UI-002 | Nötr placeholder tema taslağı (tipografi ölçeği, spacing scale, nötr renk ailesi) | brand-ui | UI-001 | — | READY |
| UI-003 | Kavramsal component envanteri + shadcn/ui eşleştirmesi | brand-ui | UI-002 | — | READY |
| UI-004 | Checkout submit disabled/loading state ilkesinin ortak dokümantasyonu (D017 UI katkısı) | brand-ui | UI-003, FE-004, PAY-007 | — | READY |
| UI-005 | Hero/koleksiyon/editorial/marka hikâyesi görsel ihtiyaç listesi (`licensed-media-scout` şablonuyla) | brand-ui | — | — | READY |
| UI-006 | Nihai renk/logo/tipografi uygulaması | brand-ui | UI-002 | OPEN #1/#2 — Marka adı, logo/kurumsal kimlik | BLOCKED_BY_DECISION |

## FE — storefront

| ID | Task | Primary Owner | Dependencies | Decision Gate | Status |
|---|---|---|---|---|---|
| FE-001 | 14 müşteri route iskeleti (placeholder içerik, varsayılan Server Component) | storefront | UI-002 | — | READY |
| FE-002 | Header/Footer/MobileNav shell | storefront | UI-001 | — | READY |
| FE-003 | ProductCard/ProductGallery/generic VariantSelector/CartLineItem/CartSummary prop-tip taslakları | storefront | COM-002 | — | READY |
| FE-004 | Checkout stepper iskeleti (teslimat+iletişim formu+generic ödeme yöntemi seçici+sipariş özeti) | storefront | COM-004, PAY-002, PAY-003 | — | READY |
| FE-005 | OrderLookupForm iskeleti (sipariş no + generic "doğrulama bilgisi" placeholder alanı) | storefront | — | — | READY |
| FE-006 | OrderLookupForm'un kesin doğrulama alanının (e-posta/telefon) implementasyonu | storefront | FE-005 | OPEN #12/D015 — Doğrulama alanı | BLOCKED_BY_DECISION |
| FE-007 | Ortak LegalContentPage template'i (placeholder metinle) | storefront | FE-001 | — | READY |
| FE-008 | Nihai hukuki metinlerin (iade/değişim, gizlilik, mesafeli satış) sayfalara girilmesi | storefront | FE-007 | OPEN #13 — İade/değişim kuralları; `docs/PROJECT_BRIEF.md` Bölüm 8 — gizlilik/mesafeli satış kesin metinleri | BLOCKED_BY_DECISION |
| FE-009 | Nihai kategori/varyant verisine göre sabit UI kilitlenmesi | storefront | FE-003 | OPEN #3/#4 — Kategori/varyant yapısı | BLOCKED_BY_DECISION |
| FE-010 | Nihai kargo hesaplama mantığının UI'a gömülmesi | storefront | FE-004 | OPEN #5/#6/#7 — Kargo firması/ücret/ücretsiz sınır | BLOCKED_BY_DECISION |

## COM — commerce

| ID | Task | Primary Owner | Dependencies | Decision Gate | Status |
|---|---|---|---|---|---|
| COM-001 | Kavramsal varlık/ilişki haritası (Product/Category/Collection/Variant/Stock/Cart/Order, taslak) | commerce | `jewelry-commerce` skill | — | READY |
| COM-002 | Storefront ↔ Commerce veri kontratı | commerce | COM-001 | — | **DONE** (contract alignment) |
| COM-003 | Commerce ↔ Payments Order-Payment kontratı | commerce | COM-001 | — | **DONE** (contract alignment, `PASS`) |
| COM-004 | Order durum listesi taslağı (Ödeme Bekliyor/Hazırlanıyor/Kargoya Verildi/Teslim Edildi/İptal Edildi/İade Edildi) | commerce | COM-001 | — | READY |
| COM-005 | DB-seviyesi atomik stok azaltma ilkesinin mimariye eklenmesi (politikadan bağımsız genel kural) | commerce | COM-001 | — | READY |
| COM-006 | `orderIdempotencyKey` unique constraint tasarımı (Order üzerinde) | commerce | COM-003 | — | READY |
| COM-007 | Esnek/opsiyonel öznitelik modelinin admin ürün formu tasarımına yansıtılması | commerce | COM-001, UI-003 | — | READY |
| COM-008 | Admin ürün/kategori/koleksiyon/varyant/stok/fiyat CRUD ekranlarının domain mantığı (iskelet) | commerce | COM-001, SEC-003 | — | READY |
| COM-009 | Nihai kategori listesinin veri olarak girilmesi | commerce | COM-001 | OPEN #3 — Kesin kategoriler | BLOCKED_BY_DECISION |
| COM-010 | Nihai varyant şemasının kilitlenmesi ve Prisma şemasının yazılması | commerce | COM-007 | OPEN #4 — Varyant yapısı | BLOCKED_BY_DECISION |
| COM-011 | Stok düşme/rezervasyon politikasının uygulanması (düşme anı, havale bekleme süresi) | commerce | COM-005 | OPEN #8/D016 — Stok politikası | BLOCKED_BY_DECISION |
| COM-012 | Hediye paketi ücretlendirme/checkout adımı mantığının uygulanması | commerce | COM-004 | `docs/PROJECT_BRIEF.md` Bölüm 10 — Hediye paketi etkisi | BLOCKED_BY_DECISION |

## PAY — payments

| ID | Task | Primary Owner | Dependencies | Decision Gate | Status |
|---|---|---|---|---|---|
| PAY-001 | `PaymentProvider` soyut arayüz taslağı (başlatma/durum sorgulama/sonuç bildirimi) | payments | — | — | READY |
| PAY-002 | `PaymentMethod` enum iskeleti (`SHOPIER`, `BANK_TRANSFER`) | payments | — | — | READY |
| PAY-003 | Order-Payment kontratının payments tarafı (alan listesi) | payments | COM-003 | — | **DONE** (contract alignment, `PASS`) |
| PAY-004 | Havale/EFT uçtan uca akış tasarımı (Ödeme Bekliyor → admin manuel onay → payments kaydı → commerce durum güncelleme) | payments | PAY-001, COM-004 | — | READY |
| PAY-005 | Havale/EFT akışının implementasyonu | payments | PAY-004, COM-008 | — (D006/D007 zaten kesin) | READY |
| PAY-006 | `.env.example` için placeholder ödeme sağlayıcı anahtar adları | payments | — | — | READY |
| PAY-007 | Idempotency yer tutucusunun (checkout submit, ödeme onayı) mimariye işlenmesi | payments | COM-006 | — | READY |
| PAY-008 | Shopier gerçek hesapla teknik entegrasyon yöntemi araştırması | payments | — | OPEN #9, D009/D010 — Shopier yöntemi | BLOCKED_BY_DECISION |
| PAY-009 | Shopier entegrasyon kodu (API/webhook/checkout) | payments | PAY-008 | OPEN #9, D009/D010 | BLOCKED_BY_DECISION |
| PAY-010 | Webhook/callback imza doğrulaması (yalnızca yöntem doğrulanırsa) | payments | PAY-008 | OPEN #9 + security recommendation (koşullu) | BLOCKED_BY_DECISION |

## QA — qa

| ID | Task | Primary Owner | Dependencies | Decision Gate | Status |
|---|---|---|---|---|---|
| QA-001 | 14 kabul kriterinin modül/test-seviyesi eşleştirme tablosu | qa | — | — | **DONE** (planlama raporunda üretildi) |
| QA-002 | Test klasör yapısı planı (unit/integration/e2e ayrımı) | qa | — | — | READY |
| QA-003 | Framework seçim önerisinin (Vitest + Playwright) dokümante edilmesi | qa | — | — | READY |
| QA-004 | `webapp-testing` skill'i ile CI E2E suite ayrımının dokümante edilmesi | qa | — | — | **DONE** (`docs/DEVELOPMENT_PLAN.md` Faz 8 notuna işlendi) |
| QA-005 | KK9 (statik sayfa erişilebilirlik) ve KK13 (secret taraması) için first-wave smoke-test/CI-check planı | qa | FE-001, SEC-001 | — | READY |
| QA-006 | Checkout çift gönderim (KK14) idempotency test senaryosunun tasarlanması | qa | COM-006, PAY-007 | — | READY |
| QA-007 | Stok yarış koşulu test senaryosunun somutlaştırılması | qa | COM-011 | OPEN #8/D016 — Stok politikası | BLOCKED_BY_DECISION |
| QA-008 | Shopier eşleştirme (KK7) test senaryosu | qa | PAY-008 | OPEN #9, D009/D010 | BLOCKED_BY_DECISION |
| QA-009 | Sipariş sorgulama doğrulama alanı test senaryosu | qa | FE-006 | OPEN #12/D015 | BLOCKED_BY_DECISION |

## SEC — security

| ID | Task | Primary Owner | Dependencies | Decision Gate | Status |
|---|---|---|---|---|---|
| SEC-001 | `.gitignore` eklenmesi (`.env*`, `node_modules`, `.next`) | security (öneri) | — | — | READY |
| SEC-002 | `.env.example` disiplini denetimi (yalnızca placeholder anahtar adı) | security | — | — | READY |
| SEC-003 | Admin route/API için merkezi guard/middleware ilkesinin route iskeletine yansıtılması | security (ilke) + commerce/storefront (uygulama) | FE-001, COM-008 | — | READY |
| SEC-004 | Trust boundary analizinin (Admin/Order Lookup/Payment/Secret/PII) mimari dokümana işlenmesi | security | — | — | **DONE** (`docs/ARCHITECTURE.md` §5.1-5.5, beş ayrı alt bölüm olarak) |
| SEC-005 | Admin brute-force/lockout mekanizmasının somut parametrelerle kararlaştırılması | security | SEC-003 | Risk R4 — resmi karar değil, yalnızca ASSUMED | BLOCKED_BY_DECISION |
| SEC-006 | Sipariş sorgulamada rate limiting/opak sipariş no/jenerik hata mesajı uygulaması | security | FE-006 | OPEN #12 + recommendation onayı gerekir | BLOCKED_BY_DECISION |
| SEC-007 | Webhook imza doğrulama implementasyonu | security + payments | PAY-010 | OPEN #9, D009/D010 (koşullu) | BLOCKED_BY_DECISION |
| SEC-008 | CSP/HSTS/HTTPS launch checklist | security | — | Canlı öncesi (Deployment fazı) | READY |

---

## Özet

- **DONE:** 6 görev — bu planlama sürecinde (raporlar + contract alignment) zaten üretildi.
- **READY:** OPEN bir karara bağlı olmayan, hemen planlanabilecek görevlerin büyük çoğunluğu.
- **BLOCKED_BY_DECISION:** 18 görev (UI-006, FE-006/008/009/010, COM-009/010/011/012, PAY-008/009/010, QA-007/008/009, SEC-005/006/007) — sırasıyla OPEN #1/#2 (marka), #3 (kategori), #4 (varyant), #5-7 (kargo), #8/D016 (stok politikası), #9/D009-D010 (Shopier yöntemi), #12/D015 (sipariş sorgulama), #13 (hukuki metin), Risk R4 (admin güvenlik) ve hediye paketi etkisine bağlı.

Hiçbir `BLOCKED_BY_DECISION` görevi bu belge içinde kendi başına kesinleştirilmemiştir; her biri ilgili karar `docs/DECISIONS.md`'ye taşındığında `READY`'e döner.
