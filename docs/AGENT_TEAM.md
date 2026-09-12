# Agent Team — Takı E-Ticaret Sitesi

> Bu belge, ilk multi-agent team kurulumunun ve altı teammate'in analiz raporlarının Team Lead tarafından yapılan sentezidir. Yeni bir proje kararı **üretmez**.
>
> Üç kaynak türü kesin olarak ayrılır ve bu belge boyunca karıştırılmaz:
> - **`docs/DECISIONS.md`** — proje sahibi tarafından resmi olarak onaylanmış **kesin** kararlar (D001-D017). Bu belgede hiçbiri değiştirilmez.
> - **`docs/OPEN_QUESTIONS.md`** — henüz karara bağlanmamış, cevabı proje sahibinden veya teknik araştırmadan beklenen konular. Bu belgede hiçbiri kapatılmaz.
> - **Teammate/security önerileri** — bir agent'ın (özellikle security, qa) analiz sırasında ürettiği **recommendation**'lardır; otomatik olarak proje kararı **değildir**. Bunlar "Recommendations" bölümünde ayrı tutulur ve ilgili modülden önce Lead/proje sahibi tarafından değerlendirilip DECISIONS.md'ye taşınıp taşınmayacağına karar verilmelidir.
>
> Özellikle: Shopier webhook/callback imza doğrulaması yalnızca böyle bir entegrasyon yöntemi gerçek Shopier hesabıyla **doğrulanırsa** zorunlu hale gelir (bkz. D009/D010) — şu an bir gereksinim değil, koşullu bir uyarıdır. Rate limiting, opak sipariş numarası, CSRF stratejisi, PII retention politikası ve Core Web Vitals hedefi gibi maddeler de aynı şekilde **recommendation/open item**'dır, kesin karar değildir.

---

# Team Lead

Ana Claude Code oturumu **TEAM LEAD** rolündedir. Sorumlulukları:

- Planlama
- Görev dağıtımı
- Teammate koordinasyonu
- Ownership çakışmalarını çözme
- OPEN kararları koruma (hiçbirini kendi başına kesinleştirmeme)
- Final entegrasyon (teammate raporlarını birleştirip tutarlı bir sonuca dönüştürme)

---

# Team Members

| Teammate | Agent Type | Primary Responsibility | Must Not Do | Must Escalate |
|---|---|---|---|---|
| **brand-ui** | ui-designer | Marka kimliğini brief'e göre yorumlamak; design system, tipografi, spacing, component state ve responsive davranışları tanımlamak; ana sayfa/koleksiyon/kategori/ürün detay/sepet/checkout için arayüz önerileri; erişilebilirlik. | DECISIONS.md kararlarını değiştirmek; OPEN bir kararı kendi başına kapatmak; AI ile görsel üretmeyi önermek; ürün kartı/detayında stok görseli önermek; MVP kapsamına özellik eklemek; iş mantığı/ödeme entegrasyonunu değiştirmek. | Tasarımı engelleyen OPEN kararlar (marka adı #1, logo/kimlik #2, kesin kategori #3); storefront/commerce/payments ile token, state veya UI kontrat bağımlılıkları. |
| **storefront** | frontend-developer | Next.js + TypeScript müşteri arayüzünü geliştirmek; Tailwind/shadcn-ui ile tutarlı component sistemi; 14 müşteri ekranının uygulanması; responsive ve erişilebilir UI; commerce'in sağladığı veri/kontratı tüketmek. | Commerce iş kurallarını kendi başına değiştirmek; stok/sipariş/ödeme politikasında OPEN karar uydurmak; Shopier entegrasyonunu yazmak; MVP kapsamını büyütmek; görsel politikasına (D012/D013) aykırı davranmak; secret/credential'ı client bundle'a koymak. | Belirsiz gereksinimler; commerce/payments kararına bağlı UI alanları (varyant seçici, checkout toplamı, ödeme adımı UI tipi, sipariş sorgulama doğrulama alanı). |
| **commerce** | backend-developer | Product/Category/Collection/Variant domain modeli; SKU/fiyat/stok yönetimi; sepet ve sipariş yaşam döngüsü; admin panelinin commerce veri/iş kuralları; veri tutarlılığı, transaction ve concurrency. | Stok düşme/rezervasyon politikası OPEN iken kendi kararını uygulamak; payment provider implementasyonu yazmak; guest checkout (D004) veya tek admin rolü (D005) kararlarını değiştirmek; MVP dışı özellik eklemek; DECISIONS.md'yi değiştirmek. | Stok politikası (#8/D016); kesin kategori/varyant yapısı (#3/#4); başka modülü etkileyen şema/kontrat değişiklikleri (özellikle payments ve storefront ile). |
| **payments** | payment-integration | Sağlayıcıdan bağımsız Payment Provider mimarisi (D008); Shopier entegrasyonunu yalnızca doğrulanmış bilgiyle uygulamak; Havale/EFT manuel onay akışı; ödeme-sipariş-stok ilişkisi; idempotency; secret/credential güvenliği. | Doğrulanmamış Shopier API/webhook/checkout özelliği varsaymak (D010); araştırma yapılmadan entegrasyon yöntemi seçmek; commerce domain modelini tek başına yeniden tasarlamak; kart verisi saklayan bir tasarım önermek; MVP'ye yeni ödeme yöntemi eklemek; OPEN kararı kesinleştirmek. | Shopier teknik entegrasyon yöntemi araştırması (#9/D009-D010); commerce ile stok/ödeme event sözleşmesi; storefront ile ödeme UI akış tipi (redirect/embedded). |
| **qa** | test-automator | Acceptance criteria'yı test edilebilir senaryolara dönüştürmek; unit/integration/E2E sınırlarını belirlemek; keşif→varyant→sepet→checkout→sipariş akışını, havale/Shopier hata-tekrar senaryolarını, stok/idempotency edge-case'lerini ve admin akışlarını test etmek; mobil/responsive doğrulama. | Test geçirmek için iş kuralını değiştirmek; OPEN kararı kendi başına kapatmak; yeni özellik eklemek. | Test edilemez/eksik kabul kriterleri (ör. KK7); OPEN karara bağlı olduğu için kesinleşemeyen test senaryoları (stok yarış koşulu, Shopier eşleştirme, sipariş sorgulama doğrulama alanı). |
| **security** | security-auditor | Authentication/authorization, admin paneli erişimi, sipariş sorgulamada IDOR/kişisel veri sızıntısı, XSS/injection/CSRF/input validation, secret/API key yönetimi, ödeme callback/webhook doğrulaması (varlığı doğrulandıysa), idempotency/replay riskleri, hassas loglama/veri minimizasyonu incelemesi. | İş kuralını sessizce değiştirmek; OPEN bir kararı kesinleştirmek; yeni özellik önermek (yalnızca mevcut kapsam içi risk ve düzeltme önerisi vermek). | Critical/High bulgular (webhook sahteciliği ihtimali, admin brute-force koruması eksikliği, order lookup IDOR riski); OPEN karara bağlı güvenlik gereksinimlerini (doğrulama alanı, Shopier yöntemi) kendi başına nihai karara dönüştürmeme. |

---

# Cross-Agent Dependencies

- **brand-ui ↔ storefront**: Tasarım token isimlendirmesi (renk/tipografi/spacing) ile storefront'un component sisteminin aynı yapıyı kullanacak şekilde senkronize kurulması gerekiyor.
- **brand-ui ↔ commerce/payments**: Checkout submit butonunun disabled+loading state'i (idempotency'nin UI katkısı, D017) tasarım ve implementasyon tarafında ortak uygulanmalı.
- **brand-ui ↔ payments**: Ödeme yöntemi seçim ekranı generic (radio/card) tasarlanmalı; Shopier'e özgü buton/checkout görünümü hiçbir şekilde varsayılmamalı (D009/D010).
- **storefront ↔ commerce**: Storefront'un mock veriyle doğru ilerleyebilmesi için erken bir API/tip kontrat taslağı (ürün/kategori/sepet/checkout response shape) gerekiyor.
- **storefront ↔ payments**: Ödeme UI akış tipinin (redirect mi, embedded mi) erken bir sinyali gerekiyor; aksi halde checkout iskeleti iki farklı senaryoya göre yeniden yazılabilir.
- **commerce ↔ payments**: Order-Payment kontratı (idempotencyKey/providerReference alanları) ve stok düşme anının (D016) ödeme akışını doğrudan etkilemesi nedeniyle "stok event'i" sözleşmesi (ne zaman tetiklenir, hangi veriyi taşır) üzerinde ortaklaşılmalı.
- **commerce ↔ storefront**: Checkout veri kontratı (teslimat/iletişim bilgisi, hediye paketi, kargo ücreti) ve varyant seçim UI'ının esnek öznitelik modeliyle eşleşmesi netleştirilmeli.
- **qa ↔ commerce**: Stok yarış koşulu ve tükenmiş varyant test kriterleri, stok politikası (D016) netleşmeden kesin hale gelemez.
- **qa ↔ payments**: KK7 (Shopier eşleştirme) ve tekrarlanan bildirim edge-case testi, Shopier entegrasyon yöntemi netleşmeden somutlaşamaz; payments yöntemi netleştirdiğinde qa'ya bildirmeli.
- **qa ↔ brand-ui/storefront**: Sipariş sorgulama doğrulama alanı hem UI hem test tarafını birlikte etkiliyor; 375px responsive kapsamı (hangi sayfa/komponentler hazır) paylaşılmalı.
- **security ↔ payments**: Webhook imza doğrulaması ve idempotency key mekanizması — Shopier yöntemi netleştiğinde payments tasarımına "koşullu ama pazarlıksız" bir gereksinim olarak taşınmalı (yalnızca webhook/callback yöntemi doğrulanırsa geçerli).
- **security ↔ commerce**: DB seviyesinde concurrency kontrolü (transaction/row lock) ve idempotent unique constraint, D016/D017'nin teknik uzantısı olarak commerce tasarımına girmeli.
- **security ↔ storefront/commerce**: Sipariş sorgulama modülü tasarlanırken rate limiting, jenerik hata mesajı ve opak sipariş numarası önerileri (hangi doğrulama alanı seçilirse seçilsin) değerlendirilmeli — bunlar recommendation'dır, bkz. "Recommendations".

---

# Shared Rules

- DECISIONS.md kararlarını değiştirme.
- OPEN kararları kendin kesinleştirme.
- MVP kapsamını büyütme.
- Bilinmeyen müşteri bilgisini uydurma.
- Başka agent'ın ownership alanını izinsiz değiştirme.
- Gizli bilgileri repository'ye koyma.
- Shopier'in doğrulanmamış teknik özelliklerini varsayma.

---

# First Development Wave

Aşağıdaki liste, Team Lead sentezindeki FIRST DEVELOPMENT WAVE bölümüne dayanır; hiçbiri OPEN bir kararı gerektirmez.

1. Next.js + TypeScript + Tailwind CSS + shadcn/ui + PostgreSQL + Prisma repo iskeleti; `.env.example` (yalnızca placeholder anahtar adları, gerçek secret yok).
2. Nötr/placeholder tasarım sistemi + component envanteri (brand-ui) — marka kimliği geldiğinde token değerleri değişecek şekilde açıkça işaretlenmiş.
3. 14 müşteri sayfası + admin login/dashboard route iskeleti, placeholder içerikle (storefront).
4. Esnek/**taslak** Prisma şema taslağı (commerce) — kategori/varyant/stok kararları netleşince revize edileceği kod içinde not olarak düşülmüş.
5. `PaymentProvider` soyut arayüzü + kapalı `PaymentMethod` listesi iskeleti (payments) — Shopier'e özgü hiçbir kod/entegrasyon yazılmadan.
6. Idempotency prensibinin checkout submit ve ödeme onayı noktalarında mimari yer tutucu olarak işaretlenmesi.
7. Lisans/kaynak kayıt şablonu (brand-ui, stok görsel takibi için).
8. QA'nın çıkardığı test edilebilir senaryoların (E2E + edge-case) plan/iskelet olarak kayda geçirilmesi — henüz otomasyon kodu değil.
9. Security'nin ilk dalga için uygun gördüğü genel güvenlik hijyeni notlarının (bkz. Recommendations) mimari dokümantasyona eklenmesi — implementasyon değil, not.

## Bu Dalgada YAPILMAYACAKLAR

- Shopier entegrasyon kodu yazma.
- Nihai stok politikasını uygulama.
- Nihai kategori/varyant yapısını seçme.
- Nihai kargo mantığını (ücret/ücretsiz sınır hesaplaması) uygulama.
- OPEN güvenlik önerilerini (rate limiting, opak sipariş no, CSRF stratejisi vb.) kesin karar gibi implement etme — bunlar önce Recommendations'tan DECISIONS.md'ye taşınmalı.

---

# Deferred Decisions

`docs/OPEN_QUESTIONS.md`'deki maddelerin modül bazlı kısa özeti:

- **Tasarım öncesi**: Marka adı (#1), logo/kurumsal kimlik (#2), kesin ürün kategorileri (#3).
- **Ürün/varyant modülü öncesi**: Kesin varyant yapısı (#4), ürün görsel tedarik kaynağı (#11).
- **Commerce/stok modülü öncesi**: Stok düşme/rezervasyon politikası (#8, D016, Risk R1).
- **Checkout modülü öncesi**: Kargo firması (#5), kargo ücreti (#6), ücretsiz kargo sınırı (#7).
- **Ödeme modülü öncesi**: Shopier teknik entegrasyon yöntemi (#9, D009/D010).
- **Sipariş sorgulama modülü öncesi**: Ek doğrulama alanının kesin şekli — e-posta/telefon (#12, D015).
- **MVP sonrası olabilir**: Sipariş bildirim kanalı — e-posta/WhatsApp (#10).
- **Canlıya çıkmadan önce**: İade/değişim kuralları (#13), fatura süreci (#14), gizlilik/mesafeli satış sayfalarının kesin hukuki metinleri.
- **Sonraki sürüm**: Shopier sonrası alternatif ödeme sağlayıcısı (#15).

---

# Recommendations

Bu bölümdeki maddeler **teammate önerileridir, proje kararı değildir**. Her biri ilgili modülden önce Lead/proje sahibi tarafından değerlendirilmeli; onaylanırsa `docs/DECISIONS.md`'ye yeni bir D-madde olarak taşınmalı, aksi halde `docs/OPEN_QUESTIONS.md`'de izlenmeye devam etmelidir.

**security'den (koşullu — ilgili entegrasyon yöntemi doğrulanırsa geçerli):**
- Shopier webhook/callback kullanılacaksa imza/secret doğrulaması yapılmadan hiçbir "ödeme başarılı" bildiriminin güvenilir sayılmaması. *(Yalnızca Shopier'in webhook/callback desteği gerçek hesapla doğrulanırsa uygulanabilir bir gereksinim; D009/D010'a göre şu an bu yöntem doğrulanmamıştır.)*

**security'den (genel, henüz karar değil):**
- Sipariş sorgulamada rate limiting / deneme sınırlandırma.
- Sipariş sorgulamada "sipariş bulunamadı" ile "doğrulama hatalı" için ortak/jenerik hata mesajı.
- Sipariş numarasının tahmin edilemeyecek şekilde (opak/rastgele) üretilmesi.
- Admin girişi için somut güvenlik kontrolleri: parola politikası, brute-force/lockout, oturum süresi/invalidation, güvenli cookie ayarları (Risk R4, şu an yalnızca ASSUMED).
- Idempotency'nin somut DB mekanizması (unique constraint, idempotency key kaynağı — sepet hash'i, client token veya provider transaction ID).
- Stok rezervasyonunda DB seviyesinde concurrency kontrolü (transaction/row lock).
- Admin panelinden girilen zengin metin/açıklama alanlarının sanitize edilmeden render edilmemesi (stored XSS önlemi).
- CSRF koruma stratejisi (admin ve checkout formları için).
- Kişisel veri (PII) loglama/saklama/retention teknik politikası.
- Hassas verilerin (e-posta, adres, telefon, ödeme durumu) loglara redaksiyonsuz yazılmaması.
- Production secrets yönetimi (rotasyon, erişim kontrolü), genel API rate limiting, HTTPS ve güvenlik başlıkları (CSP/HSTS) — launch checklist önerisi.

**qa'dan (henüz karar değil):**
- Performans/Core Web Vitals hedefinin somut bir eşik değeriyle tanımlanması — şu an `docs/OPEN_QUESTIONS.md`'de bile ayrı izlenmiyor, bu bir belge boşluğu olarak not edilmiştir.

**commerce'den (henüz karar değil):**
- SKU/fiyat/stok alanlarının ürün seviyesinde mi yoksa yalnızca varyant seviyesinde mi tutulacağının netleştirilmesi.
- Category ile Collection arasındaki ilişkinin (bir ürün birden fazla koleksiyona girebilir mi vb.) tanımlanması.
