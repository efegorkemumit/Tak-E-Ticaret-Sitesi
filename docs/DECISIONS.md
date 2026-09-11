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
