# Karar Kaydı — Takı E-Ticaret Sitesi

Bu belge, proje sahibi tarafından onaylanmış **kesin MVP kararlarının** resmi kaydıdır. `docs/PROJECT_BRIEF.md` ve `docs/OPEN_QUESTIONS.md` içindeki ilgili maddeler bu belgeyle tutarlı olacak şekilde güncellenmiştir.

Bir karar burada yer aldığında, aynı konudaki OPEN madde `docs/OPEN_QUESTIONS.md`'den kaldırılır veya kapsamı bu karara göre daraltılır (yalnızca kararın *uygulama detayı* açık kalıyorsa madde OPEN listesinde kalmaya devam eder — ör. "ek doğrulama gerekecek" kararlaştı ama "e-posta mı telefon mu" hâlâ açık).

**Durum** alanı bu aşamada yalnızca **Kesinleşti** değerini alır; ileride bir karar değişirse yeni bir karar kaydı (ör. D018) açılır ve eskisi "Değişti → bkz. D0XX" olarak işaretlenir, geçmiş silinmez.

---

### D001 — Hedef pazar
- **Karar:** İlk hedef pazar Türkiye'dir.
- **Durum:** Kesinleşti
- **Neden:** Proje sahibi tarafından doğrudan onaylandı; marka ve müşteri kitlesi Türkiye odaklıdır.
- **Etkilenen modüller:** Genel ürün/checkout akışı, kargo, hukuki sayfalar (KVKK, mesafeli satış).
- **Yeniden değerlendirme koşulu:** İşletme uluslararası satışa geçmeye karar verirse (MVP dışı, ileri sürüm konusu).

### D002 — Site dili
- **Karar:** Sitenin ilk dili Türkçedir.
- **Durum:** Kesinleşti
- **Neden:** Proje sahibi tarafından doğrudan onaylandı; hedef kitle Türkçe konuşmaktadır.
- **Etkilenen modüller:** Tüm müşteri arayüzü metinleri, admin panel metinleri, içerik yönetimi.
- **Yeniden değerlendirme koşulu:** Çoklu dil / uluslararası genişleme kararı alınırsa.

### D003 — Para birimi
- **Karar:** Para birimi Türk lirasıdır (TRY).
- **Durum:** Kesinleşti
- **Neden:** Proje sahibi tarafından doğrudan onaylandı.
- **Etkilenen modüller:** Ürün fiyatlandırma, sepet/checkout, ödeme modülü, admin fiyat yönetimi.
- **Yeniden değerlendirme koşulu:** Çoklu para birimi ihtiyacı doğarsa (MVP dışı, ileri sürüm konusu).

### D004 — Üyelik yok, guest checkout
- **Karar:** Müşteri üyeliği olmayacak; sipariş süreci yalnızca misafir (guest) checkout ile yürütülecek.
- **Durum:** Kesinleşti
- **Neden:** Proje sahibi tarafından doğrudan onaylandı; MVP kapsamını dar tutma hedefiyle uyumludur.
- **Etkilenen modüller:** Checkout akışı, sipariş veri modeli (kullanıcı hesabına değil sipariş kaydına bağlı), sipariş sorgulama.
- **Yeniden değerlendirme koşulu:** Tekrar eden müşteri oranı veya talep, üyelik ihtiyacını haklı çıkaracak şekilde artarsa (MVP sonrası).

### D005 — Tek temel admin rolü
- **Karar:** İlk sürümde yönetim panelinde tek bir temel admin rolü olacak; rol/yetki ayrımı (çoklu rol) yapılmayacak.
- **Durum:** Kesinleşti
- **Neden:** Proje sahibi tarafından doğrudan onaylandı.
- **Etkilenen modüller:** Admin kimlik doğrulama ve yetkilendirme modülü, admin kullanıcı yönetimi (yok).
- **Yeniden değerlendirme koşulu:** Panele erişecek kişi sayısı artar ve farklı yetki seviyelerine (ör. sadece sipariş görüntüleme) ihtiyaç doğarsa.

### D006 — Ödeme yöntemleri
- **Karar:** İlk sürümde iki ödeme yöntemi desteklenecek: Shopier ve Havale/EFT.
- **Durum:** Kesinleşti
- **Neden:** Proje sahibi tarafından doğrudan onaylandı.
- **Etkilenen modüller:** Checkout akışı, ödeme modülü, admin sipariş yönetimi.
- **Yeniden değerlendirme koşulu:** Yeni bir ödeme yöntemi eklenmesine veya mevcutlardan birinin kaldırılmasına karar verilirse (bkz. D008).

### D007 — Havale ödemesinin manuel onayı
- **Karar:** Havale/EFT ile verilen siparişlerde ödeme, admin tarafından panel üzerinden manuel olarak onaylanacak; otomatik banka entegrasyonu yapılmayacak.
- **Durum:** Kesinleşti
- **Neden:** Proje sahibi tarafından doğrudan onaylandı.
- **Etkilenen modüller:** Sipariş/stok modülü, admin sipariş detayı, sipariş durumu akışı.
- **Yeniden değerlendirme koşulu:** Sipariş hacmi, manuel onayı sürdürülemez kılacak kadar artarsa (otomatik banka entegrasyonu ihtiyacı doğar).

### D008 — Ödeme sağlayıcısından bağımsız mimari
- **Karar:** Ödeme sistemi hiçbir sağlayıcıya (Shopier dâhil) sıkı biçimde bağlanmayacak; sağlayıcı değişebilecek şekilde soyutlanmış bir mimariyle tasarlanacak.
- **Durum:** Kesinleşti
- **Neden:** Proje sahibi tarafından doğrudan onaylandı; Shopier'e kalıcı bağımlılık istenmiyor.
- **Etkilenen modüller:** Ödeme modülü mimarisi, sipariş modeli, admin ödeme onay/eşleştirme ekranları.
- **Yeniden değerlendirme koşulu:** Bu, kalıcı bir mimari ilkedir; pratik olarak yeniden değerlendirilmesi beklenmez.

### D009 — Shopier entegrasyon yönteminin araştırma zamanı
- **Karar:** Shopier'in teknik entegrasyon yöntemi, ödeme modülüne gelindiğinde, o anki güncel teknik imkânlar ve gerçek Shopier hesabı üzerinden araştırılacak.
- **Durum:** Kesinleşti (süreç kararı — teknik yöntem hâlâ OPEN)
- **Neden:** Proje sahibi tarafından doğrudan onaylandı; erken varsayım yapmanın yeniden iş riski taşıdığı değerlendirildi.
- **Etkilenen modüller:** Ödeme modülü (Shopier entegrasyonu).
- **Yeniden değerlendirme koşulu:** Ödeme modülü geliştirmesine başlanıp araştırma tamamlandığında bu karar somut bir teknik karara dönüşür (bkz. `docs/OPEN_QUESTIONS.md` #9).

### D010 — Doğrulanmamış Shopier özellikleri varsayılmayacak
- **Karar:** Shopier hakkında doğrulanmamış hiçbir API veya webhook özelliği plan, tasarım veya belgede varmış gibi kabul edilmeyecek.
- **Durum:** Kesinleşti
- **Neden:** Proje sahibi tarafından doğrudan onaylandı; yanlış teknik varsayımların geliştirmeyi yanlış yöne sürüklemesini önlemek için.
- **Etkilenen modüller:** Ödeme modülü, tüm planlama belgeleri.
- **Yeniden değerlendirme koşulu:** Gerçek Shopier hesabıyla teknik doğrulama tamamlandığında (bkz. D009).

### D011 — AI ile görsel üretimi yasak
- **Karar:** Projede hiçbir ürün veya editorial görseli yapay zeka ile üretilmeyecek.
- **Durum:** Kesinleşti
- **Neden:** Proje sahibi tarafından doğrudan onaylandı.
- **Etkilenen modüller:** Ürün görsel yönetimi, editorial/hero içerik yönetimi.
- **Yeniden değerlendirme koşulu:** Proje sahibi bu politikayı açıkça değiştirmedikçe geçerlidir; MVP kapsamında yeniden değerlendirilmesi beklenmez.

### D012 — Ürün kartlarında gerçek ürün görseli
- **Karar:** Ürün kartlarında ve ürün detay sayfalarında yalnızca satılan gerçek ürüne ait görseller kullanılacak.
- **Durum:** Kesinleşti
- **Neden:** Proje sahibi tarafından doğrudan onaylandı; müşteri güveni ve doğru bilgilendirme için.
- **Etkilenen modüller:** Ürün görsel yönetimi (admin), ürün listeleme/detay sayfaları.
- **Yeniden değerlendirme koşulu:** Bu bir kalite/güven ilkesidir; yeniden değerlendirilmesi beklenmez. Görsel tedarik sürecinin kim tarafından yürütüleceği ayrı bir açık sorudur (bkz. `docs/OPEN_QUESTIONS.md` #11).

### D013 — Lisanslı stok görsellerin kullanım alanı
- **Karar:** Lisanslı hazır stok görseller yalnızca hero (ana görsel) alanları, koleksiyon kapakları, editorial içerikler ve marka hikâyesi alanlarında kullanılabilecek; ürün kartı/detayında kullanılmayacak.
- **Durum:** Kesinleşti
- **Neden:** Proje sahibi tarafından doğrudan onaylandı; D012 ile tutarlı, gerçek ürün görseli/stok görsel karışıklığını önler.
- **Etkilenen modüller:** Görsel yönetim politikası, ana sayfa/koleksiyon/marka hikâyesi içerik modülleri.
- **Yeniden değerlendirme koşulu:** Kurumsal kimlik veya pazarlama stratejisi değişirse.

### D014 — MVP dışı bırakılan özellikler
- **Karar:** Müşteri üyeliği, favoriler, ürün yorumları, sadakat sistemi, gelişmiş kupon sistemi, mobil uygulama, uluslararası satış ve çoklu para birimi MVP kapsamı dışında bırakılacak.
- **Durum:** Kesinleşti
- **Neden:** Proje sahibi tarafından doğrudan onaylandı; MVP kapsamını dar ve uygulanabilir tutma hedefiyle uyumlu.
- **Etkilenen modüller:** Genel kapsam sınırı — tüm modüller bu listedeki özellikleri içermeyecek şekilde tasarlanır.
- **Yeniden değerlendirme koşulu:** MVP sonrası, v2 planlaması sırasında madde madde yeniden değerlendirilebilir.

### D015 — Sipariş sorgulamada ek doğrulama zorunluluğu
- **Karar:** Sipariş sorgulama sistemi yalnızca (tahmin edilebilir) sipariş numarasına güvenmeyecek; sipariş numarasına ek bir doğrulama yöntemi kullanılacak. Bu yöntemin kesin şekli (e-posta mı, telefon mu, başka bir alan mı), sipariş sorgulama modülü geliştirilmeden önce belirlenecek.
- **Durum:** Kesinleşti (ilke) — uygulama yöntemi OPEN
- **Neden:** Proje sahibi tarafından doğrudan onaylandı; sipariş numarası tahmini/denemesi yoluyla başka bir müşterinin kişisel verilerinin (ad, adres, sipariş içeriği) görülmesini önlemek için (bkz. Risk R3).
- **Etkilenen modüller:** Sipariş sorgulama modülü (müşteri tarafı).
- **Yeniden değerlendirme koşulu:** Sipariş sorgulama modülü geliştirmesine başlanmadan hemen önce kesin yöntem belirlendiğinde bu karar somutlaşır (bkz. `docs/OPEN_QUESTIONS.md` #12).

### D016 — Stok düşme/rezervasyon politikasının zamanlaması
- **Karar:** Stok düşme ve rezervasyon politikası (stoğun ne zaman düşüleceği/rezerve edileceği, havale siparişlerinde ne kadar süre bekletileceği), ilgili commerce (sipariş/stok) modülü geliştirilmeden önce kesinleştirilecek.
- **Durum:** Kesinleşti (ilke) — politika detayı OPEN
- **Neden:** Proje sahibi tarafından doğrudan onaylandı; erken ve temelsiz bir varsayımın stok tutarsızlığına (fazla satış) yol açma riski nedeniyle (bkz. Risk R1).
- **Etkilenen modüller:** Sipariş/stok yönetimi modülü.
- **Yeniden değerlendirme koşulu:** Sipariş/stok modülü geliştirmesine başlanmadan hemen önce kesin politika belirlendiğinde bu karar somutlaşır (bkz. `docs/OPEN_QUESTIONS.md` #8).

### D017 — Idempotent sipariş ve ödeme akışları
- **Karar:** Tüm sipariş oluşturma ve ödeme işleme akışları, tekrar eden işlemlere (çift tıklama, sayfa yenileme, tekrarlanan Shopier bildirimi vb.) karşı idempotent (tekrarsız) tasarlanacak; aynı işlem birden fazla kez tetiklense bile yalnızca bir sipariş/bir stok düşümü oluşacak.
- **Durum:** Kesinleşti
- **Neden:** Proje sahibi tarafından doğrudan onaylandı; çift sipariş/çift stok düşümü riskini önlemek için (bkz. Risk R2).
- **Etkilenen modüller:** Checkout/sipariş oluşturma akışı, ödeme modülü (Shopier ve Havale), sipariş/stok modülü.
- **Yeniden değerlendirme koşulu:** Kalıcı bir mühendislik ilkesidir; yeniden değerlendirilmesi beklenmez.

### D018 — Stok düşme/rezervasyon politikasının kesin içeriği
- **Karar:** Stok, sipariş oluşturulduğu anda (ödeme onaylanmadan) rezerve edilir. Havale/EFT siparişlerinde varsayılan rezervasyon/bekleme süresi 24 saattir; bu süre ileride admin/site ayarlarından değiştirilebilir şekilde tasarlanır. Süre dolduğunda ödeme hâlâ onaylanmamışsa sipariş "bekleme süresi doldu/iptal" durumuna geçer ve rezerve stok otomatik olarak serbest bırakılır. Bu mekanizma Shopier'e özgü tasarlanmaz, sağlayıcıdan bağımsız çalışır.
- **Durum:** Kesinleşti
- **Neden:** Proje sahibi tarafından doğrudan onaylandı; Risk R1'i (eşzamanlı Shopier+Havale siparişinde fazla satış) azaltmak ve süresiz rezervasyon birikimini önlemek için erken/konservatif rezervasyon + otomatik zaman aşımı dengesi tercih edildi. Bu, D016'da taahhüt edilen "ilgili modülden önce kesinleştirilecek" politikanın somut hâlidir.
- **Etkilenen modüller:** Sipariş/stok yönetimi modülü, Order durum makinesi, admin ayarlar (bekleme süresi).
- **Yeniden değerlendirme koşulu:** Bekleme süresi değeri (24 saat) işletme ihtiyacına göre panelden değiştirilebilir; mekanizmanın kendisi kalıcı bir mimari karardır.

### D019 — SKU/fiyat/stok'un yalnızca Variant seviyesinde tutulması
- **Karar:** Her Product en az bir Variant'a sahip olmak zorundadır (varyantsız görünen ürünler tek bir default Variant ile temsil edilir). SKU, fiyat ve stok yalnızca Variant seviyesinde tutulur; Product seviyesinde bu alanların bir kopyası tutulmaz.
- **Durum:** Kesinleşti
- **Neden:** Proje sahibi tarafından doğrudan onaylandı; tek tutarlı kural admin formunu ve sepet/sipariş mantığını basitleştirir, veri çiftlenmesini önler. Bu, `docs/ARCHITECTURE.md` §7'de "henüz DECISIONS.md'ye taşınmamış mühendislik önerisi" olarak işaretli maddenin resmi karara dönüşmüş hâlidir.
- **Etkilenen modüller:** Commerce veri modeli (Product/Variant şeması), admin ürün formu, storefront veri kontratı.
- **Yeniden değerlendirme koşulu:** Kalıcı bir mimari karardır; pratikte yeniden değerlendirilmesi beklenmez.

### D020 — Varyant seçim özniteliği ile ürün açıklama özniteliği ayrımı
- **Karar:** Bir varyantta, seçilebilir (selectable) her öznitelik tipi (ör. ölçü, renk, taş seçeneği) yalnızca tek bir değer alabilir — varyant seçimi her zaman tekil bir kombinasyondur. Ancak bir ürün fiziksel olarak birden fazla değeri aynı anda taşıyabilir (ör. "Zirkon + İnci"); bu tür bilgiler bir varyant seçim özniteliği olmak zorunda değildir, Product'ın açıklayıcı/spesifikasyon bilgisinde (descriptive/spec attribute) birden fazla değer olarak tutulabilir.
- **Durum:** Kesinleşti
- **Neden:** Proje sahibi tarafından doğrudan onaylandı; sektör pratiğiyle (`jewelry-commerce` skill) ve müşteri arayüzündeki tek-seçim varyant seçici davranışıyla tutarlıdır, aynı zamanda birden fazla malzeme/taş içeren fiziksel ürünlerin bilgisini kaybetmeden modellemeyi mümkün kılar.
- **Etkilenen modüller:** Variant-Attribute şeması, Product açıklama/spesifikasyon alanları, storefront'un AttributeButtonGroup/ProductInfoAccordion component'leri.
- **Yeniden değerlendirme koşulu:** Kalıcı bir mimari karardır.

### D021 — Ürün görünürlüğü (yayın durumu) stoktan bağımsızdır
- **Karar:** Product üzerinde stoktan bağımsız, admin tarafından kontrol edilen bir yayın durumu alanı bulunur (DRAFT / PUBLISHED / ARCHIVED veya eşdeğer sade bir yapı). PUBLISHED + stok > 0 → ürün görünür ve satın alınabilir. PUBLISHED + tüm varyantların stoku 0 → ürün görünür kalır, "Tükendi" gösterilir ve satın alınamaz. DRAFT/yayında değil → müşteri storefront'unda hiç görünmez. Stok sıfıra düştüğü için ürün otomatik gizlenmez.
- **Durum:** Kesinleşti
- **Neden:** Proje sahibi tarafından doğrudan onaylandı; görünürlük ve stok durumunun birbirinden bağımsız yönetilmesi, SEO ve geri dönen müşteri beklentisi açısından en yaygın/basit yaklaşımdır.
- **Etkilenen modüller:** Product şeması (yeni durum alanı), storefront listeleme/detay sayfaları, admin ürün formu.
- **Yeniden değerlendirme koşulu:** Kalıcı bir mimari karardır.

### D022 — Guest sepetin client-side tutulması, sunucu tarafı yeniden doğrulama
- **Karar:** MVP'de guest sepeti yalnızca client-side (localStorage/cookie tabanlı) tutulur; bu aşamada kalıcı bir server-side Cart/CartItem tablosu oluşturulmaz. Buna karşılık, client'tan gelen fiyat, stok, availability ve toplam tutar bilgisi asla güvenilir kaynak kabul edilmez; checkout/Order oluşturulurken sunucu, variant ID/güncel fiyat/stok/adet/availability bilgisini veritabanından yeniden doğrular ve toplamları kendisi hesaplar. Sepet sayfa yenilemesinden sonra korunur.
- **Durum:** Kesinleşti
- **Neden:** Proje sahibi tarafından doğrudan onaylandı; MVP'de sepetin çoklu cihaz senkronizasyonuna ihtiyaç yoktur, client-side yaklaşım hem şemayı hem terkedilmiş sepet temizleme ihtiyacını ortadan kaldırır. Sunucu-taraflı yeniden doğrulama kuralı, client verisinin güvenilmez kabul edilmesi ilkesiyle tutarlıdır.
- **Etkilenen modüller:** Storefront sepet implementasyonu, checkout/Order oluşturma akışı (sunucu-taraflı fiyat/stok doğrulama).
- **Yeniden değerlendirme koşulu:** Çoklu cihaz sepet senkronizasyonu veya "terkedilmiş sepet" pazarlama ihtiyacı doğarsa (MVP sonrası) server-side Cart tablosu yeniden değerlendirilebilir.

### D023 — Category tekil, Collection çoktan-çoğa ilişkisi
- **Karar:** Bir Product tek bir ana Category'ye aittir (tekil ilişki). Bir Product, birden fazla Collection içinde yer alabilir (çoktan-çoğa ilişki). Category ana ürün sınıflandırmasını, Collection ise merchandising/vitrin gruplamasını temsil eder.
- **Durum:** Kesinleşti
- **Neden:** Proje sahibi tarafından doğrudan onaylandı; `jewelry-commerce` skill'indeki sektör pratiğiyle uyumludur ve navigasyonu basitleştirir, koleksiyonun kategoriler arası kesişebilen pazarlama amaçlı doğasını korur.
- **Etkilenen modüller:** Category/Collection şeması (join table yalnızca Collection için), storefront navigasyon ve filtreleme.
- **Yeniden değerlendirme koşulu:** Kalıcı bir mimari karardır.

### D024 — Ürün görsellerinin object storage'da saklanması
- **Karar:** Gerçek ürün fotoğrafları sunucunun yerel dosya sisteminde veya veritabanında binary olarak değil, bir object storage servisinde (S3 / Cloudflare R2 / Vercel Blob vb.) saklanacak. `ProductImage.url` bu servisteki nesneye işaret eder. Admin panelinden yapılan normal ürün fotoğrafı yüklemelerinde `isPlaceholder` değeri `false` olarak yazılır.
- **Durum:** Kesinleşti (somut servis sağlayıcısı seçimi OPEN)
- **Neden:** Proje sahibi tarafından doğrudan onaylandı. Next.js'in yaygın dağıtım hedeflerinin çoğunda dosya sistemi geçicidir; çalışma anında `public/uploads` benzeri bir klasöre yazılan fotoğraflar yeniden deploy'da veya çoklu instance'ta kaybolur — bu, gerçek bir veri kaybı riskidir. Veritabanında binary saklamak ise yedek boyutunu ve sorgu maliyetini gereksiz büyütür.
- **Etkilenen modüller:** Admin ürün görsel yükleme akışı, ProductImage veri modeli, storefront görsel sunumu, ortam değişkeni/secret yönetimi (storage kimlik bilgileri repoya girmez, bkz. `docs/PROJECT_BRIEF.md` Bölüm 16).
- **Yeniden değerlendirme koşulu:** Saklama *yöntemi* kalıcı bir karardır; hangi somut servisin kullanılacağı (R2/S3/Blob) hosting kararıyla birlikte netleşecektir. Bu karar `docs/OPEN_QUESTIONS.md` #11'i (görselleri kim sağlayacak) kapatmaz — tedarik kaynağı ayrı bir sorudur.

### D025 — Admin kimlik doğrulama: kendi oturum sistemi + veritabanında AdminUser
- **Karar:** Admin girişi üçüncü taraf bir kimlik servisine (Clerk/Auth0 vb.) bağlanmayacak; parola hash'i ve oturumu proje kendi içinde yönetecek. Admin hesabı ortam değişkeninde sabit tutulmayacak, veritabanında bir `AdminUser` kaydı olarak saklanacak. Bu sayede işletme sahibi parolasını geliştirici müdahalesi ve yeniden deploy olmadan değiştirebilir.
- **Durum:** Kesinleşti
- **Neden:** Proje sahibi tarafından doğrudan onaylandı; tek admin rolü (D005) için harici bir kimlik sağlayıcısının maliyeti ve dışarıda kimlik saklama riski gerekçesiz, ortam değişkeni yaklaşımı ise parola değişimini kalıcı olarak geliştiriciye bağımlı kılardı.
- **Etkilenen modüller:** Admin kimlik doğrulama modülü, Prisma şeması (yeni `AdminUser` modeli), admin route guard/middleware (bkz. `docs/ARCHITECTURE.md` §5.1), ortam değişkeni yönetimi (oturum imza secret'ı).
- **Yeniden değerlendirme koşulu:** D005 değişir ve panele birden fazla kişi farklı yetkilerle erişmesi gerekirse, `AdminUser` modeli rol alanıyla genişletilir — saklama yerinin kendisi (veritabanı) değişmez.

### D026 — Video 07 admin kapsamı: sipariş durumu ve kargo takibi dahil, ödeme onayı hariç
> **Güncelleme (VIDEO 09):** Bu kararın "ödeme onayı hariç" sınırı artık geçerli değildir — bkz. **D033**. Karar kaydı geçmiş olarak korunur.
- **Karar:** Admin panelinin ilk sürümünde sipariş durumu değiştirme (`Order.orderStatus`) ve kargo takip kodu girme yer alacaktır. Ödeme onayı (`Order.paymentStatus`), Shopier entegrasyonu ve Havale/EFT eşleştirme mantığı bu kapsamın dışındadır ve sonraki geliştirme dalgasına bırakılmıştır.
- **Durum:** Kesinleşti
- **Neden:** Proje sahibi tarafından doğrudan onaylandı. `docs/PROJECT_BRIEF.md` Bölüm 11 bu iki yeteneği MVP admin kapsamına dahil ediyordu ve şemada `orderStatus` ile `paymentStatus` zaten kasıtlı olarak birbirinden bağımsız alanlardır (bkz. `docs/ARCHITECTURE.md` §3) — dolayısıyla sipariş/kargo yönetimi, ödeme entegrasyonunu beklemek zorunda değildir. Ödeme tarafının ayrı bırakılması D007/D009/D010 ile tutarlıdır.
- **Etkilenen modüller:** Admin sipariş listesi/detayı, Order veri modeli (kargo takip alanları), sipariş durumu geçiş iş mantığı, stok rezervasyon serbest bırakma (D018 — iptal edilen siparişin aktif rezervasyonları serbest bırakılmalıdır).
- **Yeniden değerlendirme koşulu:** Ödeme onayı akışı geliştirildiğinde `paymentStatus` yönetimi de panele eklenir; bu karar yalnızca sıralamayı belirler, nihai kapsamı daraltmaz.

### D027 — Variant SKU'su otomatik üretilir, admin değiştirebilir
- **Karar:** Yeni bir varyant oluşturulduğunda SKU sistem tarafından otomatik üretilir; admin isterse üretilen değeri düzenleyebilir. SKU benzersizliği veritabanı seviyesinde zorunludur (D019 gereği SKU yalnızca Variant seviyesindedir).
- **Durum:** Kesinleşti
- **Neden:** Proje sahibi tarafından doğrudan onaylandı; otomatik üretim ürün girişini hızlandırır ve boş/çakışan SKU riskini azaltırken, düzenlenebilir olması markanın kendi mevcut ürün kodlama sistemini kullanmasına engel olmaz.
- **Etkilenen modüller:** Admin varyant formu, SKU üretim yardımcı fonksiyonu, Variant şeması (alanın kendisi değişmez).
- **Yeniden değerlendirme koşulu:** Marka kalıcı ve katı bir kodlama standardı benimserse otomatik üretim biçimi bu standarda göre ayarlanabilir.

### D028 — Öznitelik tipleri ve değerleri admin tarafından yönetilebilir
- **Karar:** Admin yalnızca mevcut öznitelik tiplerine yeni değer eklemekle sınırlı olmayacak; yeni `AttributeDefinition` (öznitelik tipi) da oluşturabilecektir. Yani hem tip hem değer yönetimi panelden yapılabilir, geliştirici müdahalesi gerekmez.
- **Durum:** Kesinleşti
- **Neden:** Proje sahibi tarafından doğrudan onaylandı; kesin öznitelik listesi hâlâ açıktır (`docs/OPEN_QUESTIONS.md` #4) ve katalog büyüdükçe yeni tip ihtiyacı çıkması beklenir. Şema bu kararı zaten destekleyecek şekilde tasarlanmıştır — `AttributeDefinition.key` bir Prisma enum'u değil serbest bir String'tir, dolayısıyla yeni tip eklemek migration değil yalnızca yeni bir satırdır.
- **Etkilenen modüller:** Admin öznitelik yönetimi ekranı, admin varyant formu, AttributeDefinition/AttributeValue iş mantığı.
- **Yeniden değerlendirme koşulu:** Kalıcı bir karardır. Kullanımda olan bir öznitelik tipinin silinmesi veritabanı kısıtlarıyla (VariantAttributeValue/ProductAttributeValue üzerindeki restrict davranışı) zaten engellenir; bu koruma kaldırılmaz.

### D029 — Ürün ve varyantlarda kalıcı silme yok, yaşam döngüsü durumla yönetilir
- **Karar:** Admin panelinde ürün veya varyant için kalıcı silme (hard delete) işlemi sunulmayacaktır. Ürün yaşam döngüsü yalnızca D021'deki DRAFT / PUBLISHED / ARCHIVED durumlarıyla yönetilir; satıştan kaldırma işlemi ARCHIVED durumuna geçirmek demektir.
- **Durum:** Kesinleşti
- **Neden:** Proje sahibi tarafından doğrudan onaylandı; sipariş geçmişi `OrderItem` üzerinden varyanta referans verdiği için kalıcı silme geçmiş siparişleri bozma veya kayıt kaybı riski taşır. Veritabanı bu riski kısmen zaten engeller (sipariş geçmişi olan bir varyantın silinmesi kısıtla reddedilir), ancak hiç siparişi olmayan kayıtlar için koruma uygulama katmanında bu kararla sağlanır.
- **Etkilenen modüller:** Admin ürün/varyant yönetimi, storefront görünürlük mantığı (ARCHIVED zaten müşteriye gösterilmez).
- **Yeniden değerlendirme koşulu:** Kalıcı bir veri bütünlüğü kararıdır; yeniden değerlendirilmesi beklenmez.

### D030 — Shopier, checkout içindeki bir ödeme sağlayıcısı değil, ayrı bir satış kanalıdır
- **Karar:** Shopier bizim Cart → Checkout → Order akışımızın içinde bir ödeme yöntemi olarak SUNULMAYACAK. Bunun yerine Shopier, kendi başına duran ayrı bir kartlı satış kanalıdır: PUBLISHED ürünlerimizin Shopier'de birer karşılığı oluşturulur, ürün detay sayfasında "Shopier'den Satın Al" bağlantısı müşteriyi o ürünün Shopier satış sayfasına götürür ve sipariş orada, Shopier'in kendi akışında tamamlanır. Bizim checkout'umuz yalnızca Havale/EFT'ye hizmet eder. Shopier üzerinden verilen bir sipariş bizim `Order` tablomuza YAZILMAZ; iki kanal bilinçli olarak ayrı tutulur.
- **Durum:** Kesinleşti
- **Neden:** Proje sahibi tarafından doğrudan onaylandı. D009'un öngördüğü teknik araştırma gerçek Shopier hesabı üzerinde yapıldığında, Shopier'in bize sunduğu doğrulanmış yeteneğin "ürün oluştur + public satış linki al" olduğu görüldü; bizim checkout'umuza gömülebilecek doğrulanmış bir ödeme/webhook entegrasyonu VARSAYILMADI (D010). İki kanalı zorla tek bir `Order` tablosunda birleştirmek, doğrulanmamış bir eşleştirme mekanizması uydurmayı gerektirirdi.
- **Etkilenen modüller:** Checkout şeması (`paymentMethod` artık yalnızca BANK_TRANSFER kabul eder), storefront ürün detayı (CTA), `Product` şeması (`shopierProductId`/`shopierUrl`), admin ürün düzenleme, ödeme modülü.
- **Not (geriye uyumluluk):** Prisma `PaymentMethod` enum'undaki `SHOPIER` değeri KALDIRILMAZ — geçmiş `Order` kayıtları ve migration geçmişi bozulmaz. Yalnızca yeni checkout artık bu değerle sipariş oluşturmaz.
- **Yeniden değerlendirme koşulu:** Shopier ileride doğrulanabilir bir API/webhook entegrasyonu sunar ve iki kanalın tek sipariş havuzunda birleşmesi işletme açısından gerekli hâle gelirse (D010 gereği yalnızca gerçek doğrulama sonrası).

### D031 — Sipariş sorgulamada ek doğrulama alanı: e-posta
- **Karar:** Public sipariş sorgulama ekranı, sipariş numarasına ek olarak müşterinin sipariş sırasında girdiği e-posta adresini ister; sipariş detayı yalnızca ikisi birlikte doğrulanırsa gösterilir.
- **Durum:** Kesinleşti
- **Neden:** D015 ek bir doğrulama alanının gerekliliğini zaten karara bağlamıştı, açık olan yalnızca hangi alanın kullanılacağıydı (`docs/OPEN_QUESTIONS.md` #12). E-posta, checkout formunda zaten zorunlu bir alandır ve müşterinin elinde her zaman bulunur; telefon numarası biçim varyasyonu (başında 0, +90, boşluklar) nedeniyle eşleştirmesi kırılgandır. Bu soru artık KAPANMIŞTIR.
- **Etkilenen modüller:** `/siparis-sorgula` ekranı, `lib/commerce/order-lookup.ts`.
- **Ek güvenlik kuralı (kararın ayrılmaz parçası):** Yanlış sipariş numarası ile yanlış e-posta AYNI jenerik hatayı döndürür — hangi alanın yanlış olduğu asla sızdırılmaz (account enumeration). Sorgulama sonucu ad/adres/telefon/sipariş kalemi gibi PII TAŞIMAZ; yalnızca sipariş numarası, sipariş durumu, ödeme durumu/yöntemi, tutar ve (havale ise) banka bilgisi gösterilir.
- **Yeniden değerlendirme koşulu:** Kalıcı bir karardır.

### D032 — İşletme ayarları tek satırlık bir `SiteSettings` kaydında tutulur
- **Karar:** Banka adı, hesap sahibi, IBAN, havale açıklama şablonu ve rezervasyon bekleme süresi (saat) veritabanında tek satırlık (singleton) bir `SiteSettings` kaydında tutulur ve `/admin/settings` ekranından yönetilir. Bu değerler koda veya ortam değişkenine GÖMÜLMEZ.
- **Durum:** Kesinleşti
- **Neden:** D018 rezervasyon süresinin "panelden değiştirilebilir" olacağını zaten öngörüyordu; havale akışının gerçek banka bilgisi de aynı gerekçeyle (işletme sahibi geliştirici müdahalesi olmadan değiştirebilmeli — D025'teki aynı ilke) veritabanına ait bir veridir. Tek satır olması, "hangi ayar kaydı geçerli?" sorusunu tamamen ortadan kaldırır ve güncellemeyi doğal olarak idempotent kılar.
- **Etkilenen modüller:** `SiteSettings` şeması, `lib/settings/`, `/admin/settings`, sipariş başarı ekranı, sipariş sorgulama, `createOrder` (rezervasyon penceresi), 24 saat zaman aşımı job'ı.
- **Güvenlik kuralı:** IBAN dâhil tüm ayar mutasyonları sunucu tarafında `requireAdmin()` gerektirir ve client'tan gelen değer güvenilir kabul edilmez; IBAN sunucuda normalize edilip TR IBAN formatı + mod-97 checksum ile doğrulanır. `docs/OPEN_QUESTIONS.md` #6/#7 (kargo ücreti / ücretsiz kargo sınırı) bu kararla KAPANMAZ — bu alanlar bilinçli olarak eklenmedi, kargo ücretlendirmesi hâlâ MVP dışıdır.
- **Yeniden değerlendirme koşulu:** Ayar sayısı bir ekrana sığmayacak kadar artarsa gruplanabilir; saklama biçimi (tek satır) kalıcıdır.

### D033 — Havale ödemesinin onay/red akışı admin panelindedir (D026'nın kapsamı genişletildi)
- **Karar:** Admin, Havale/EFT siparişlerinde `Order.paymentStatus`'ü panelden yönetebilir: "Ödemeyi Onayla" (PENDING → CONFIRMED) ve "Ödemeyi Reddet" (PENDING → FAILED) aksiyonları eklenmiştir. Onay, ilgili ACTIVE rezervasyonları CONSUMED yapar ve `Variant.stockQuantity`'yi satılan adet kadar düşürür; red, rezervasyonları RELEASED yapar, siparişi CANCELLED'a çeker ve fiziksel stoğa DOKUNMAZ. Her iki işlem de tek bir transaction içinde ve idempotenttir.
- **Durum:** Kesinleşti — D026'nın "ödeme onayı hariç" sınırını kaldırır (D026 "Değişti → bkz. D033" olarak okunmalıdır; geçmiş kaydı silinmez).
- **Neden:** D007 havale ödemesinin admin tarafından manuel onaylanacağını zaten kesinleştirmişti; D026 yalnızca bu yeteneğin hangi geliştirme dalgasına düşeceğini belirliyordu, nihai kapsamı daraltmıyordu (D026'nın kendi metni bunu açıkça söylüyor). Bu dalgada sıra buraya geldi.
- **Etkilenen modüller:** `lib/admin/payments.ts`, admin sipariş listesi (havale kuyruğu filtresi), admin sipariş detayı, stok/rezervasyon mantığı.
- **Değişmez (invariant):** `availableQuantity = stockQuantity − Σ(ACTIVE rezervasyon)` formülü gereği ödeme onayı `availableQuantity`'yi DEĞİŞTİRMEZ (stok düşer, aktif rezervasyon da aynı miktarda azalır) — yalnızca rezervasyon gerçek satışa dönüşür. İki adımın aynı transaction'da olması bu değişmezin tek garantisidir.
- **Ek kural (onay sonrası iptal — güvenlik incelemesinde netleştirildi):** Ödemesi `CONFIRMED` olan bir sipariş daha sonra sipariş durumu üzerinden `CANCELLED` yapılırsa **fiziksel stok GERİ EKLENMEZ**: rezervasyonlar zaten `CONSUMED` olduğu için serbest bırakılacak bir şey kalmamıştır ve satış gerçekleşmiş sayılır. Bu bilinçlidir — iade/geri alma (refund) akışı MVP kapsamı dışındadır (D014 ile tutarlı). Gerekirse admin varyant stoğunu elle düzeltir; `rejectOrderPayment`'ın hata mesajı bu sonucu artık açıkça söyler, admin'i stoğun kendiliğinden döneceği sanısına sürüklemez.
- **Ek kural (zaman aşımının sınırı):** 24 saat zaman aşımı job'ı YALNIZCA `orderStatus = PAYMENT_PENDING` siparişleri iptal eder. Admin siparişi `PREPARING`/`SHIPPED`/`DELIVERED`'a taşımışsa, ödeme hâlâ `PENDING` olsa bile otomatik iptal EDİLMEZ — bilinçli bir işletme kararının üzerine otomatik bir job yazamaz. Takas: böyle bir siparişin `ACTIVE` rezervasyonları otomatik serbest kalmaz, admin ödemeyi onaylayana/reddedene ya da siparişi iptal edene kadar stoğu tutmaya devam eder (bkz. `lib/commerce/expire-orders.ts` içindeki gerekçe).
- **Ek kural:** Ödeme onayı `Order.orderStatus`'ü OTOMATİK OLARAK `PREPARING` yapmaz — `paymentStatus` ve `orderStatus` `docs/ARCHITECTURE.md` §3 gereği ayrı kavramlardır ve siparişi hazırlamaya başlamak ayrı bir işletme kararıdır.
- **Yeniden değerlendirme koşulu:** Sipariş hacmi manuel onayı sürdürülemez kılarsa (D007'deki aynı koşul).

### D034 — Muhasebe/e-Fatura bu projede üretilmez, Shopier ekosistemine bırakılır
- **Karar:** Bu proje fatura/e-Fatura üretmez ve hiçbir muhasebe servisine (Luca vb.) entegrasyon yazmaz. Shopier kanalından yapılan satışların muhasebe/e-Fatura tarafı, Shopier'in kendi desteklediği entegrasyonlara bırakılır. Havale siparişlerinin otomatik olarak faturaya gittiği İDDİA EDİLMEZ.
- **Durum:** Kesinleşti
- **Neden:** Proje sahibi tarafından doğrudan onaylandı. Bu, `docs/OPEN_QUESTIONS.md` #14'ün geçici varsayımını ("MVP'de sistem fatura üretmez") kesin karara dönüştürür. Doğrulanmamış bir muhasebe entegrasyonu uydurmak, D010'un Shopier için koyduğu ilkenin aynısını başka bir sağlayıcı için ihlal ederdi.
- **Gözlem (doğrulanmış, VIDEO 09):** Açık Shopier hesabında `Ek Özellikler > Uygulamalar` listesi BOŞTUR — kurulu hiçbir muhasebe/e-Fatura entegrasyonu yoktur. Bu tur içinde yeni/ücretli hiçbir uygulama kurulmamıştır.
- **Etkilenen modüller:** Yok (bilinçli bir kapsam sınırıdır).
- **Yeniden değerlendirme koşulu:** İşletme gerçek bir e-Fatura yükümlülüğü/entegrasyon ihtiyacı bildirirse, ayrı bir karar ve ayrı bir geliştirme turu gerekir.

---

## Özet Tablo

| ID | Karar (kısa) | Durum |
|---|---|---|
| D001 | Hedef pazar: Türkiye | Kesinleşti |
| D002 | Dil: Türkçe | Kesinleşti |
| D003 | Para birimi: TRY | Kesinleşti |
| D004 | Üyelik yok, guest checkout | Kesinleşti |
| D005 | Tek temel admin rolü | Kesinleşti |
| D006 | Ödeme yöntemleri: Shopier + Havale/EFT | Kesinleşti |
| D007 | Havale ödemesi manuel onay | Kesinleşti |
| D008 | Sağlayıcıdan bağımsız ödeme mimarisi | Kesinleşti |
| D009 | Shopier entegrasyon araştırması ödeme modülünde yapılacak | Kesinleşti (süreç) |
| D010 | Doğrulanmamış Shopier özelliği varsayılmayacak | Kesinleşti |
| D011 | AI ile görsel üretimi yasak | Kesinleşti |
| D012 | Ürün kartlarında gerçek ürün görseli | Kesinleşti |
| D013 | Stok görseller yalnızca hero/koleksiyon/editorial/marka hikâyesi | Kesinleşti |
| D014 | MVP dışı özellik listesi | Kesinleşti |
| D015 | Sipariş sorgulamada ek doğrulama zorunlu | Kesinleşti (ilke) |
| D016 | Stok politikası modülden önce kesinleştirilecek | Kesinleşti (ilke) |
| D017 | Idempotent sipariş/ödeme akışları | Kesinleşti |
| D018 | Stok politikası: erken rezervasyon + 24s havale bekleme + oto-iptal | Kesinleşti |
| D019 | SKU/fiyat/stok yalnızca Variant seviyesinde | Kesinleşti |
| D020 | Seçilebilir öznitelik=tekil değer, açıklayıcı öznitelik=çoklu değer olabilir | Kesinleşti |
| D021 | Ürün görünürlüğü (DRAFT/PUBLISHED/ARCHIVED) stoktan bağımsız | Kesinleşti |
| D022 | Guest sepet client-side, sunucu fiyat/stok/tutarı yeniden doğrular | Kesinleşti |
| D023 | Category tekil, Collection çoktan-çoğa ilişki | Kesinleşti |
| D024 | Ürün görselleri object storage'da; normal upload'da isPlaceholder=false | Kesinleşti (servis seçimi OPEN) |
| D025 | Admin auth: kendi oturum sistemi + veritabanında AdminUser | Kesinleşti |
| D026 | Video 07 admin kapsamı: sipariş durumu + kargo takibi dahil, ödeme onayı hariç | Kesinleşti |
| D027 | Variant SKU otomatik üretilir, admin değiştirebilir | Kesinleşti |
| D028 | Öznitelik tipi ve değeri admin tarafından yönetilebilir | Kesinleşti |
| D029 | Hard delete yok; yaşam döngüsü DRAFT/PUBLISHED/ARCHIVED ile | Kesinleşti |
| D030 | Shopier ayrı satış kanalı; checkout yalnızca Havale/EFT | Kesinleşti |
| D031 | Sipariş sorgulama ek doğrulaması: e-posta | Kesinleşti |
| D032 | İşletme ayarları tek satırlık SiteSettings kaydında | Kesinleşti |
| D033 | Havale ödeme onay/red admin panelinde (D026 genişletildi) | Kesinleşti |
| D034 | Muhasebe/e-Fatura yok; Shopier ekosistemine bırakıldı | Kesinleşti |
