# Proje Brief'i — Takı E-Ticaret Sitesi

> Bu belge, `docs/RAW_CLIENT_NOTES.md` dosyasındaki ham müşteri notlarının yapılandırılmış bir yorumudur. Her önemli karar **CONFIRMED**, **ASSUMED** veya **OPEN** etiketiyle işaretlenmiştir:
>
> - **CONFIRMED**: Ham notlarda doğrudan ifade edilmiş, doğrulanmış bilgi.
> - **ASSUMED**: Ham notlarda net olarak yazılmamış ancak geliştirmeye devam edebilmek için makul bir geçici varsayım.
> - **OPEN**: Müşteriden veya teknik araştırmadan cevap beklenen, henüz karar verilmemiş konu.
>
> Marka adı, logo, kurumsal iletişim bilgileri, banka/IBAN bilgileri gibi gerçek veriler henüz netleşmediğinden bu belgede yalnızca placeholder (`[...]`) ifadeler kullanılmıştır.
>
> Proje sahibi tarafından onaylanmış kesin MVP kararlarının resmi kaydı `docs/DECISIONS.md` dosyasındadır. Bu belgedeki ilgili bölümler o kararlarla tutarlı olacak şekilde güncellenmiştir; bir konuda çelişki görülürse `docs/DECISIONS.md` esas alınır.

---

## 1. Proje Özeti

Bu proje, bir akraba tarafından işletilen gerçek bir takı markası için bir e-ticaret web sitesi ve buna bağlı bir yönetim paneli geliştirmeyi kapsar. *(CONFIRMED)*

Sistem bir demo veya prototip olarak değil, gerçek müşteriler tarafından kullanılacak canlı bir satış kanalı olarak tasarlanacaktır. *(CONFIRMED)*

İlk hedef pazar Türkiye'dir; sitenin ilk dili Türkçe ve para birimi Türk lirasıdır (TRY). *(CONFIRMED)*

Marka adı `[MARKA_ADI]`, logo ve kurumsal kimlik unsurları bu belgenin yazıldığı tarihte henüz netleşmemiştir. *(OPEN)*

Planlanan ana teknoloji seti Next.js, TypeScript, Tailwind CSS, shadcn/ui, PostgreSQL ve Prisma'dır; kesin teknik mimari bu brief ve sonraki planlama çalışmaları tamamlandıktan sonra ayrıca belirlenecektir. *(CONFIRMED — teknoloji tercihleri; kesin mimari OPEN)*

---

## 2. Problem Tanımı

Marka şu anda büyük olasılıkla Instagram ve diğer sosyal medya kanalları üzerinden görünürlük kazanmakta, ancak bu trafiği kendi kontrolündeki, profesyonel bir satış altyapısına yönlendirebileceği bir web sitesine sahip değildir. *(ASSUMED — ham notlarda "Instagram, sosyal medya ve doğrudan bağlantılardan gelen kullanıcıları markanın kendi sitesine yönlendirmek" hedefinden çıkarılmıştır; mevcut durumun tam olarak nasıl olduğu notlarda açıklanmamıştır.)*

Marka, ürün/varyant/stok/sipariş yönetimini kendi kontrolünde tutabileceği ve ödeme sağlayıcısı seçiminde esnek kalabileceği bir sisteme ihtiyaç duymaktadır; özellikle tek bir ödeme sağlayıcısına (Shopier) kalıcı olarak bağımlı kalmak istememektedir. *(CONFIRMED)*

---

## 3. İş Hedefleri

- Instagram, sosyal medya ve doğrudan bağlantılardan gelen kullanıcıları markanın kendi sitesine yönlendirmek. *(CONFIRMED)*
- Ürünleri profesyonel koleksiyon ve kategori sayfalarıyla sergilemek. *(CONFIRMED)*
- Shopier ve Havale/EFT yöntemleriyle sipariş alabilmek. *(CONFIRMED)*
- Ürün, varyant, stok ve siparişleri markanın kendi yönetim panelinden yönetebilmek. *(CONFIRMED)*
- Sistemi Shopier'e kalıcı olarak bağımlı hâle getirmemek. *(CONFIRMED)*
- İleride Shopier çıkarıldığında başka bir ödeme sağlayıcısına geçilebilecek bir mimari kurmak. *(CONFIRMED)*

---

## 4. Hedef Kullanıcılar

1. **Son müşteriler (alıcılar)** — Ağırlıklı olarak Instagram ve sosyal medyadan gelen, Türkiye'deki bireysel tüketiciler. Üyelik oluşturmadan misafir olarak sipariş verebilirler. *(CONFIRMED — misafir sipariş MVP kapsamında; kullanıcı profili genel hatlarıyla ASSUMED)*
2. **Marka yöneticisi (admin)** — Ürün, sipariş, stok ve ödeme onay süreçlerini yöneten tek bir temel admin rolü. İlk sürümde birden fazla rol/yetki seviyesi olmayacaktır. *(CONFIRMED — bkz. `docs/DECISIONS.md` D005)*

---

## 5. Temel Kullanıcı Senaryoları

**Müşteri tarafı:**
1. Kullanıcı sosyal medya veya doğrudan bir bağlantı üzerinden siteye gelir.
2. Ana sayfa, koleksiyon veya kategori sayfaları üzerinden ürünleri keşfeder.
3. Bir ürünün detay sayfasına girer, görsel galerisini inceler ve varyant (ör. renk, ölçü) seçer.
4. Ürünü sepete ekler.
5. Misafir olarak, üyelik oluşturmadan teslimat ve iletişim bilgilerini girerek siparişi tamamlar.
6. Ödeme yöntemi olarak Shopier veya Havale/EFT seçer.
7. Sipariş başarı ekranını görür ve bir sipariş numarası alır.
8. İsterse bu sipariş numarasıyla temel sipariş durumu sorgulaması yapar.

**Yönetici tarafı:**
1. Yönetici güvenli bir girişle panele erişir.
2. Dashboard üzerinden genel duruma bakar.
3. Ürün, kategori, koleksiyon ve varyant bilgilerini ekler/düzenler.
4. Fiyat ve stok bilgilerini günceller.
5. Gelen siparişleri listeden görüntüler ve detaylarını inceler.
6. Havale/EFT ile verilen siparişlerde ödemeyi manuel olarak onaylar.
7. Shopier üzerinden gelen siparişleri panelde görüntüler/eşleştirir.
8. Siparişe kargo takip kodu ekler ve sipariş durumunu günceller.
9. Site iletişim bilgilerini, IBAN/havale açıklamasını, kargo ücreti ve ücretsiz kargo sınırını yönetir.

*(Tüm senaryolar CONFIRMED — ham notlardaki MVP özellik listelerinden doğrudan türetilmiştir.)*

---

## 6. MVP Kapsamı

### Müşteri Tarafı
- Ana sayfa
- Koleksiyon ve kategori sayfaları
- Ürün listeleme
- Ürün detay sayfası
- Ürün görsel galerisi
- Ürün varyantı seçimi
- Sepet
- Misafir olarak sipariş verme
- Teslimat ve iletişim bilgileri girişi
- Shopier ödeme seçeneği
- Havale/EFT ödeme seçeneği
- Sipariş başarı ekranı ve sipariş numarası
- Temel sipariş sorgulama
- İletişim sayfası
- Kargo ve teslimat sayfası
- İade ve değişim sayfası
- Gizlilik ve mesafeli satış sözleşmesi sayfaları
- Mobil uyumlu tasarım
- Temel SEO altyapısı

### Yönetim Paneli
- Güvenli yönetici girişi
- Dashboard
- Ürün ekleme/düzenleme
- Ürün görsel yönetimi
- Kategori ve koleksiyon yönetimi
- Varyant yönetimi
- Fiyat ve stok yönetimi
- Sipariş listesi ve detayı
- Sipariş durumu değiştirme
- Havale ödemesini manuel onaylama
- Shopier siparişlerini görüntüleme/eşleştirme
- Kargo takip kodu ekleme
- Site iletişim bilgilerini yönetme
- IBAN ve havale açıklamasını yönetme
- Kargo ücreti ve ücretsiz kargo sınırını yönetme

*(CONFIRMED — ham notlardaki "Müşteri Tarafındaki MVP Özellikleri" ve "Yönetim Paneli" listelerinin birebir yansımasıdır.)*

---

## 7. MVP Dışında Kalanlar

- Müşteri üyeliği
- Sosyal giriş
- Favoriler
- Ürün yorumları
- Sadakat puanı
- Gelişmiş kupon sistemi
- Çoklu satıcı yapısı
- Mobil uygulama
- Uluslararası satış
- Birden fazla para birimi
- Gelişmiş ERP entegrasyonu
- Gelişmiş kargo firması entegrasyonu
- AI ile ürün görseli üretme

*(CONFIRMED — ham notlarda açıkça kapsam dışı bırakılmış ve proje sahibi tarafından ayrıca doğrudan onaylanmıştır: `docs/DECISIONS.md` D014. Bu liste MVP boyunca dar tutulmalı, yeni özellik eklenerek genişletilmemelidir.)*

---

## 8. Müşteri Tarafındaki Sayfalar

| Sayfa | Not |
|---|---|
| Ana sayfa | *(CONFIRMED)* |
| Koleksiyon sayfaları | *(CONFIRMED)* |
| Kategori sayfaları | *(CONFIRMED)* |
| Ürün listeleme sayfası | *(CONFIRMED)* |
| Ürün detay sayfası | *(CONFIRMED)* |
| Sepet sayfası | *(CONFIRMED)* |
| Ödeme/checkout akışı (teslimat + iletişim bilgileri + ödeme yöntemi seçimi) | *(CONFIRMED)* |
| Sipariş başarı sayfası | *(CONFIRMED)* |
| Sipariş sorgulama sayfası | *(CONFIRMED)* |
| İletişim sayfası | *(CONFIRMED)* |
| Kargo ve teslimat sayfası | *(CONFIRMED)* |
| İade ve değişim sayfası | *(CONFIRMED)* |
| Gizlilik politikası sayfası | *(CONFIRMED)* |
| Mesafeli satış sözleşmesi sayfası | *(CONFIRMED)* |

Bu sayfaların kesin metin içerikleri (iade koşulları, mesafeli satış sözleşmesi maddeleri vb.) müşteriden veya hukuki danışmandan alınacak bilgiye bağlıdır. *(OPEN)*

---

## 9. Yönetim Paneli Kapsamı

- Güvenli yönetici girişi (kimlik doğrulama). İlk sürümde tek bir temel admin rolü olacak; çoklu rol/yetki ayrımı yapılmayacak. *(CONFIRMED — bkz. `docs/DECISIONS.md` D005)*
- Dashboard: genel sipariş/satış özetine dair temel göstergeler. *(CONFIRMED kapsamda olduğu; içereceği kesin metrikler ASSUMED)*
- Ürün, kategori, koleksiyon ve varyant yönetimi (ekleme/düzenleme/görsel yönetimi). *(CONFIRMED)*
- Fiyat ve stok yönetimi. *(CONFIRMED)*
- Sipariş listesi, sipariş detayı, sipariş durumu değiştirme. *(CONFIRMED)*
- Havale/EFT ödemesini manuel onaylama akışı. *(CONFIRMED)*
- Shopier siparişlerini panelde görüntüleme/eşleştirme. Bu eşleştirmenin otomatik mi manuel mi olacağı, Shopier entegrasyon yöntemine bağlı olduğu için henüz netleşmemiştir. *(OPEN)*
- Kargo takip kodu ekleme. *(CONFIRMED)*
- Site iletişim bilgileri, IBAN/havale açıklaması, kargo ücreti ve ücretsiz kargo sınırı gibi ayarların yönetimi. *(CONFIRMED)*

---

## 10. Ürün ve Varyant Modeli İçin İş Gereksinimleri

Ham notlara göre ürünlerde aşağıdaki özniteliklerin **bir kısmı** kullanılabilir (hepsi her üründe zorunlu değildir):

- Kategori
- Koleksiyon
- Materyal
- Kaplama
- Renk
- Taş türü
- Beden veya ölçü
- Zincir uzunluğu
- SKU
- Fiyat
- İndirimli fiyat
- Stok
- Ürün bakım bilgileri
- Hediye paketi seçeneği

*(CONFIRMED — liste ham notlardan birebir alınmıştır.)*

Kesin varyant yapısı (hangi özniteliklerin zorunlu, hangilerinin opsiyonel olacağı; varyant kombinasyonlarının nasıl kurulacağı) gerçek ürün kataloğu görüldükten sonra netleşecektir. Bu nedenle veri modeli, esnek/genişletilebilir bir öznitelik yapısı varsayımıyla tasarlanmalıdır. *(CONFIRMED gereksinim; kesin şema OPEN)*

Hediye paketi seçeneğinin sipariş sürecine (ek ücret, checkout adımı vb.) nasıl yansıyacağı netleşmemiştir. *(OPEN)*

---

## 11. Sipariş Yaşam Döngüsü

Ham notlarda sipariş durumları tek tek adlandırılmamıştır; aşağıdaki akış, notlarda geçen sabit noktalardan (havale siparişinin "ödeme bekliyor" durumunda başlaması, yöneticinin havaleyi manuel onaylaması, kargo takip kodu eklenmesi, sipariş durumu değiştirme) türetilmiştir ve ara adımların isimlendirmesi **ASSUMED**'dur; kesin durum listesi geliştirme sırasında netleştirilmelidir.

**Havale/EFT siparişi:**
1. Sipariş oluşturulur → durum: *Ödeme Bekliyor* *(CONFIRMED)*
2. Yönetici havale dekontunu/hesap hareketini kontrol eder ve ödemeyi panelden manuel olarak onaylar *(CONFIRMED)*
3. Sipariş durumu güncellenir (ör. *Hazırlanıyor*) *(ASSUMED)*
4. Kargoya verilince yönetici kargo takip kodu ekler, durum güncellenir (ör. *Kargoya Verildi*) *(CONFIRMED — takip kodu eklenmesi; durum adı ASSUMED)*
5. Teslim sonrası durum (ör. *Teslim Edildi*) *(ASSUMED)*

**Shopier siparişi:**
1. Müşteri Shopier üzerinden ödemeyi tamamlar.
2. Sipariş, panelde Shopier siparişi olarak görüntülenir/eşleştirilir. Bu adımın teknik detayı (webhook, manuel kontrol, dışa aktarım vb.) Shopier entegrasyon yöntemi netleşmeden bilinemez. *(OPEN)*
3. Sonraki adımlar (hazırlanıyor → kargoya verildi → teslim edildi) havale akışıyla benzer şekilde işler. *(ASSUMED)*

**Eksik durumlar — iptal ve iade:** Müşteri tarafında bir "İade ve Değişim" sayfası planlanmasına ve panelde "sipariş durumu değiştirme" özelliği bulunmasına rağmen (Bölüm 6, 8, 9), ham notlarda *İptal Edildi* ve *İade Edildi* gibi bir sipariş durumu açıkça adlandırılmamıştır. Sipariş durumu alanının bu iki durumu da kapsayabilecek şekilde tasarlanması, zaten kapsamdaki "sipariş durumu değiştirme" özelliğinin doğal bir parçası olarak varsayılmıştır. *(ASSUMED — yeni bir özellik değil, mevcut kapsamın netleştirilmesidir)*

**Stok düşme/rezervasyon anı — politikanın zamanlaması kesinleşti, kendisi henüz OPEN:** Stoğun sipariş oluşturulduğu anda mı yoksa ödeme onaylandığında mı düşüleceği/rezerve edileceği ve havale siparişlerinde ne kadar süre bekletileceği (bekleme süresi dolunca otomatik iptal edilip edilmeyeceği dâhil), ilgili sipariş/stok modülü geliştirilmeden önce kesinleştirilecektir. Bu, aynı üründe eşzamanlı Shopier ve Havale siparişlerinde stok tutarsızlığına (aynı son adedin iki siparişe birden verilmesi) yol açabilecek bir mimari risktir. *(CONFIRMED — politikanın modülden önce kesinleştirileceği proje sahibi tarafından onaylandı: `docs/DECISIONS.md` D016; politikanın kendisi OPEN — bkz. Risk Kaydı R1 ve `docs/OPEN_QUESTIONS.md` #8)*

**Sipariş oluşturmanın ve ödeme işlemenin tekrarsız (idempotent) olması:** Bir müşterinin ödeme adımında çift tıklaması, sayfayı yenilemesi veya geri gitmesi ya da aynı ödeme bildiriminin (ör. Shopier) tekrarlanması durumunda aynı sepetten/işlemden birden fazla sipariş veya stok düşümü oluşmamalıdır. *(CONFIRMED — proje sahibi tarafından doğrudan onaylandı: `docs/DECISIONS.md` D017; bkz. Risk Kaydı R2)*

---

## 12. Shopier Ödeme Gereksinimleri

- İlk sürümde ödeme yöntemlerinden biri Shopier olacaktır. *(CONFIRMED — `docs/DECISIONS.md` D006)*
- Shopier'in kullanılabilir entegrasyon yöntemi (ör. hazır ödeme linki/buton entegrasyonu, API tabanlı entegrasyon, webhook desteği), gerçek Shopier hesabı ve güncel teknik imkânlar incelenmeden **varsayılmamalıdır**. Bu belge, herhangi bir Shopier API veya checkout özelliğinin var olduğunu iddia etmez. Bu araştırma, ödeme modülüne gelindiğinde yapılacaktır. *(CONFIRMED süreç kararı — `docs/DECISIONS.md` D009, D010; teknik entegrasyon yönteminin kendisi OPEN — bkz. `docs/OPEN_QUESTIONS.md` #9)*
- Panelde Shopier siparişlerinin görüntülenebilmesi/eşleştirilebilmesi gerekmektedir; bu işlemin otomatik mi manuel mi olacağı yukarıdaki entegrasyon yöntemine bağlıdır. *(CONFIRMED ihtiyaç; yöntem OPEN)*
- Entegrasyon yöntemi ne olursa olsun (webhook, manuel eşleştirme vb.), aynı Shopier ödeme bildirimi/eşleştirmesi birden fazla kez işlense bile sipariş yalnızca bir kez onaylanmalı ve stok yalnızca bir kez düşülmelidir; aksi hâlde tekrarlanan bildirim çift siparişe/çift stok düşümüne yol açabilir. *(CONFIRMED — `docs/DECISIONS.md` D017; bkz. Risk Kaydı R2)*

---

## 13. Havale/EFT Ödeme Gereksinimleri

- İlk sürümde ödeme yöntemlerinden biri Havale/EFT olacaktır. *(CONFIRMED)*
- Havale ile verilen siparişler oluşturulduğunda "ödeme bekliyor" durumunda olacaktır. *(CONFIRMED)*
- Ödemenin onaylanması yönetici tarafından panel üzerinden **manuel** olarak yapılacaktır (otomatik banka entegrasyonu planlanmamaktadır). *(CONFIRMED)*
- IBAN bilgisi ve havale açıklaması (sipariş numarası vb.) yönetim panelinden yönetilebilir olmalıdır. *(CONFIRMED)*
- Gerçek IBAN ve banka bilgileri bu belgede yer almaz; sistemde `[IBAN_PLACEHOLDER]` ve `[HAVALE_ACIKLAMA_FORMATI_PLACEHOLDER]` gibi yer tutucularla temsil edilmelidir. *(CONFIRMED — placeholder kuralı)*
- Ödeme onaylanana kadar stoğun ne zaman/ne kadar bekletileceği (politika), sipariş/stok modülü geliştirilmeden önce kesinleştirilecektir; ayrıntı için bkz. Bölüm 11 ve Risk Kaydı R1. *(CONFIRMED süreç kararı — `docs/DECISIONS.md` D016; politikanın kendisi OPEN)*

---

## 14. Shopier'den Bağımsız Ödeme Mimarisi Gereksinimi

- Ödeme sistemi, ürün ve sipariş altyapısına doğrudan/sıkı bağlı (gömülü) şekilde tasarlanmamalıdır; hiçbir sağlayıcıya (Shopier dâhil) sıkı biçimde bağlanmayacaktır. *(CONFIRMED — `docs/DECISIONS.md` D008)*
- Mimari, Shopier ileride kaldırıldığında yerine başka bir ödeme sağlayıcısının eklenebileceği şekilde kurulmalıdır (ör. ödeme sağlayıcısı katmanının soyutlanması). Somut mimari deseni bu belgenin kapsamı dışındadır; bu belge teknik implementasyona girmez. *(CONFIRMED gereksinim — `docs/DECISIONS.md` D008)*
- Hangi ödeme sağlayıcısının Shopier'in yerini alacağı (varsa) belirlenmemiştir ve MVP kapsamının dışındadır. *(OPEN — sonraki sürüm konusu)*

---

## 15. Görsel ve Medya Kullanım Politikası

- Projede hiçbir ürün veya editorial görseli yapay zeka ile **üretilmeyecektir**. fal.ai, Midjourney, DALL-E veya benzeri AI görsel üretim servisleri kullanılmayacaktır. *(CONFIRMED — `docs/DECISIONS.md` D011)*
- Lisanslı hazır stok görseller **yalnızca** hero (ana görsel) alanları, koleksiyon kapakları, editorial içerikler ve marka hikâyesi alanlarında kullanılabilir; ürün kartı veya ürün detay sayfasında kullanılamaz. *(CONFIRMED — `docs/DECISIONS.md` D013)*
- Ürün kartlarında ve ürün detay sayfalarında yalnızca satılan **gerçek ürüne ait** görseller kullanılmalıdır. *(CONFIRMED — `docs/DECISIONS.md` D012)*
- Başka bir ürüne ait stok fotoğraf, gerçek ürün görseli gibi gösterilmemelidir. *(CONFIRMED)*
- Kullanılan hazır (stok) görsellerin kaynak ve lisans bilgileri kayıt altında tutulmalıdır. *(CONFIRMED)*
- Müşteri veya tedarikçi tarafından verilen ürün görsellerinin kullanım izni kontrol edilmelidir. *(CONFIRMED)*
- Ürün görsellerinin kim tarafından (müşteri mi, profesyonel çekim mi, tedarikçi mi) sağlanacağı henüz netleşmemiştir. *(OPEN)*

---

## 16. Güvenlik ve Gizlilik Gereksinimleri

- Yönetim paneline erişim güvenli bir yönetici girişiyle (kimlik doğrulama) korunmalıdır. *(CONFIRMED)*
- Yönetici girişinin, otomatik şifre deneme saldırılarına (brute force) karşı temel bir koruma (ör. deneme sınırlandırma) içermesi beklenir; ham notlarda bu düzeyde bir detay verilmemiştir. *(ASSUMED — "güvenli yönetici girişi" ihtiyacının doğal bir parçası; yeni bir özellik değildir)*
- Gizli anahtarlar (API anahtarları, ödeme bilgileri vb.) Git deposuna **eklenmemelidir**. *(CONFIRMED)*
- Sitede gizlilik politikası ve mesafeli satış sözleşmesi sayfaları bulunmalıdır (KVKK ve Türkiye e-ticaret mevzuatına uyum ihtiyacının bir yansıması olarak). *(CONFIRMED sayfa ihtiyacı; kesin hukuki metin içeriği OPEN)*
- Müşterinin teslimat ve iletişim bilgileri gibi kişisel verilerinin korunması gerekmektedir; bu konudaki kesin veri saklama/işleme kuralları ham notlarda detaylandırılmamıştır. *(ASSUMED genel ilke; detaylar OPEN)*
- **Sipariş sorgulama ve kişisel veri sızıntısı riski:** "Temel sipariş sorgulama" özelliği yalnızca sipariş numarasıyla çalışırsa, numarayı tahmin eden/deneyen bir üçüncü kişi başka bir müşterinin adını, adresini ve sipariş içeriğini görebilir. Bu nedenle sorgulama, sipariş numarasına ek olarak bir doğrulama bilgisi (ör. e-posta veya telefon) isteyecektir; kesin yöntem, sipariş sorgulama modülü geliştirilmeden önce belirlenecektir. *(CONFIRMED gereklilik — `docs/DECISIONS.md` D015; kesin yöntem OPEN — bkz. Risk Kaydı R3 ve `docs/OPEN_QUESTIONS.md` #12)*
- Yönetim panelindeki müşteri kişisel verilerine (isim, adres, telefon, e-posta) yalnızca panele giriş yapan yetkili admin erişebilir. İlk sürümde tek bir admin rolü olduğu için ayrı bir erişim kısıtlama/rol matrisi tasarımına gerek yoktur. *(CONFIRMED — `docs/DECISIONS.md` D005)*
- Gerçek banka, kimlik, şirket ve iletişim bilgileri bu belgede ve türevlerinde yer almamalı, yerine placeholder kullanılmalıdır (bkz. Bölüm 13). *(CONFIRMED — bu belgenin kendi kuralı)*

---

## 17. Performans, Mobil Uyumluluk ve SEO Gereksinimleri

- Site mobil uyumlu (responsive) olarak tasarlanmalıdır. *(CONFIRMED)*
- Temel SEO altyapısı bulunmalıdır (ör. sayfa başlıkları, meta açıklamalar, temiz URL yapısı gibi genel iyi uygulamalar). Kapsamın tam olarak neleri içereceği (yapılandırılmış veri, site haritası, çoklu dil SEO'su vb.) netleşmemiştir. *(CONFIRMED temel ihtiyaç; kapsam detayı ASSUMED/OPEN)*
- Sayfa yükleme performansına dair somut bir hedef (ör. belirli bir Core Web Vitals eşiği) ham notlarda belirtilmemiştir. *(OPEN)*

---

## 18. Temel Kabul Kriterleri

MVP'nin tamamlandığı kabul edilebilmesi için aşağıdaki kriterlerin sağlanması beklenir:

1. Bir müşteri, ana sayfadan başlayarak bir koleksiyon/kategori üzerinden bir ürüne ulaşabilir, varyant seçebilir ve sepete ekleyebilir. *(CONFIRMED)*
2. Bir müşteri, üyelik oluşturmadan (misafir olarak) teslimat ve iletişim bilgilerini girerek sipariş tamamlayabilir. *(CONFIRMED)*
3. Ödeme adımında Shopier veya Havale/EFT seçilebilir. *(CONFIRMED)*
4. Sipariş tamamlandığında müşteri bir sipariş numarası ve başarı ekranı görür; bu numarayla sipariş durumunu sorgulayabilir. *(CONFIRMED)*
5. Yönetici panele güvenli şekilde giriş yapıp ürün/kategori/koleksiyon/varyant/stok/fiyat bilgilerini yönetebilir. *(CONFIRMED)*
6. Yönetici, havale siparişlerini panelden manuel olarak onaylayabilir. *(CONFIRMED)*
7. Yönetici, Shopier siparişlerini panelde görüntüleyebilir/eşleştirebilir. **Not:** Bu kriter, Shopier entegrasyon yöntemi araştırılıp (bkz. `docs/DECISIONS.md` D009/D010, `docs/OPEN_QUESTIONS.md` #9) somut bir eşleştirme mekanizması tanımlanana kadar test edilemez; bu belge aşamasında yalnızca bir ihtiyaç beyanıdır, ölçülebilir bir kriter değildir. *(CONFIRMED ihtiyaç; yöntem ve test edilebilir kriter OPEN)*
8. Yönetici siparişlere kargo takip kodu ekleyebilir ve sipariş durumunu (İptal Edildi ve İade Edildi dâhil) güncelleyebilir. *(CONFIRMED)*
9. İletişim, kargo/teslimat, iade/değişim, gizlilik ve mesafeli satış sayfaları sitede yayında ve erişilebilir durumdadır. *(CONFIRMED — kesin metin içerikleri OPEN)*
10. Ana sayfa, ürün listeleme, ürün detay ve sepet/checkout sayfaları 375px genişliğe kadar yatay kaydırma veya bozulma olmadan görüntülenir. *(ASSUMED somut eşik — ham notlarda "mobil uyumlu" ifadesi dışında ölçüt verilmemiştir; test edilebilir hâle getirmek için varsayılmıştır)*
11. Her sayfada benzersiz bir `<title>` ve meta açıklama bulunur, URL'ler insan tarafından okunabilir bir yapıdadır. *(ASSUMED somut eşik — "temel SEO altyapısı" ifadesinin test edilebilir bir alt kümesidir; kapsamın tamamı değildir)*
12. Ürün kartlarında ve detay sayfalarında yalnızca gerçek ürün görselleri, editorial alanlarda ise yalnızca lisanslı stok görseller kullanılır; AI üretimi görsel yoktur. **Not:** Bu kriter otomatik test edilemez, yayın öncesi manuel içerik kontrolü gerektirir. *(CONFIRMED kural; doğrulama yöntemi ASSUMED — manuel kontrol)*
13. Gizli anahtarlar ve ödeme bilgileri Git deposunda yer almaz. *(CONFIRMED)*
14. Aynı sepetten checkout adımında yapılan tekrarlanan bir gönderim (çift tıklama, sayfa yenileme) ikinci bir sipariş oluşturmaz. *(CONFIRMED — `docs/DECISIONS.md` D017; bkz. Risk Kaydı R2)*

---

## 19. Riskler ve Bağımlılıklar

- **Marka kimliği eksikliği**: Marka adı, logo ve kurumsal renkler netleşmeden görsel tasarım sistemi tamamlanamaz; bu bir zamanlama riski oluşturur. *(OPEN'a bağlı risk)*
- **Ürün kataloğu eksikliği**: Kesin ürün kategorileri ve varyant yapısı bilinmeden ürün veri modeli ve arayüzü nihai hâlini alamaz. *(OPEN'a bağlı risk)*
- **Shopier entegrasyon belirsizliği**: Shopier'in gerçek hesapla hangi entegrasyon yöntemlerini desteklediği araştırılmadan ödeme modülünün teknik kapsamı kesinleşemez; bu, ödeme modülü geliştirmesini geciktirebilir. *(OPEN'a bağlı risk)*
- **Görsel tedarik bağımlılığı**: Ürün görsellerinin kim tarafından ve ne zaman sağlanacağı netleşmeden ürün kataloğu tam olarak doldurulamaz. *(OPEN'a bağlı risk)*
- **Kargo süreci belirsizliği**: Kargo firması, kargo ücreti ve ücretsiz kargo sınırı netleşmeden checkout akışındaki kargo hesaplama mantığı kesinleşemez. *(OPEN'a bağlı risk)*
- **Hukuki içerik bağımlılığı**: İade/değişim kuralları ve mesafeli satış sözleşmesi gibi hukuki metinler müşteriden veya bir hukuki danışmandan alınmadan bu sayfalar nihai içerikle yayına alınamaz. *(OPEN'a bağlı risk)*
- **Gerçek kullanım riski**: Sistem bir demo değil, gerçek müşteriler tarafından kullanılacağı için ödeme ve sipariş akışlarındaki hatalar doğrudan gerçek satışları etkiler; bu nedenle özellikle ödeme ve stok mantığı dikkatli test edilmelidir. *(CONFIRMED bağlam; test stratejisi bu belgenin kapsamı dışındadır.)*

---

## 20. Risk Kaydı

Bu belgenin PM, sistem mimarisi ve QA/güvenlik perspektiflerinden gözden geçirilmesi sonucunda tespit edilen, gerçek satış akışını doğrudan etkileyebilecek başlıca riskler:

| ID | Risk | Etki | Azaltma |
|---|---|---|---|
| R1 | Stok düşme/rezervasyon anının netleşmemiş olması nedeniyle aynı üründe Shopier ve Havale siparişlerinin eşzamanlı gelmesi durumunda stok tutarsızlığı (fazla satış) oluşabilir. | Yüksek — gerçek stok/müşteri memnuniyeti sorunu | Politikanın sipariş/stok modülünden önce kesinleştirileceği karara bağlandı (`docs/DECISIONS.md` D016); netleşene kadar konservatif (erken rezervasyon) yaklaşım izlenir. |
| R2 | Checkout'ta çift gönderim veya Shopier bildiriminin tekrarlanması, aynı sipariş için birden fazla kayıt/stok düşümü oluşturabilir. | Yüksek — çift sipariş/çift ücretlendirme riski | Sipariş oluşturma ve ödeme onaylama adımlarının tekrarsız (idempotent) olması kesin karar olarak onaylandı (`docs/DECISIONS.md` D017). |
| R3 | Sipariş sorgulamanın yalnızca sipariş numarasıyla yapılması, başka bir müşterinin kişisel verilerinin (ad, adres, sipariş içeriği) görülmesine yol açabilir. | Orta-Yüksek — KVKK/gizlilik ihlali riski | Sorgulamaya sipariş numarasına ek bir doğrulama alanı eklenmesi kesin karar olarak onaylandı (`docs/DECISIONS.md` D015); kesin alan (e-posta/telefon) OPEN. |
| R4 | Yönetici girişinde deneme sınırlandırması olmadan yetkisiz erişim denemeleri yapılabilir. | Orta — yetkisiz panel erişimi riski | Temel oturum güvenliği ve deneme sınırlandırması ilkesiyle ilerlenir. |
| R5 | Shopier entegrasyon yöntemi netleşmeden ödeme modülünün gerçek kapsamı belirlenemez; erken tasarım Shopier'in gerçekte sunmadığı bir özelliği varsayabilir. | Yüksek — yeniden iş riski | Hiçbir Shopier API/checkout özelliği doğrulanmadan varsayılmaz; entegrasyon, ödeme modülüne gelindiğinde ayrı bir araştırma adımı olarak ele alınacağı karara bağlandı (`docs/DECISIONS.md` D009, D010). |
| R6 | Sipariş durumu modelinde İptal/İade durumlarının baştan tanımlanmaması, ileride veri modeli değişikliğine yol açabilir. | Orta | Durum listesine İptal Edildi ve İade Edildi baştan dâhil edilir. |

---

## 21. CONFIRMED / ASSUMED / OPEN Karar Özeti

> Proje sahibi tarafından resmî olarak onaylanmış kararların tam listesi ve gerekçeleri için bkz. `docs/DECISIONS.md`. Aşağıdaki özet, bu brief belgesi içindeki dağınık etiketlerin toplu bir görünümüdür.

### CONFIRMED (Doğrulanmış)
- Hedef pazar Türkiye, dil Türkçe, para birimi TRY (`docs/DECISIONS.md` D001-D003).
- Müşteri üyeliği yok, guest checkout (D004).
- İlk sürümde tek temel admin rolü (D005).
- MVP kapsamındaki müşteri sayfaları ve yönetim paneli özellik listesi (Bölüm 6).
- MVP dışında tutulan özellikler listesi (Bölüm 7, D014).
- İki ödeme yöntemi: Shopier ve Havale/EFT (D006); havale ödemesinin yönetici tarafından manuel onaylanması (D007).
- Ödeme sisteminin ürün/sipariş altyapısına gömülü olmaması ve sağlayıcı değişimine açık olması gerekliliği (D008).
- Shopier entegrasyon araştırmasının ödeme modülüne gelindiğinde yapılacağı ve doğrulanmamış Shopier özelliğinin varsayılmayacağı (D009, D010).
- AI ile görsel üretilmeyeceği (D011); ürün kartlarında gerçek ürün görseli kullanılacağı (D012); lisanslı stok görsellerin yalnızca hero/koleksiyon/editorial/marka hikâyesi alanlarında kullanılabileceği (D013).
- Sipariş sorgulamanın ek bir doğrulama bilgisi isteyeceği (D015 — kesin yöntem OPEN).
- Stok düşme/rezervasyon politikasının ilgili modülden önce kesinleştirileceği (D016 — politikanın kendisi OPEN).
- Sipariş oluşturma ve ödeme işleme akışlarının tekrarsız (idempotent) olması gerekliliği (D017).
- Mobil uyumluluk ve temel SEO ihtiyacı.
- Gizli anahtarların/ödeme bilgilerinin Git deposuna eklenmemesi.
- Planlanan teknoloji seti (Next.js, TypeScript, Tailwind CSS, shadcn/ui, PostgreSQL, Prisma).

### ASSUMED (Geçici Varsayım)
- Sipariş yaşam döngüsündeki ara durum adları (ör. "Hazırlanıyor", "Kargoya Verildi", "Teslim Edildi") ve İptal Edildi/İade Edildi durumlarının listeye dâhil edilmesi.
- Dashboard'un içereceği kesin metrikler.
- Kullanıcı profiline dair genel bağlam (Instagram ağırlıklı bireysel tüketiciler).
- Temel SEO altyapısının ve mobil uyumluluğun test edilebilir asgari kapsamı (Bölüm 18, kriter 10-11).
- Yönetici girişinde temel bir deneme sınırlandırması bulunacağı.

### OPEN (Cevap Bekleniyor)
- Marka adı, logo ve kurumsal kimlik.
- Kesin ürün kategorileri ve kesin varyant yapısı.
- Kargo firması, kargo ücreti, ücretsiz kargo sınırı.
- Stok düşme/rezervasyon politikasının kesin içeriği (havale bekletme süresi ve süre dolunca otomatik iptal dâhil) — bkz. D016.
- Shopier hesabının kullanılabilir entegrasyon yöntemi — bkz. D009, D010.
- İade ve değişim kuralları; fatura süreci.
- Sipariş bildirimlerinin e-posta mı WhatsApp üzerinden mi gönderileceği.
- Ürün görsellerinin kim tarafından sağlanacağı.
- Sipariş sorgulamada kullanılacak ek doğrulama yönteminin kesin şekli (e-posta mı, telefon mu) — bkz. D015.

> Tüm OPEN maddelerin detaylı önceliklendirmesi için bkz. `docs/OPEN_QUESTIONS.md`; kesinleşmiş kararların resmî kaydı için bkz. `docs/DECISIONS.md`.
