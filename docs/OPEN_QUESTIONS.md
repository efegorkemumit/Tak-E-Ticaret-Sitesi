# Açık Sorular — Takı E-Ticaret Sitesi

Bu belge, `docs/RAW_CLIENT_NOTES.md` ve `docs/PROJECT_BRIEF.md` içinde **OPEN** olarak işaretlenmiş konuların, cevaplanma önceliğine göre gruplandırılmış hâlidir. Her soru için önemi, cevap gelmezse kullanılabilecek geçici varsayım ve etkilediği modül belirtilmiştir.

Proje sahibi tarafından resmî olarak karara bağlanmış konular bu listeden çıkarılır ve `docs/DECISIONS.md` içine taşınır. Bir sorunun *ilkesi* karara bağlanmış ama *uygulama detayı* hâlâ açıksa (ör. "ek doğrulama yapılacak" kesinleşti ama "e-posta mı telefon mu" açık), soru burada dar kapsamla kalmaya devam eder.

Toplam 14 ana soru, 4 öncelik grubuna ayrılmıştır.

> **Revizyon notu (2. güncelleme):** Proje sahibi, panelin tek bir temel admin rolüyle çalışacağına kesin karar verdiğinden eski "#11 — Yönetim panelini kaç kişi/hangi roller kullanacak?" sorusu çözülmüş sayılarak listeden çıkarılmış ve `docs/DECISIONS.md` D005'e taşınmıştır. Sipariş sorgulamanın ek doğrulama isteyeceği (D015) ve stok politikasının ilgili modülden önce kesinleştirileceği (D016) artık kesin karar olduğundan, ilgili sorular yalnızca *uygulama detayını* soracak şekilde yeniden yazılmıştır.
>
> **Revizyon notu (3. güncelleme — VIDEO 06):** Proje sahibi, commerce şeması implementasyonundan önce 6 blocker kararı verdi (`docs/DECISIONS.md` D018-D023). Bunlardan stok düşme/rezervasyon politikası (eski #8) tamamen karara bağlandığı için listeden çıkarılmıştır. Varyant yapısı sorusu (#4), yapısal/mimari kısmı (SKU/fiyat/stok'un Variant seviyesinde tutulması, seçilebilir/açıklayıcı öznitelik ayrımı) karara bağlandığından yalnızca katalog içerik detayını (hangi öznitelik hangi kategoride zorunlu) soracak şekilde daraltılmıştır.

---

## A) Geliştirme Başlamadan Önce Cevaplanması Gerekenler

Bu sorular, genel tasarım sistemini ve temel veri modelini doğrudan etkilediği için MVP geliştirmesine başlamadan önce netleşmelidir.

### 1. Marka adı nedir?
- **Neden önemli?** Site başlığı, domain, e-posta şablonları, tasarım sistemi ve tüm içerik metinleri marka adına bağlıdır.
- **Geçici varsayım:** `[MARKA_ADI]` placeholder'ı ile geliştirmeye devam edilebilir; gerçek isim geldiğinde metin/içerik güncellemesi yapılır.
- **Etkilenen modül:** Genel marka kimliği, tasarım sistemi, içerik.

### 2. Logo ve kurumsal kimlik (renkler, tipografi vb.) nedir?
- **Neden önemli?** Görsel tasarım sistemi (renk paleti, tipografi, buton stilleri) bu kimliğe göre kurulur; sonradan değişmesi kapsamlı yeniden tasarım gerektirebilir.
- **Geçici varsayım:** Nötr, sade bir placeholder tasarım sistemiyle (geçici renk paleti ve tipografi) ilerlenebilir; kurumsal kimlik geldiğinde temalar güncellenir.
- **Etkilenen modül:** Genel tasarım sistemi, tüm müşteri arayüzü.

### 3. Kesin ürün kategorileri nelerdir?
- **Neden önemli?** Site navigasyonu, kategori sayfaları ve ürün veri modelindeki kategori alanı bu bilgiye bağlıdır.
- **Geçici varsayım:** Genel takı sektöründe yaygın örnek kategorilerle (ör. kolye, yüzük, bileklik, küpe) esnek/genişletilebilir bir kategori yapısı kurulur; gerçek kategoriler geldiğinde güncellenir.
- **Etkilenen modül:** Ürün veri modeli, navigasyon, kategori sayfaları.

### 4. Ürün varyantlarının kesin yapısı nasıl olacak (hangi öznitelikler zorunlu/opsiyonel)?
> **Not (VIDEO 06 güncellemesi):** Bu sorunun yapısal/mimari kısmı artık kesinleşti — SKU/fiyat/stok'un her zaman Variant seviyesinde tutulacağı (D019) ve seçilebilir öznitelik (tek değer) ile açıklayıcı/spec öznitelik (birden fazla değer olabilir) ayrımı (D020) karara bağlandı. Açık kalan yalnızca **hangi belirli özniteliklerin (materyal/kaplama/renk/taş türü/ölçü/zincir uzunluğu) hangi kategoride zorunlu/opsiyonel olacağı ve gerçek katalogda hangilerinin fiilen kullanılacağıdır** — bu bir şema/mimari kararı değil, katalog içerik kararıdır ve schema implementasyonunu bloke etmez (şema zaten D019/D020 ile esnek/genel biçimde çalışacak şekilde tasarlanabilir).
- **Neden önemli?** Ürün ekleme ekranındaki form doğrulaması ve gerçek katalog girişi için nihayetinde gerekecek, ama şema tasarımını artık beklemiyor.
- **Geçici varsayım:** Tüm öznitelikler her kategoride opsiyonel kalır; gerçek katalog görülünce kategori bazlı zorunluluk kuralları (varsa) eklenir.
- **Etkilenen modül:** Ürün ekleme ekranı (form doğrulama), gerçek katalog veri girişi. (Veri modelinin kendisi artık D019/D020 ile netleşmiştir.)

---

## B) İlgili Modül Geliştirilmeden Önce Cevaplanması Gerekenler

Bu sorular projenin tamamını değil, belirli bir modülü etkiler; ilgili modülün geliştirmesine başlanmadan önce netleşmesi yeterlidir.

### 5. Kargo firması hangisi/hangileri olacak?
- **Neden önemli?** Kargo takip kodu formatı ve olası ileri entegrasyon ihtiyaçları (MVP'de manuel giriş yeterli olsa da) kargo firmasına göre değişebilir.
- **Geçici varsayım:** Kargo takip kodu, herhangi bir firmaya özgü format doğrulaması yapılmayan serbest metin alanı olarak tasarlanır.
- **Etkilenen modül:** Sipariş/kargo modülü, admin sipariş detayı.

### 6. Kargo ücreti ne kadar olacak?
- **Neden önemli?** Checkout akışında sipariş toplamının doğru hesaplanabilmesi için gereklidir.
- **Geçici varsayım:** Panelden yönetilebilen, tek bir sabit kargo ücreti alanıyla (başlangıç değeri `[KARGO_UCRETI_PLACEHOLDER]`) ilerlenir.
- **Etkilenen modül:** Sepet/checkout modülü, admin ayarlar.

### 7. Ücretsiz kargo sınırı ne kadar olacak?
- **Neden önemli?** Checkout ekranında müşteriye doğru toplam ve ücretsiz kargo bilgisinin gösterilebilmesi için gereklidir.
- **Geçici varsayım:** Panelden yönetilebilen, başlangıçta `[UCRETSIZ_KARGO_SINIRI_PLACEHOLDER]` olarak ayarlanan bir eşik değeriyle ilerlenir (0 = devre dışı da olabilir).
- **Etkilenen modül:** Sepet/checkout modülü, admin ayarlar.

### 9. Shopier hesabının kullanılabilir entegrasyon imkânları nelerdir?
> **Not:** Bu araştırmanın ödeme modülüne gelindiğinde yapılacağı ve o ana kadar hiçbir Shopier API/webhook özelliğinin varsayılmayacağı artık kesin karardır (`docs/DECISIONS.md` D009, D010).
- **Neden önemli?** Ödeme modülünün teknik kapsamı (ör. yönlendirme tabanlı ödeme linki mi, API entegrasyonu mu, webhook desteği var mı) bu araştırmaya bağlıdır; bu bilgi olmadan Shopier entegrasyon yöntemi kesinleştirilemez.
- **Geçici varsayım:** Bu konuda araştırma tamamlanana kadar **hiçbir Shopier API veya checkout özelliği var sayılmaz**; ödeme sağlayıcı katmanı soyutlanmış şekilde tasarlanarak Shopier entegrasyonu ayrı bir teknik araştırma/planlama adımı olarak ele alınır.
- **Etkilenen modül:** Ödeme modülü (Shopier entegrasyonu).

### 10. Sipariş bildirimleri e-posta ile mi, WhatsApp ile mi, ikisiyle mi gönderilecek?
- **Neden önemli?** Bildirim altyapısının hangi servisle (e-posta sağlayıcısı ve/veya WhatsApp Business API) kurulacağını belirler.
- **Geçici varsayım:** MVP'de otomatik müşteri bildirimi kurulmaz; sipariş durumu yalnızca sipariş sorgulama sayfasından görüntülenebilir hâlde tutulur, bildirim kanalı netleştiğinde eklenir.
- **Etkilenen modül:** Bildirim modülü (MVP sonrası olabilir).

### 11. Ürün görsellerini kim sağlayacak (müşteri mi, profesyonel çekim mi, tedarikçi mi)?
- **Neden önemli?** Görsel tedarik süreci, ürün kataloğunun ne zaman doldurulabileceğini ve görsel kalite/lisans kontrol sürecini doğrudan etkiler.
- **Geçici varsayım:** Görseller müşteri tarafından sağlanacak şekilde varsayılır; panel, görsel yükleme ve yönetme özelliğiyle bu sürece hazır tutulur.
- **Etkilenen modül:** Ürün görsel yönetimi modülü (admin + müşteri tarafı galeri).

### 12. Sipariş sorgulamada sipariş numarasına ek olarak hangi doğrulama bilgisi (e-posta mı, telefon mu) istenecek?
> **Not:** Ek bir doğrulama isteneceği artık kesin karardır (`docs/DECISIONS.md` D015). Açık olan yalnızca hangi alanın kullanılacağıdır.
- **Neden önemli?** Sorgulama yalnızca sipariş numarasıyla çalışırsa, numarayı tahmin eden/deneyen üçüncü bir kişi başka bir müşterinin adını, adresini ve sipariş içeriğini görebilir; bu bir kişisel veri sızıntısı riskidir.
- **Geçici varsayım:** Sorgulama formu sipariş numarasına ek olarak müşterinin sipariş sırasında girdiği e-posta adresini de ister; yalnızca ikisi birlikte doğrulanırsa sipariş detayı gösterilir.
- **Etkilenen modül:** Sipariş sorgulama modülü (müşteri tarafı).

---

## C) Canlıya Çıkmadan Önce Cevaplanması Gerekenler

Bu sorular geliştirmeyi bloklamaz (placeholder içerikle geliştirme sürdürülebilir) ancak siteye gerçek müşteri trafiği açılmadan önce mutlaka netleşmelidir.

### 13. İade ve değişim kuralları nelerdir?
- **Neden önemli?** "İade ve Değişim" sayfasının gerçek içeriği ve olası bir iade sürecinin admin panelinde nasıl yönetileceği bu kurallara bağlıdır.
- **Geçici varsayım:** Sayfa, genel/placeholder bir metinle (`[IADE_DEGISIM_KOSULLARI_PLACEHOLDER]`) yayınlanır; gerçek kurallar netleşince güncellenir. Panelde sipariş durumu listesine "İade Edildi" seçeneği eklenir, ayrıca bir iade süreci akışı MVP'de kurulmaz.
- **Etkilenen modül:** Statik içerik sayfaları (iade/değişim), sipariş durumu listesi.

### 14. Fatura süreci nasıl işleyecek?
- **Neden önemli?** Faturanın e-fatura/e-arşiv ile mi, manuel muhasebe süreciyle mi, yoksa sistem dışı bir yöntemle mi düzenleneceği, sistemin fatura üretmesi gerekip gerekmediğini belirler.
- **Geçici varsayım:** MVP'de sistem fatura üretmez; fatura süreci sistem dışında (müşterinin mevcut muhasebe süreciyle) yürütüldüğü varsayılır.
- **Etkilenen modül:** Sipariş/muhasebe süreci (MVP'de sistem dışı).

---

## D) Daha Sonraki Sürümlere Bırakılabilecekler

### 15. Shopier ileride kaldırıldığında yerine hangi ödeme sağlayıcısı gelecek?
- **Neden önemli?** Ödeme sağlayıcı katmanının soyutlama seviyesini ve gelecekteki geçiş planını etkiler; ancak MVP'de Shopier hâlâ kullanılacağı için acil değildir.
- **Geçici varsayım:** MVP'de yalnızca ödeme sağlayıcısının kolayca değiştirilebilmesini sağlayacak genel bir soyutlama ilkesiyle ilerlenir; somut ikinci sağlayıcı seçimi yapılmaz.
- **Etkilenen modül:** Ödeme mimarisi (uzun vadeli, MVP sonrası).

---

## Özet Tablo

| # | Öncelik | Soru | Etkilenen Modül |
|---|---|---|---|
| 1 | Geliştirme öncesi | Marka adı | Genel kimlik |
| 2 | Geliştirme öncesi | Logo/kurumsal kimlik | Tasarım sistemi |
| 3 | Geliştirme öncesi | Ürün kategorileri | Ürün veri modeli |
| 4 | Geliştirme öncesi | Varyant yapısı (yalnızca katalog içerik detayı — hangi öznitelik hangi kategoride zorunlu) | Ürün ekleme ekranı, katalog girişi |
| 5 | Modül öncesi | Kargo firması | Sipariş/kargo |
| 6 | Modül öncesi | Kargo ücreti | Sepet/checkout |
| 7 | Modül öncesi | Ücretsiz kargo sınırı | Sepet/checkout |
| 9 | Modül öncesi | Shopier entegrasyon yöntemi | Ödeme modülü |
| 10 | Modül öncesi | Bildirim kanalı | Bildirim modülü |
| 11 | Modül öncesi | Görsel tedarik kaynağı | Ürün görsel yönetimi |
| 12 | Modül öncesi | Sipariş sorgulama doğrulama alanı | Sipariş sorgulama |
| 13 | Canlı öncesi | İade/değişim kuralları | Statik içerik, sipariş durumu |
| 14 | Canlı öncesi | Fatura süreci | Sipariş/muhasebe |
| 15 | Sonraki sürüm | Shopier sonrası sağlayıcı | Ödeme mimarisi |

---

## Karara Bağlanmış (Bu Listeden Çıkarılan) Konular

| Eski soru | Karar | Kayıt |
|---|---|---|
| Yönetim panelini kaç kişi/hangi roller kullanacak? | İlk sürümde tek temel admin rolü. | `docs/DECISIONS.md` D005 |
| Stok düşme/rezervasyon politikası kesin olarak ne olacak? (eski #8) | Sipariş anında erken rezervasyon; havale siparişinde 24 saat (admin ayarlanabilir) bekleme, süre dolunca otomatik iptal + stok serbest bırakma; Shopier'e özgü tasarlanmaz. | `docs/DECISIONS.md` D018 |
| Varyant yapısının şema/mimari kısmı (SKU/fiyat/stok hangi seviyede, öznitelik çoklu/tekil değer alabilir mi?) | SKU/fiyat/stok yalnızca Variant seviyesinde (her Product ≥1 Variant); seçilebilir öznitelik tekil değer, açıklayıcı/spec öznitelik çoklu değer olabilir. | `docs/DECISIONS.md` D019, D020 |
| Stok tükenince ürün/varyant görünürlüğü ne olacak? | Product'ta stoktan bağımsız DRAFT/PUBLISHED/ARCHIVED durumu; PUBLISHED+stoksuz ürün "Tükendi" ile görünür kalır, otomatik gizlenmez. | `docs/DECISIONS.md` D021 |
| Guest sepeti server-side mi tutulacak? | MVP'de yalnızca client-side (localStorage/cookie); server Cart tablosu yok, ama fiyat/stok/tutar checkout'ta sunucuda yeniden doğrulanır. | `docs/DECISIONS.md` D022 |
| Product-Category/Collection ilişkisi çoktan-çoğa mı? | Category tekil FK, Collection çoktan-çoğa. | `docs/DECISIONS.md` D023 |
