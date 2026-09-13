# Proje-Özel Kararlar ve Açık Sorular (Ürün/Katalog Domain'i)

Bu dosya, `docs/DECISIONS.md` ve `docs/OPEN_QUESTIONS.md` içindeki maddelerin **yalnızca ürün/katalog/varyant domain'iyle ilgili olanlarının** bir özetidir. Bu bir anlık görüntüdür (snapshot) — **her zaman kaynak belgeyi** (`docs/DECISIONS.md`, `docs/OPEN_QUESTIONS.md`) açıp doğrula; çelişki olursa kaynak belge esastır.

## Kesinleşmiş kararlar (bağlayıcı)

| Karar | Özet | Domain etkisi |
|---|---|---|
| D004 | Üyelik yok, guest checkout | Ürün/sepet verisi bir kullanıcı hesabına değil, sipariş kaydına bağlanır. |
| D005 | Tek temel admin rolü | Ürün/kategori/koleksiyon/varyant yönetim ekranlarında rol/yetki ayrımı tasarlanmaz. |
| D008 | Ödeme sağlayıcısından bağımsız mimari | Ürün/sipariş veri modeli, ödeme sağlayıcısına (Shopier dâhil) sıkı bağlı tasarlanmaz. |
| D011 | AI ile görsel üretimi yasak | Ürün görsel alanları için hiçbir AI üretim aracı kullanılmaz. |
| D012 | Ürün kartı/detayda yalnızca gerçek ürün görseli | Ürün görsel veri modelinde stok/placeholder görsel ile gerçek ürün görseli karışmamalı. |
| D013 | Lisanslı stok görsel yalnızca hero/koleksiyon/editorial/marka hikâyesi alanlarında | Ürün ve Collection görsel alanları ayrı politika taşıyabilir (ör. Collection kapak görseli stok foto olabilir, Product galerisi olamaz). |
| D014 | MVP dışı özellik listesi (üyelik, favoriler, yorumlar, sadakat, gelişmiş kupon, çoklu satıcı, mobil uygulama, uluslararası satış, çoklu para birimi) | Ürün/katalog modeline bu özellikler için alan/ilişki eklenmez. |
| D017 | Idempotent sipariş/ödeme akışları | Stok düşümü içeren her işlem (sipariş oluşturma, ödeme onayı) tekrarlanan istekte ikinci bir stok düşümü yaratmamalı. |

## Henüz OPEN olan, domain'i doğrudan etkileyen sorular

Bu maddelerde **kendi başına karar verme** — geçici varsayımla ilerle ve kararın hâlâ açık olduğunu kodda/tasarımda bir notla işaretle.

| # | Soru | Geçici varsayım | Kaynak |
|---|---|---|---|
| 3 | Kesin ürün kategorileri nelerdir? | Sektörde yaygın örnek kategorilerle (kolye, yüzük, bileklik, küpe) esnek/genişletilebilir bir kategori yapısı kurulur. | `docs/OPEN_QUESTIONS.md` #3 |
| 4 | Ürün varyantlarının kesin yapısı nasıl olacak (hangi öznitelik zorunlu/opsiyonel)? | Tüm bilinen özniteliklerin (materyal, kaplama, renk, taş türü, beden/ölçü, zincir uzunluğu) opsiyonel olduğu esnek bir model. | `docs/OPEN_QUESTIONS.md` #4 |
| 8 | Stok düşme/rezervasyon anı ve havale bekletme süresi ne olacak? | Stok, sipariş oluşturulduğu anda konservatif biçimde rezerve edilir varsayımıyla ilerlenir; kesin politika ilgili modülden önce netleşecek (D016). | `docs/OPEN_QUESTIONS.md` #8, `docs/DECISIONS.md` D016 |
| 11 | Ürün görsellerini kim sağlayacak? | Görseller müşteri tarafından sağlanacak varsayımıyla, panel görsel yükleme özelliğiyle hazır tutulur. | `docs/OPEN_QUESTIONS.md` #11 |

Ayrıca `docs/AGENT_TEAM.md` → *Recommendations* bölümünde commerce agent'ının kendi analizinden çıkardığı, henüz karara bağlanmamış iki açık madde daha var:

- SKU/fiyat/stok alanlarının ürün seviyesinde mi yoksa yalnızca varyant seviyesinde mi tutulacağı.
- Category ile Collection arasındaki ilişkinin (bir ürün birden fazla koleksiyona girebilir mi) kesin tanımı.

Bunlar proje sahibi kararı değil, bir teammate önerisi/gözlemidir — `docs/DECISIONS.md`'ye taşınana kadar kesin kabul edilmemelidir (bkz. proje hafızasındaki "agent önerileri karar değildir" kuralı).

## Bu domain'de kapsam dışı kalan şeyler (tekrar hatırlatma)

- Shopier'in teknik entegrasyon detayı — bu dosyanın veya bu skill'in konusu değildir (`docs/DECISIONS.md` D009/D010, `payment-integration` agent'ının sorumluluğu).
- Ödeme sağlayıcısı implementasyonu — commerce/katalog domain'i bunu içermez.
- MVP dışı bırakılan hiçbir özellik (D014) bu domain'e sızmamalı.

## Bu dosyayı ne zaman güncellemeli

`docs/DECISIONS.md` veya `docs/OPEN_QUESTIONS.md`'de ürün/katalog/varyant ile ilgili bir madde değiştiğinde (yeni bir D-madde eklendiğinde ya da bir OPEN soru kapatıldığında), bu dosya da güncellenmelidir — aksi hâlde bu skill güncel olmayan bir anlık görüntü sunmaya devam eder.
