# İlk Dalga — Takı E-Ticaret Sitesi

> Bu belge, `docs/TASK_BREAKDOWN.md`'deki görevlerden yalnızca **şu anda, hiçbir OPEN karara bağlı olmadan güvenle başlanabilecek** olanları listeler. Kapsam `docs/BRIEF_READINESS.md`'nin "İlk Geliştirme Dalgasında Güvenle Başlanabilecek İşler" bölümüyle ve `docs/AGENT_TEAM.md`'nin "First Development Wave" listesiyle uyumludur. Bu dalgada hiçbir uygulama kodu yazılmaz, hiçbir dependency kurulmaz, Next.js projesi oluşturulmaz, Prisma şeması yazılmaz — yalnızca iskelet/tooling kurulumu ve planlama çıktıları içindir.

**Dahil edilmeyenler (bu dalgada kesinlikle yapılmaz):** gerçek Shopier entegrasyonu, Shopier API/webhook kodu, final stok rezervasyon politikası, final kategori listesi, final varyant yapısı, final kargo mantığı, final marka tasarımı, gerçek ürün katalog girişi, final sipariş sorgulama doğrulaması.

---

| ID | Owner | Task | Expected Output | Dependencies | Done When |
|---|---|---|---|---|---|
| FW-01 | Foundation (Team Lead) | Next.js + TypeScript proje iskeleti tooling kararı | Proje yapılandırma planı (paket seçimi, sürüm stratejisi) — henüz `npx create-next-app` çalıştırılmadı | — | Tooling seçimleri ve klasör konvansiyonu belgelenmiş |
| FW-02 | Foundation (Team Lead) | Tailwind CSS + shadcn/ui entegrasyon planı | Tailwind config yaklaşımı ve shadcn/ui component seçim stratejisi (UI-003 ile uyumlu) | UI-003 | Config yaklaşımı ve ilk component listesi netleşmiş |
| FW-03 | Foundation (commerce) | PostgreSQL + Prisma tooling kararı (bağlantı stratejisi, migration yaklaşımı) | Tooling/ortam planı — henüz gerçek `.prisma` dosyası yok | — | Bağlantı/migration stratejisi belgelenmiş |
| FW-04 | SEC-001 (security) | `.gitignore` içeriği | `.env`, `.env*.local`, `node_modules`, `.next`, build çıktıları için kural taslağı | — | Kural listesi onaylanmış, repo kurulurken uygulanacak |
| FW-05 | PAY-006 (payments) | `.env.example` placeholder anahtar adları planı | Ödeme sağlayıcı + DB + oturum secret'ları için yalnızca isim listesi (gerçek değer yok) | FW-04 | İsim listesi eksiksiz ve hiçbir gerçek değer içermiyor |
| FW-06 | Foundation (Team Lead) | Temel klasör mimarisi | App Router route grupları + domain katmanları (storefront/commerce/payments) için yer tutucu klasör planı | FW-01 | Klasör planı tüm agent'larca kabul edilmiş |
| FW-07 | UI-001, UI-002 (brand-ui) | Nötr design token sistemi | Renk/tipografi/spacing token isimlendirmesi + nötr placeholder değerler | — | Token sözleşmesi storefront ile paylaşılmış |
| FW-08 | UI-003 (brand-ui) | Shared component foundation | Kavramsal component envanteri ↔ shadcn/ui eşleştirmesi | FW-07, FW-02 | Component listesi ve karşılıkları belgelenmiş |
| FW-09 | FE-001, FE-002 (storefront) | Route shell'leri | 14 müşteri sayfası için placeholder route iskeleti planı (Server Component varsayılan) | FW-07 | Route ağacı ve component yerleşimi belgelenmiş |
| FW-10 | Admin (commerce + storefront) | Admin shell planı | Admin login + dashboard iskeleti planı (tek admin rolü, D005) | SEC-003 (ilke) | Admin route yapısı ve merkezi guard ilkesi belgelenmiş |
| FW-11 | COM-001 (commerce) | Commerce domain taslağı | Product/Category/Collection/Variant/Stock/Cart/Order kavramsal ilişki haritası (taslak, `.prisma` değil) | `jewelry-commerce` skill | Varlık haritası "taslak, OPEN #3/#4/#8 netleşince revize edilecek" notuyla belgelenmiş |
| FW-12 | COM-002 | Storefront ↔ Commerce taslak kontratı | Alan-seviyeli veri kontratı | — | **Tamamlandı** — contract alignment sürecinde mutabık kalındı |
| FW-13 | PAY-001, PAY-002 (payments) | Provider-agnostic `PaymentProvider` taslağı | Soyut arayüz (başlatma/durum sorgulama/sonuç bildirimi) + `PaymentMethod` enum (`SHOPIER`, `BANK_TRANSFER`) | — | Arayüz sorumlulukları ve enum değerleri belgelenmiş, hiçbir Shopier'e özgü alan yok |
| FW-14 | COM-003, PAY-003 | Order ↔ Payment minimum kontratı | Commerce→Payments ve Payments→Commerce alan listeleri, ortak kimlikler | FW-11, FW-13 | **Tamamlandı** — `CONTRACT_ALIGNMENT: PASS` |
| FW-15 | COM-006, PAY-007 (+ FE-004 kapsamında storefront'un key üretim sorumluluğu) | Idempotency mimari noktaları | `orderIdempotencyKey`'in üretim (storefront)/saklama (commerce)/dedupe (payments) noktalarının mimariye işlenmesi (D017) | FW-14 | `docs/ARCHITECTURE.md` §6'da belgelenmiş |
| FW-16 | QA-002, QA-003 (qa) | Test stratejisi iskeleti | Test klasör yapısı planı + framework önerisi (Vitest/Playwright, kavramsal) | — | Plan belgelenmiş, henüz hiçbir paket kurulmadı |
| FW-17 | SEC-003, SEC-004 (security) | Security architecture notes | Admin/Order Lookup/Payment/Secret/PII trust boundary analizinin mimari dokümana işlenmesi | — | **Tamamlandı** — `docs/ARCHITECTURE.md` §5.1-5.5 (beş ayrı alt bölüm) |
| FW-18 | UI-005 (brand-ui) | Asset/license manifest template | `licensed-media-scout` skill'indeki asset manifest şablonunun kullanılacağı görsel ihtiyaç listesi | — | İhtiyaç listesi + şablon referansı belgelenmiş, henüz hiçbir görsel aranmadı |

---

## Zaten Tamamlanmış Olanlar (bu dalganın bir parçası, kod değil)

Aşağıdaki üç görev, bu planlama sürecinde (multi-agent planlama turu + contract alignment) fiilen tamamlandı ve First Wave kapsamının bir parçasıdır:

- **FW-12 / Storefront ↔ Commerce taslak kontratı** — mutabık.
- **FW-14 / Order ↔ Payment minimum kontratı** — `CONTRACT_ALIGNMENT: PASS`.
- **FW-17 / Security architecture notes** — `docs/ARCHITECTURE.md`'ye işlendi.

Bu üçü de yalnızca **sözleşme/analiz çıktısıdır** — hiçbir kod, dosya veya şema üretilmedi.

## First Wave Sonrası Bloke Kalanlar

Bu dalgada ele alınmayan, ilgili OPEN karar netleşmeden başlanamayacak işler `docs/TASK_BREAKDOWN.md`'de `BLOCKED_BY_DECISION` olarak işaretlidir (nihai kategori/varyant/stok politikası/Shopier yöntemi/kargo mantığı/marka tasarımı/gerçek katalog girişi/sipariş sorgulama doğrulaması). Bu belge onları bilinçli olarak dışarıda bırakır.
