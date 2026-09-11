# Brief Hazırlık Kontrolü — Takı E-Ticaret Sitesi

> Bu belge, `docs/RAW_CLIENT_NOTES.md`, `docs/PROJECT_BRIEF.md`, `docs/OPEN_QUESTIONS.md` ve `docs/DECISIONS.md` dosyalarının tamamının okunmasıyla hazırlanmış son bir hazırlık (readiness) değerlendirmesidir. Yeni bir karar üretmez; yalnızca mevcut belgelerin bir multi-agent geliştirme ekibine devredilmeye ne kadar hazır olduğunu değerlendirir.

---

# 1. Genel Sonuç

## READY WITH CONDITIONS

**Gerekçe:** Proje sahibi iş hedefleri, hedef kullanıcılar, MVP kapsamı/dışı, ödeme yöntemleri, mimari ilkeler (sağlayıcıdan bağımsızlık, idempotency), görsel politikası ve tek admin rolü gibi 17 temel kararı (`docs/DECISIONS.md` D001-D017) kesinleştirmiştir. Bu, ekibin güvenle başlayabileceği sağlam bir temel oluşturur. Ancak kategori/varyant yapısı, kargo detayları, Shopier'in teknik entegrasyon yöntemi, stok rezervasyon politikası ve marka kimliği gibi konular hâlâ **OPEN**'dır. Bu açık konuların **hepsi** için belgelerde önceliklendirme, geçici varsayım ve "hangi modülden önce çözülmeli" bilgisi mevcuttur; hiçbiri ilk geliştirme dalgasını (repo/proje kurulumu, uygulama shell'i, tasarım/asset araştırması, genel component yapısı) durdurmamaktadır. Bu nedenle proje **BLOCKED** veya **NOT READY** değildir; ama tam anlamıyla **READY** da değildir çünkü tasarım, ürün/stok ve ödeme modülleri başlamadan önce hâlâ karara bağlanması gereken gerçek işletme kararları vardır.

---

# 2. Hazırlık Matrisi

| # | Başlık | Durum | Kısa Gerekçe | İlgili Belge/Karar | Ne Zaman Çözülmeli? |
|---|---|---|---|---|---|
| 1 | İş hedefi | **PASS** | Tüm iş hedefleri ham notlardan doğrudan alınmış ve CONFIRMED. | PROJECT_BRIEF Bölüm 3 | — |
| 2 | Hedef kullanıcılar | **PASS** | Misafir müşteri + tek admin rolü kesinleşti. | PROJECT_BRIEF Bölüm 4; DECISIONS D004, D005 | — |
| 3 | MVP kapsamı | **PASS** | Müşteri ve admin özellik listesi ham notlardan birebir, tam CONFIRMED. | PROJECT_BRIEF Bölüm 6 | — |
| 4 | MVP dışında kalanlar | **PASS** | Kapsam dışı liste hem ham notlarda hem proje sahibi onayında net. | PROJECT_BRIEF Bölüm 7; DECISIONS D014 | — |
| 5 | Müşteri alışveriş akışı | **PARTIAL** | Akışın sırası (keşif → varyant seçimi → sepet → guest checkout → ödeme → sipariş no → sorgulama) CONFIRMED; ancak sorgulama adımındaki doğrulama alanı ve hediye paketinin checkout'a etkisi hâlâ açık. | PROJECT_BRIEF Bölüm 5, 10 | Checkout ve sipariş sorgulama modülünden önce |
| 6 | Yönetici akışı | **PARTIAL** | Ürün/stok/sipariş/kargo yönetimi adımları CONFIRMED; Shopier sipariş eşleştirme adımı yöntem netleşmeden somutlaşamıyor (Kabul Kriteri #7 zaten "test edilemez" diye işaretli). | PROJECT_BRIEF Bölüm 5, 9, 18 | Ödeme modülünden önce |
| 7 | Ürün ve kategori gereksinimleri | **PARTIAL** | Öznitelik listesi CONFIRMED; kesin kategori listesi OPEN, ancak esnek/geçici bir kategori yapısı varsayımıyla ilerlemeyi engellemiyor. | PROJECT_BRIEF Bölüm 10; OPEN_QUESTIONS #3 | Tasarım ve ürün modülünden önce |
| 8 | Ürün varyant gereksinimleri | **PARTIAL** | Öznitelik listesi CONFIRMED; kesin varyant şeması (zorunlu/opsiyonel alanlar) OPEN, esnek şema varsayımıyla ilerlenebilir. | PROJECT_BRIEF Bölüm 10; OPEN_QUESTIONS #4 | Ürün/varyant modülünden önce |
| 9 | Stok ve rezervasyon kuralları | **PARTIAL** | Politikanın modülden önce kesinleştirileceği kesin karar (ilke); politikanın kendisi (ne zaman düşülür, bekletme süresi) hâlâ OPEN. Stok tutarsızlığı riski (R1) doğrudan buna bağlı. | PROJECT_BRIEF Bölüm 11, Risk Kaydı R1; DECISIONS D016; OPEN_QUESTIONS #8 | Sipariş/stok modülünden önce |
| 10 | Sipariş yaşam döngüsü | **PARTIAL** | Havale akışı ve durum listesi (İptal/İade dâhil) ASSUMED/CONFIRMED karışımıyla makul biçimde tanımlı; Shopier tarafındaki eşleştirme adımı OPEN. | PROJECT_BRIEF Bölüm 11 | Ödeme ve sipariş/stok modülünden önce |
| 11 | Shopier gereksinimleri | **PARTIAL** | Kullanılacağı, mimariye sıkı bağlanmayacağı ve doğrulanmamış özellik varsayılmayacağı kesin karar; teknik entegrasyon yöntemi bilinçli olarak ödeme modülüne ertelendi. | PROJECT_BRIEF Bölüm 12; DECISIONS D006, D009, D010; OPEN_QUESTIONS #9 | Ödeme modülünden önce (planlı erteleme) |
| 12 | Havale/EFT gereksinimleri | **PARTIAL** | Manuel onay, "ödeme bekliyor" durumu, IBAN placeholder kuralı tam CONFIRMED; yalnızca stok bekletme süresi (madde 9 ile aynı konu) açık. | PROJECT_BRIEF Bölüm 13; DECISIONS D007 | Sipariş/stok modülünden önce |
| 13 | Sağlayıcıdan bağımsız ödeme mimarisi | **PASS** | İlke net ve kesin karara bağlı; somut mimari desen bu aşamada gerekli değil (teknik implementasyon konusu). | PROJECT_BRIEF Bölüm 14; DECISIONS D008 | — |
| 14 | Sipariş/ödeme idempotency gereksinimleri | **PASS** | Sipariş oluşturma ve ödeme işleme için tekrarsızlık kesin karar; risk (R2) ve kabul kriteri (#14) ile bağlanmış. | PROJECT_BRIEF Bölüm 11, 12, 18; DECISIONS D017 | — |
| 15 | Sipariş sorgulama güvenliği | **PARTIAL** | Ek doğrulama zorunluluğu kesin karar (ilke); hangi alanın (e-posta/telefon) kullanılacağı OPEN. | PROJECT_BRIEF Bölüm 16, Risk R3; DECISIONS D015; OPEN_QUESTIONS #12 | Sipariş sorgulama modülünden önce |
| 16 | Yönetim paneli güvenliği | **PARTIAL** | Güvenli giriş ve tek admin rolü CONFIRMED; deneme sınırlandırma/oturum güvenliği yalnızca ASSUMED düzeyinde, resmî bir karar olarak kayıtlı değil. | PROJECT_BRIEF Bölüm 16, Risk R4 | Canlıya çıkmadan önce |
| 17 | Görsel ve medya politikası | **PARTIAL** | Kullanım politikası (AI yasak, gerçek ürün görseli, stok görsel alanları) tam CONFIRMED ve çok net; yalnızca görsellerin kim tarafından tedarik edileceği açık. | PROJECT_BRIEF Bölüm 15; DECISIONS D011-D013; OPEN_QUESTIONS #11 | Ürün modülü ve canlıya çıkıştan önce |
| 18 | Kargo gereksinimleri | **PARTIAL** | Kargo takip kodu ekleme özelliği CONFIRMED; kargo firması, ücreti ve ücretsiz kargo sınırı OPEN (placeholder alanlarla ilerlenebilir). | PROJECT_BRIEF Bölüm 9; OPEN_QUESTIONS #5, #6, #7 | Checkout modülünden önce |
| 19 | SEO ve responsive gereksinimleri | **PARTIAL** | Temel ihtiyaç CONFIRMED, test edilebilir asgari eşikler (375px, title/meta) ASSUMED olarak somutlaştırıldı; performans hedefi (Core Web Vitals) hâlâ tamamen açık ve OPEN_QUESTIONS.md'de ayrı bir madde olarak izlenmiyor. | PROJECT_BRIEF Bölüm 17, 18 (kriter 10-11) | Tasarım/geliştirme sırasında somutlaştırılmalı; performans hedefi canlıya çıkmadan önce |
| 20 | Kabul kriterleri | **PARTIAL** | 14 kriterden 13'ü test edilebilir biçimde yazılmış; kriter #7 (Shopier eşleştirme) yöntem netleşene kadar kasıtlı olarak "test edilemez" işaretli. | PROJECT_BRIEF Bölüm 18 | Ödeme modülünden önce (kriter #7 için) |
| 21 | Açık soruların önceliklendirilmesi | **PASS** | 15 soru 4 önceliğe ayrılmış, her biri gerekçe/varsayım/modül alanlarıyla belgelenmiş, çözülenler DECISIONS.md'ye taşınmış, tekrar yok. | OPEN_QUESTIONS.md (tamamı) | — |
| 22 | Canlıya çıkış bağımlılıkları | **PARTIAL** | İade/değişim kuralları, fatura süreci, hukuki sayfa metinleri ve görsel tedarik süreci doğru şekilde "canlı öncesi" olarak etiketlenmiş; hepsi hâlâ açık ama ilk dalgayı engellemiyor. | PROJECT_BRIEF Bölüm 19; OPEN_QUESTIONS Grup C, #11, #13, #14 | Canlıya çıkmadan hemen önce |

**Özet:** 7 PASS, 15 PARTIAL, 0 BLOCKED.

---

# 3. Şu Anda Geliştirmeyi Engelleyen Konular

Aşağıdaki kriter uygulanmıştır: bir konu yalnızca belirli bir modülden önce çözülmesi yeterliyse buraya alınmamıştır.

**Bu kritere göre, ilk geliştirme dalgasını (repo/proje kurulumu, temel uygulama shell'i, tasarım ve asset araştırması, genel component yapısı) tamamen durduran bir madde bulunmamaktadır.**

Gerekçe: Bölüm 2'deki tüm PARTIAL maddeler, belgelerde zaten kendi geçici varsayımına ve "ilgili modülden önce" etiketine sahiptir (bkz. `docs/OPEN_QUESTIONS.md` grupları ve `docs/DECISIONS.md` D009/D015/D016). Bu, ekibin şimdiden ilerlemesine izin verir; yalnızca **tasarımın nihai hâle gelmesi**, **ürün/stok modülünün tamamlanması** ve **ödeme modülünün tamamlanması** belirli kararları bekler (bkz. Bölüm 5-7).

---

# 4. İlk Geliştirme Dalgasında Güvenle Başlanabilecek İşler

- Repository/proje kurulumu: Next.js + TypeScript + Tailwind CSS + shadcn/ui + PostgreSQL + Prisma iskeleti (teknoloji seti CONFIRMED).
- `.env.example` gibi ortam değişkeni şablonu — yalnızca placeholder anahtar adları, **gerçek IBAN/API anahtarı yok** (D008, Bölüm 16 gizlilik kuralı).
- Temel uygulama shell'i: genel sayfa düzeni (header/footer/navigasyon iskeleti), route yapısı (ana sayfa, koleksiyon, kategori, ürün listeleme/detay, sepet, checkout, sipariş başarı, sipariş sorgulama, iletişim, kargo/teslimat, iade/değişim, gizlilik, mesafeli satış) — hepsi placeholder içerikle.
- Nötr/placeholder bir tasarım sistemi taslağı (renk token'ları, tipografi ölçeği) — marka kimliği geldiğinde değiştirilebilecek şekilde.
- Genel component yapısı: buton, kart, form input, modal, toast vb. temel UI bileşenleri (shadcn/ui üzerinden).
- Guest checkout akışının UI iskeleti (adım adım form yapısı) — ödeme sağlayıcı entegrasyonu olmadan, D004 ve D008 ile uyumlu şekilde sağlayıcıdan bağımsız bir arayüz katmanı olarak.
- Esnek/genişletilebilir ürün-varyant veri modeli **taslağı** (Prisma şema taslağı) — OPEN_QUESTIONS #4 netleşince güncellenecek şekilde açıkça "taslak" olarak işaretlenmeli.
- Admin panel iskeleti: tek admin rolüyle temel giriş ekranı ve dashboard shell'i (D005).
- Tasarım araştırması: takı e-ticaret sitelerinde kabul görmüş UI kalıpları, erişilebilirlik ve mobil düzen desenleri üzerine araştırma.
- Asset araştırması: lisanslı stok görsel kaynaklarının (hero/koleksiyon/editorial/marka hikâyesi alanları için, D013) değerlendirilmesi ve lisans/kaynak kayıt şablonunun hazırlanması.
- Sipariş/ödeme akışları için idempotency ve stok kontrolü gerektiren noktaların (checkout submit, ödeme onayı) kod mimarisinde **yer tutucu olarak** işaretlenmesi (D017) — nihai kural OPEN olsa da idempotent tasarım prensibi şimdiden uygulanabilir.

**Başlatılmaması gerekenler (OPEN karara bağlı):** Shopier entegrasyon kodu, nihai ürün/kategori veri girişi, nihai kargo ücret/limit mantığı, sipariş sorgulama doğrulama alanının kesin implementasyonu, nihai marka/tasarım teslimi.

---

# 5. Tasarım Başlamadan Önce Çözülmesi Gerekenler

- Marka adı (`docs/OPEN_QUESTIONS.md` #1).
- Logo ve kurumsal kimlik — renkler, tipografi (`docs/OPEN_QUESTIONS.md` #2).
- Kesin ürün kategorileri, çünkü site navigasyonu bu yapıya bağlıdır (`docs/OPEN_QUESTIONS.md` #3).

---

# 6. Ürün / Varyant / Stok Modülünden Önce Çözülmesi Gerekenler

- Kesin ürün kategorileri (`docs/OPEN_QUESTIONS.md` #3).
- Kesin ürün varyant yapısı — zorunlu/opsiyonel öznitelikler (`docs/OPEN_QUESTIONS.md` #4).
- Stok düşme/rezervasyon politikası — ne zaman düşülür, havale siparişinde ne kadar bekletilir, süre dolunca ne olur (`docs/OPEN_QUESTIONS.md` #8; `docs/DECISIONS.md` D016; Risk R1).
- Hediye paketi seçeneğinin sipariş sürecine etkisi (PROJECT_BRIEF Bölüm 10).
- Ürün görsellerini kimin sağlayacağı (`docs/OPEN_QUESTIONS.md` #11).

---

# 7. Checkout ve Ödeme Modülünden Önce Çözülmesi Gerekenler

- Shopier'in kullanılabilir teknik entegrasyon yöntemi — gerçek hesapla araştırma (`docs/OPEN_QUESTIONS.md` #9; `docs/DECISIONS.md` D009, D010).
- Kargo firması, kargo ücreti, ücretsiz kargo sınırı (`docs/OPEN_QUESTIONS.md` #5, #6, #7).
- Sipariş sorgulamada kullanılacak ek doğrulama alanının kesin şekli (`docs/OPEN_QUESTIONS.md` #12; `docs/DECISIONS.md` D015).
- Stok düşme/rezervasyon politikasının kesinleşmiş hâli (Bölüm 6 ile ortak bağımlılık — checkout toplam/stok kontrolü bu karara ihtiyaç duyar).

---

# 8. Canlıya Çıkmadan Önce Çözülmesi Gerekenler

- İade ve değişim kuralları (`docs/OPEN_QUESTIONS.md` #13).
- Fatura süreci (`docs/OPEN_QUESTIONS.md` #14).
- Gizlilik politikası ve mesafeli satış sözleşmesinin kesin hukuki metinleri (PROJECT_BRIEF Bölüm 8).
- Ürün görsellerinin gerçekten tedarik edilmiş ve lisans kayıtlarının tutulmuş olması (`docs/OPEN_QUESTIONS.md` #11; DECISIONS D011-D013).
- Yönetici girişi için somut güvenlik önlemlerinin (deneme sınırlandırma vb.) resmî karara bağlanması (PROJECT_BRIEF Bölüm 16, Risk R4 — şu an yalnızca ASSUMED).
- Performans hedefinin (ör. Core Web Vitals eşiği) belirlenmesi (PROJECT_BRIEF Bölüm 17 — şu an OPEN_QUESTIONS.md'de bile ayrı izlenmiyor, bu bir boşluktur).
- Sipariş bildirim kanalının (e-posta/WhatsApp) karara bağlanması, **ya da** MVP'nin bildirimsiz çıkacağının açıkça onaylanması (`docs/OPEN_QUESTIONS.md` #10 — geçici varsayım MVP'de bildirim kurulmaması yönünde).

---

# 9. Multi-Agent Ekibinin Uyması Gereken 10 Değişmez Kural

1. **MVP kapsamını izinsiz büyütmeme.** `docs/PROJECT_BRIEF.md` Bölüm 6/7 ve `docs/DECISIONS.md` D014'te listelenmeyen hiçbir özellik (üyelik, favoriler, yorum, sadakat, gelişmiş kupon, mobil uygulama, uluslararası satış, çoklu para birimi vb.) eklenmez; proje sahibi onayı olmadan kapsam genişletilmez.
2. **Shopier hakkında doğrulanmamış API/webhook özelliği varsaymama.** Hiçbir agent, gerçek Shopier hesabı ve güncel teknik imkânlar araştırılmadan bir Shopier özelliğinin var olduğunu kabul edip kod/tasarım üretemez (D010).
3. **Ödeme sağlayıcısından bağımsız mimari.** Ödeme mantığı, hiçbir agent tarafından Shopier'e (veya başka bir sağlayıcıya) sıkı bağlı, soyutlanmamış şekilde yazılmaz; sağlayıcı katmanı değiştirilebilir kalmalıdır (D008).
4. **Idempotency.** Sipariş oluşturma ve ödeme onaylama akışlarını yazan her agent, tekrarlanan istek/bildirimin ikinci bir sipariş veya stok düşümü yaratmayacağını garanti etmelidir (D017).
5. **Gerçek ürün görselleri.** Ürün kartı ve ürün detay sayfalarında yalnızca satılan gerçek ürüne ait görseller kullanılır; hiçbir stok/placeholder görsel gerçek ürün görseli gibi sunulmaz (D012).
6. **AI ile görsel üretmeme.** Hiçbir agent, ürün veya editorial görseli üretmek için AI görsel üretim aracı (fal.ai, Midjourney, DALL-E vb.) kullanamaz (D011).
7. **Guest checkout.** Müşteri üyeliği/hesap sistemi eklenmez; sipariş süreci yalnızca misafir checkout ile tasarlanır (D004).
8. **Tek admin rolü.** İlk sürümde birden fazla admin rolü/yetki seviyesi tasarlanmaz; admin kimlik doğrulama tek bir temel rol varsayımıyla yazılır (D005).
9. **Gizli bilgileri repoya koymama.** API anahtarı, IBAN, ödeme kimlik bilgisi gibi hiçbir gizli/gerçek bilgi Git deposuna veya koda gömülmez; yalnızca placeholder ve ortam değişkenleri kullanılır (PROJECT_BRIEF Bölüm 16).
10. **OPEN kararları kendi başına kesinleştirmeme.** Hiçbir agent, `docs/OPEN_QUESTIONS.md`'de OPEN olarak işaretli bir konuda (marka adı, kategori, varyant yapısı, kargo, Shopier yöntemi, stok politikası, doğrulama alanı vb.) kendi varsayımını nihai karar gibi uygulamaz; yalnızca belgelenmiş "geçici varsayım"ı kullanır ve kararın hâlâ açık olduğunu koddaki/tasarımdaki bir notla işaretler.

---

# 10. Sonuç

MULTI_AGENT_HANDOFF: YES

FIRST_WAVE_CAN_START: YES

BLOCKERS:
- Yok — ilk geliştirme dalgasını (repo kurulumu, uygulama shell'i, tasarım/asset araştırması, genel component yapısı) doğrudan durduran bir madde bulunmuyor.

DEFERRED_DECISIONS:
- Marka adı, logo, kurumsal kimlik (`docs/OPEN_QUESTIONS.md` #1, #2)
- Kesin ürün kategorileri ve varyant yapısı (`docs/OPEN_QUESTIONS.md` #3, #4)
- Kargo firması, kargo ücreti, ücretsiz kargo sınırı (`docs/OPEN_QUESTIONS.md` #5, #6, #7)
- Stok düşme/rezervasyon politikasının kesin içeriği (`docs/OPEN_QUESTIONS.md` #8; `docs/DECISIONS.md` D016)
- Shopier'in teknik entegrasyon yöntemi (`docs/OPEN_QUESTIONS.md` #9; `docs/DECISIONS.md` D009, D010)
- Sipariş bildirim kanalı (`docs/OPEN_QUESTIONS.md` #10)
- Ürün görsel tedarik kaynağı (`docs/OPEN_QUESTIONS.md` #11)
- Sipariş sorgulama ek doğrulama alanının kesin şekli (`docs/OPEN_QUESTIONS.md` #12; `docs/DECISIONS.md` D015)
- İade/değişim kuralları ve fatura süreci (`docs/OPEN_QUESTIONS.md` #13, #14)
- Shopier sonrası alternatif ödeme sağlayıcısı (`docs/OPEN_QUESTIONS.md` #15)
- Yönetici girişi için somut güvenlik önlemleri ve SEO/performans hedefinin somutlaştırılması (PROJECT_BRIEF Bölüm 16, 17 — resmî karar olarak henüz kayıtlı değil)
