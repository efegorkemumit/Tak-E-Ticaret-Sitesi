# Ham Müşteri Notları

## Proje Bağlamı

- Proje, bir akrabanın gerçek takı markası için hazırlanacaktır.
- Ortaya çıkan sistem demo olarak kalmayacak, gerçek müşteriler tarafından kullanılacaktır.
- Marka adı, logo, kurumsal renkler ve kesin ürün kataloğu henüz netleşmemiştir.
- İlk hedef pazar Türkiye'dir.
- İlk dil Türkçedir.
- Para birimi Türk lirasıdır.

## İş Hedefleri

- Instagram, sosyal medya ve doğrudan bağlantılardan gelen kullanıcıları markanın kendi sitesine yönlendirmek.
- Ürünleri profesyonel koleksiyon ve kategori sayfalarıyla sergilemek.
- Shopier ve Havale/EFT ile sipariş alabilmek.
- Ürün, varyant, stok ve siparişleri kendi yönetim panelimizden yönetebilmek.
- Sistemi Shopier'e kalıcı olarak bağımlı hâle getirmemek.
- İleride Shopier çıkarıldığında başka bir ödeme sağlayıcısına geçebilecek bir mimari kurmak.

## Müşteri Tarafındaki MVP Özellikleri

- Ana sayfa
- Koleksiyon ve kategori sayfaları
- Ürün listeleme
- Ürün detay sayfası
- Ürün görsel galerisi
- Ürün varyantı seçimi
- Sepet
- Misafir olarak sipariş verme
- Teslimat ve iletişim bilgileri
- Shopier ödeme seçeneği
- Havale/EFT ödeme seçeneği
- Sipariş başarı ekranı
- Sipariş numarası
- Temel sipariş sorgulama
- İletişim sayfası
- Kargo ve teslimat sayfası
- İade ve değişim sayfası
- Gizlilik ve mesafeli satış sayfaları
- Mobil uyumlu tasarım
- Temel SEO altyapısı

## Ürün ve Varyant İhtiyaçları

Ürünlerde aşağıdaki özelliklerin bazıları kullanılabilir:

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

Kesin varyant yapısı ürün kataloğu görüldükten sonra netleşecektir.

## Yönetim Paneli

- Güvenli yönetici girişi
- Dashboard
- Ürün ekleme ve düzenleme
- Ürün görsellerini yönetme
- Kategori ve koleksiyon yönetimi
- Varyant yönetimi
- Fiyat ve stok yönetimi
- Sipariş listesi
- Sipariş detayı
- Sipariş durumu değiştirme
- Havale ödemesini manuel olarak onaylama
- Shopier siparişlerini görüntüleme veya eşleştirme
- Kargo takip kodu ekleme
- Site iletişim bilgilerini yönetme
- IBAN ve havale açıklamasını yönetme
- Kargo ücreti ve ücretsiz kargo sınırını yönetme

## Ödeme

İlk sürümde iki ödeme yöntemi olacaktır:

1. Shopier
2. Havale/EFT

Ödeme sistemi doğrudan ürün ve sipariş altyapısına gömülmemelidir.

Shopier ileride çıkarılabilmeli ve yerine başka bir ödeme sağlayıcısı eklenebilmelidir.

Shopier'in kullanılabilir entegrasyon yöntemi, gerçek hesap ve güncel teknik imkânlar incelendikten sonra kesinleştirilecektir.

Havale siparişleri ilk oluşturulduğunda ödeme bekliyor durumunda olacaktır.

Havale ödemesinin yönetici tarafından manuel olarak onaylanması planlanmaktadır.

## Görsel Kullanım Politikası

- Projede AI ile görsel üretilmeyecektir.
- fal.ai, Midjourney, DALL-E veya benzeri görsel üretim servisleri kullanılmayacaktır.
- Ana sayfa, koleksiyon kapağı ve editorial alanlarda lisanslı hazır stok görseller kullanılabilir.
- Ürün kartlarında ve ürün detay sayfalarında satılan gerçek ürüne ait görseller kullanılmalıdır.
- Başka bir ürüne ait stok fotoğraf gerçek ürün görseli gibi gösterilmemelidir.
- Hazır görsellerin kaynak ve lisans bilgileri kayıt altında tutulmalıdır.
- Müşteri veya tedarikçi tarafından verilen ürün görsellerinin kullanım izni kontrol edilmelidir.

## Teknik Yön

Planlanan ana teknoloji seti:

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- PostgreSQL
- Prisma

Kesin teknik mimari, brief ve planlama tamamlandıktan sonra belirlenecektir.

Gizli anahtarlar ve ödeme bilgileri Git deposuna eklenmemelidir.

## İlk Sürümün Dışında Tutulması Planlanan Özellikler

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

## Henüz Netleşmeyen Konular

- Marka adı
- Logo ve kurumsal kimlik
- Kesin ürün kategorileri
- İlk ürün sayısı
- Ürün varyantlarının kesin yapısı
- Kargo firması
- Kargo ücreti
- Ücretsiz kargo sınırı
- Havale siparişlerinde stok bekletme süresi
- Shopier hesabının kullanılabilir entegrasyon imkânları
- İade ve değişim kuralları
- Fatura süreci
- Sipariş bildirimlerinin e-posta veya WhatsApp üzerinden gönderilip gönderilmeyeceği
- Yönetim panelini kaç kişinin kullanacağı
- Ürün görsellerinin kim tarafından sağlanacağı