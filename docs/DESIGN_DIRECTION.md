# Tasarım Yönü — Takı E-Ticaret Sitesi

> Bu belge, brand-ui ve storefront'un birlikte hazırladığı, proje sahibinin bu oturumda onayladığı tasarım yönünü tanımlar. Kesin doğruluk kaynağı her zaman `docs/PROJECT_BRIEF.md`, `docs/OPEN_QUESTIONS.md`, `docs/DECISIONS.md`'dir; bu belge onlarla çelişirse kaynak belgeler esastır.

> **DURUM: PROVISIONAL (geçici).** Bu belge **final marka kimliği değildir**. Marka adı (OPEN #1), logo ve final kurumsal kimlik/final renk/final font ailesi (OPEN #2) hâlâ açıktır. Buradaki tüm görsel değerler (renk, tipografi, spacing) semantic token yaklaşımıyla placeholder olarak uygulanır; final kimlik geldiğinde yalnızca token tanım katmanı güncellenir, bu belgedeki yapısal/davranışsal kararlar (grid mantığı, component davranışı, motion ilkesi) değişmeden kalabilir.

## Onay Durumu

**CONFIRMED (bu oturumda proje sahibi tarafından onaylandı):**
- Genel tasarım yönü: **"Açık Alan"** — editorial/tonal minimalizm, ürün odaklı, bol whitespace.
- Ek kapsam: Yalnızca ana sayfanın editorial/koleksiyon-tanıtım bölümlerinde kontrollü asimetrik kompozisyon kullanılabilir (bkz. "Asimetri Eklentisinin Sınırı").
- Ürün listeleme grid'i, ürün kartı ve commerce veri modeli "Açık Alan"ın orijinal (simetrik/düzenli) mantığında kalır; değerlendirilen alternatif "Kesişim" yönünün asimetrik grid'i veya "featured/span" veri ihtiyacı burada **uygulanmaz**.

**OPEN (hâlâ açık, bu belge kapatmaz):**
- Marka adı (#1), logo ve final kurumsal kimlik (#2) — bkz. `docs/OPEN_QUESTIONS.md`.
- Final renk paleti, final font ailesi — bu belgedeki renk/tipografi tanımları yalnızca placeholder/örnek niteliğindedir.
- Kesin ürün kategorileri (#3), varyant yapısı (#4) — bu yöndeki component'ler bunlardan bağımsız, esnek tasarlanmıştır.

## Açık Alan — Tam Tanım

**CORE IDEA:** Dergi sayfası gibi okunan, bol beyaz alanlı, sakin bir editoryal düzen; takı "hikâye" içinde, fotoğraf ve tipografi birlikte bir "an" yaratır.

**VISUAL CHARACTER:** Simetrik/klasik editoryal grid, bol serbest whitespace; köşeler minimal, tek tutarlı radius değeri.

**TYPOGRAPHY APPROACH:**
- **display:** ince, yüksek kontrastlı bir serif (dergi başlığı hissi) — kalın/dekoratif değil, sakin; aşırı lüks kuyumcu hissinden bilinçli kaçınma. *(Font ailesi placeholder — final font OPEN #2.)*
- **body:** serif ile net ayrışan orta ağırlıkta bir sans, biraz geniş line-height. *(Placeholder.)*
- **utility:** body sans'ın küçük puntolu, normal-case versiyonu; all-caps kullanılmaz.

**COLOR APPROACH:** Sıcak olmayan, soğuk/nötr gri-beyaz taban (altın/bej kuyumcu hissinden bilinçli kaçınma) + yumuşak antrasit metin; vurgu neredeyse yok, yalnızca CTA'da tek, sakin bir ton. **Tüm renk değerleri placeholder'dır** (semantic token: `--color-surface`, `--color-text-primary`, `--color-accent` vb.); final renk OPEN #2 netleşince yalnızca token değerleri güncellenir.

**HERO APPROACH:** Tam genişlik, atmosferik/bağlamsal bir editoryal görsel (lisanslı stok görsel — yalnızca `hero` kullanım alanı, D013), üstünde çok az metin; CTA görselin dışında, altında sakin durur.

**PRODUCT CARD:** Çerçevesiz, yalnızca gerçek ürün fotoğrafı (D012) + altında minimal metin bloğu (ad, fiyat); kartlar çizgi yerine boşlukla ayrılır; hover'da yalnızca metin bloğu hafifçe belirginleşir, görsel değişmez. **Bu mantık ana sayfa dışındaki tüm ürün listeleme yüzeylerinde (koleksiyon, kategori, arama) değişmeden uygulanır.**

**COLLECTION SECTION:** Ürün listeleme sayfalarında düzenli/simetrik, tekrar kullanılabilir grid (ör. 2-3-4 sütun breakpoint'e göre) — asimetri yok. Ana sayfadaki editorial/koleksiyon-tanıtım blokları ayrı bir component ailesi olarak ele alınır (bkz. `docs/COMPONENT_INVENTORY.md` #17-18).

**PRODUCT DETAIL:** Görsel dikeyde büyük, tek sütun akış (masaüstünde geniş tek sütun + yanında dar sabit satın alma bloğu); attribute picker'da renk swatch yerine düz metin buton (ör. "Gümüş").

**MOBILE APPROACH:** Tek sütun zaten doğal mobil davranışı; hero'daki görsel-metin oranı korunur; attribute seçenekleri en az 44px yükseklikte düz metin buton.

**MOTION APPROACH:** Sayfa başına yalnızca bir tane, çok yumuşak scroll-triggered fade-in, tekrarlanmaz; ürünün önüne geçen bir animasyon yoktur.

## Asimetri Eklentisinin Sınırı (kesin kapsam)

Proje sahibinin onayladığı tek ek: **yalnızca ana sayfanın editorial/koleksiyon-tanıtım bölümlerinde** kontrollü asimetrik kompozisyon (ör. iki farklı genişlikte içerik bloğu yan yana — değerlendirilen "Kesişim" yönünden ödünç alınan bir düzen fikri).

**Bu eklenti şunları KAPSAMAZ (kesinlikle uygulanmaz):**
- Ürün listeleme/koleksiyon/kategori sayfalarındaki gerçek commerce grid'i — bu her zaman "Açık Alan"ın düzenli/simetrik mantığında kalır.
- Ürün kartı tasarımı veya davranışı — değişmez.
- Commerce veri modeline "featured/öne çıkan" veya "grid span" gibi yeni bir alan eklenmesi — bu ihtiyaç burada yoktur, iptal edilmiştir.
- Ana sayfa dışındaki hiçbir sayfa.

Bu ayrım storefront ile netleştirilmiştir: asimetrik editorial bloklar, ürün grid component'lerinden implementasyon düzeyinde tamamen izole, ayrı bir component ailesi olarak ele alınır — bkz. `docs/COMPONENT_INVENTORY.md` "İzolasyon Notu".

## İlgili Belgeler

- Component'lerin tam listesi ve shadcn/ui eşleşmeleri için `docs/COMPONENT_INVENTORY.md`.
- Değerlendirilen 3 yön ve puanlama için bu oturumun planlama geçmişi (brand-ui + storefront, `frontend-design` skill kullanılarak üretildi).
- Görsel politikası (D011-D013), varyant/kategori esnekliği (OPEN #3/#4) ve genel mimari sınırlar için `docs/ARCHITECTURE.md`.

---

## Ek: Storefront Redesign Spesifikasyonu (Video 08 — görsel audit sonrası)

> Bu bölüm, gerçek uygulamanın production build ekran görüntüleri üzerinden yapılan görsel audit'in (KEEP/CHANGE/REMOVE/ADD raporu) tespit ettiği kök sorunları (üç farklı kapsayıcı genişliği, zayıf tipografi hiyerarşisi, tutarsız ürün kartı oranı) çözmek için storefront'un uygulayacağı somut, doğrudan uygulanabilir değerleri tanımlar. Yukarıdaki "Açık Alan" tanımını **değiştirmez**, onu somutlaştırır. Marka adı/logo/final renk/final font hâlâ OPEN #1/#2 — bu bölümdeki hiçbir değer final marka kararı değildir.

### Konteyner (kök sorun düzeltmesi)

Audit'te header (x≈410), footer (x≈406) ve sayfa içeriğinin (x≈500) üç farklı kapsayıcı kullandığı tespit edildi. **Tek bir paylaşılan kapsayıcı deseni** zorunludur — header, footer ve her sayfanın üst seviye wrapper'ı **aynı** class/component'i kullanmalı, sayfa bazlı farklı `max-w-*` değeri kalmamalı:

```
.site-container → mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10 xl:px-16
```

- `max-width: 1400px` (mevcut `max-w-6xl` / 1152px yerine — 1920px ekranda kenarlarda 384px yerine 260px boşluk bırakır).
- Padding skalası: 16px (mobil) → 24px (`sm:` ≥640px) → 40px (`lg:` ≥1024px) → 64px (`xl:` ≥1280px) — geniş ekranlarda kenar boşluğu sabit kalmaz, orantılı büyür.
- Header, footer, `app/page.tsx` ve tüm `app/**/page.tsx` içindeki en dıştaki wrapper bu tek deseni kullanmalı; component/page seviyesinde ayrı bir `max-w-6xl` tanımlanmamalı.

### Tipografi Hiyerarşisi (semantic token, provisional değer)

Font aileleri değişmedi (`--font-display` = Newsreader, `--font-body` = Public Sans, placeholder — final font OPEN #2). Aşağıdaki boyut/ağırlık/satır yüksekliği değerleri mevcut `--font-display`/`--font-body` token'larına bağlı semantic rol olarak tanımlanır; final font geldiğinde yalnızca font-family değişir, bu ölçek kalır.

| Rol | Font | Boyut (mobil → masaüstü) | Ağırlık | Satır yük. | Kullanım |
|---|---|---|---|---|---|
| Hero | display | 2.75rem → 4.5rem | 400 | 1.05 | Ana sayfa hero başlığı |
| Page Title | display | 2rem → 2.5rem | 400 | 1.15 | Sayfa `h1` (Ödeme, Sepetim, kategori/koleksiyon/ürün detay adı) |
| Section Title | display | 1.375rem → 1.625rem | 400 | 1.2 | `h2` (koleksiyon adı, "Öne Çıkan Ürünler") |
| Product Title (kart) | body | 0.875rem → 0.9375rem | 500 | 1.4 | Ürün kartındaki isim — bilinçli olarak display DEĞİL |
| Price | body (tabular) | sm 0.875rem / md 1rem / lg 1.375rem | 500 (sm/md), 600 (lg) | 1.3 | Mevcut `PriceDisplay` size prop'una (`sm`/`md`/`lg`) birebir uyar |
| Body | body | 0.9375rem → 1rem | 400 | 1.6 | Paragraf metni |
| Metadata | body | 0.75rem → 0.8125rem | 400–500 | 1.4 | Breadcrumb, badge, "yakında" etiketi, caption — all-caps yok |

### Spacing Skalası

- Kart/görsel-metin arası (component içi): 0.75rem.
- Ürün grid boşluğu: yatay 1rem, dikey 2.5rem (mevcut `gap-x-4 gap-y-10` korunur).
- Bölüm içi üst boşluk (breadcrumb→başlık→içerik): 1.5–2rem.
- Bölümler arası ritim (ana sayfa): mobil 4rem → masaüstü (`lg:` ≥1024px) 6rem — şu anki sabit `gap-20` (80px, tüm breakpoint'lerde aynı) yerine responsive skala; mobilde daha sıkı, masaüstünde geniş konteynerle orantılı kalır.
- Sayfa üst/alt padding: `py-10` (mobil) → `lg:py-16` (masaüstü).

### Ürün Kartı Oranı — KARAR: kare (1:1), mevcut implementasyon korunur

Elimizdeki gerçek ürün görsellerinde üç farklı kaynak oranı var (dikey ~0.67–0.75, kare ~1.0, yatay ~1.33–1.5). **Kare (1:1) seçildi ve gerekçesi:**
1. Zaten uygulanmış durumda (`ProductCard`/`ProductGrid` `aspect-square`) — sıfırdan değişiklik gerektirmiyor.
2. En temiz gerçek görsel adayımız (`kolye_gercek_04.webp`, gümüş kalp kolye ucu) doğal olarak kareye yakın ve güvenle kırpılabilir.
3. Yatay kaynaklı iki yüzük adayı (`yuzuk_gercek_10.jpg`, `yuzuk_gercek_12.webp`) karede güvenle kullanılabilir **ancak** ürün karede merkezde değil solda/sol-ortada olduğu için `object-position: center` yerine `object-position: 30% center` (yaklaşık, dosyaya göre ince ayar gerekir) kullanılmalı — aksi halde merkezden kırpma ürünü kadraj dışına itebilir.
4. Değişken oranlı (masonry tarzı) kart, audit'in işaretlediği "default component hissi"ni artırma riski taşıyan ek bir karmaşıklık katmanı; tek oran grid tutarlılığını korur.

**Ürün galerisi (detay sayfası) — GÜNCELLENDİ (Video 08 final review sonrası):** İlk önerilen `object-contain` + sabit kare çerçeve, uygulamada yatay kaynaklı görsellerde (ör. yüzük fotoğrafları) üstte/altta çok büyük, "render hatası" gibi okunan boş bant bırakan bir letterbox sorunu yarattı (bkz. Video 08 final review raporu). Karar revize edildi: galeri container'ının **sabit bir aspect-ratio'su olmamalı**; görsel `width: 100%; height: auto` ile kendi doğal (intrinsic) oranında render edilir — kırpma da yok, gereksiz boşluk da yok. Aşırı dikey kaynaklı bir görsel sayfayı çok uzatmasın diye yalnızca bir güvenlik sınırı: `max-height: 85vh` + bu sınıra takılan istisnai durumlarda `object-fit: contain`. `object-cover`'a dönmek D012 riski (ürünün bir kısmının kadraj dışına taşması) nedeniyle reddedildi.

### Renk / Yasaklar (mevcut token sistemiyle tutarlılık teyidi)

`app/globals.css`'teki mevcut soğuk/nötr oklch token sistemi **korunur**, değişmiyor. Audit'te işaretlenen kalıpların hiçbiri yeniden eklenmemeli: gradient, glassmorphism/backdrop-blur, altın-bej ağırlıklı renk, aşırı pembe zemin, "her şeyi border'a alma" (ürün kartı/görsel kapsayıcılar çerçevesiz kalır — yalnızca gerçek interaktif/etiket öğeleri `rounded-full` kullanır, bkz. önceki audit raporu). `--radius` (0.375rem) değişmedi.

### Galeri/Hero Oranları ve Mobil Davranış

- Hero: mevcut `aspect-[16/9] sm:aspect-[21/9]` korunur; ancak hero görseli merkezde değil, `object-position` ile bilinçli olarak bir kenara (ör. `right center` veya `70% center`) yaslanmalı — tek, sade bir ürün görseli geniş bir banda merkezden büyütülürse minik/kayıp görünür, kenara yaslanmış kompozisyon + boş tarafta başlık/CTA, "Açık Alan"ın restraint ilkesine daha uygun bir çözümdür.
- Galeri: sabit oran yok, görsel doğal oranında (`height: auto`) render edilir + `max-height: 85vh` güvenlik sınırı (yukarıda gerekçelendirildi, Video 08 revize kararı), çerçeve/kart görünümü yok.
- Mobilde konteyner/tipografi/kart davranışı zaten audit'te temiz bulundu (bkz. önceki rapor) — mobil için ek bir değişiklik gerekmiyor, yalnızca yukarıdaki responsive padding/spacing skalası mobil değerlerini (16px padding, 4rem bölüm arası) zaten koruyor.

---

## Ek: Admin Panel Redesign Spesifikasyonu (Video 08 — Step 3)

> Bu bölüm yalnızca `/admin` route'larını kapsar; storefront'un "Açık Alan" tanımını değiştirmez. **Kritik ayrım: admin, storefront'un editorial serif dilini taklit etmez.** Admin, shadcn dashboard yaklaşımını referans alan (birebir kopyalamayan) sans-ağırlıklı, kompakt, veri-yoğun bir back-office arayüzüdür. Marka adı/logo/final renk hâlâ OPEN #1/#2 — placeholder kalır.

### Renk/Yüzey Token Kararı: AYRI ÖLÇEK DEĞİL, storefront'un mevcut oklch tabanının admin-scoped uzantısı

Admin için sıfırdan bir renk sistemi kurmuyoruz. Gerekçe: aynı marka/aynı ürün ailesi için iki farklı nötr taban tanımlamak (storefront'un soğuk gri-beyazı vs. admin'in kendi grisi) tutarsızlık riski taşır ve token sayısını gereksiz ikiye katlar. Bunun yerine admin, `app/globals.css`'teki **aynı temel token'ları** (`--background`, `--foreground`, `--border`, `--surface`, `--surface-muted`, `--muted-foreground`, `--primary`) tüketir; yalnızca admin'e özgü **3 yeni semantic token** eklenir (`--success`, `--warning` — storefront'ta karşılığı yoktu çünkü storefront'ta trafik-ışığı durum göstergesi gerekmiyordu) ve `--danger` mevcut `--destructive`'e alias'lanır (yeni bir kırmızı icat edilmez).

| Admin token | Kaynak | Değer (yeni olanlar) | Kullanım |
|---|---|---|---|
| `background` | `var(--background)` | — | Sayfa zemini |
| `surface` | `var(--surface)` | — | Kart/panel/tablo zemini |
| `surface-muted` | `var(--surface-muted)` | — | Tablo header, zebra satır, dropzone zemini |
| `border` | `var(--border)` | — | Kart/tablo/input kenarlığı |
| `foreground` | `var(--foreground)` | — | Birincil metin |
| `muted` | `var(--muted-foreground)` | — | İkincil metin (etiket, yardımcı metin, tablo header metni) |
| `accent` | `var(--primary)` | — | Aktif nav öğesi, link, focus, "nötr ilerleme" durum rozeti (ör. Hazırlanıyor/Kargoya Verildi) |
| `success` | yeni | `oklch(0.55 0.14 150)` | Olumlu durum (Teslim Edildi, Onaylandı, Yayında) |
| `warning` | yeni | `oklch(0.75 0.15 80)` | Bekleyen/dikkat gerektiren durum (Ödeme Bekliyor, Stokta Tükenen) |
| `danger` | `var(--destructive)` alias | — | Olumsuz durum (İptal, Başarısız) |

Bu token'lar `app/globals.css`'e `--admin-*` önekiyle değil, doğrudan yukarıdaki genel adlarla eklenmeli (ör. `--success`, `--warning`) — storefront bunları hiç tüketmediği için çakışma riski yok, ayrı bir `.admin` scope/wrapper class'a gerek yok.

### Status Badge Haritası

Üç durum ailesi **görsel olarak birbirinden ayrılmalı** (aynı badge bileşeni, farklı token + farklı varyant):

**`OrderStatus`** (dolu/solid pill, ikon var, 6 değer):
| Değer | Token | Etiket |
|---|---|---|
| `PAYMENT_PENDING` | warning | Ödeme Bekliyor |
| `PREPARING` | muted (nötr gri) | Hazırlanıyor |
| `SHIPPED` | accent | Kargoya Verildi |
| `DELIVERED` | success | Teslim Edildi |
| `CANCELLED` | danger (dolu) | İptal Edildi |
| `RETURNED` | danger (soft/outline varyant — CANCELLED ile aynı solid tonu kullanmaz, karıştırılmamalı) | İade Edildi |

**`PaymentStatus`** (D026 gereği bu dalgada salt-okunur — badge **outline/ghost varyant**, ikon yok, `cursor: default`, hover efekti yok; OrderStatus'un dolu pillerinden kasıtlı olarak daha "sessiz" görünmeli ki tıklanabilir hissi vermesin):
| Değer | Token | Etiket |
|---|---|---|
| `PENDING` | warning (outline) | Bekliyor |
| `CONFIRMED` | success (outline) | Onaylandı |
| `FAILED` | danger (outline) | Başarısız |

**`ProductStatus`** (dolu pill, ikon opsiyonel):
| Değer | Token | Etiket |
|---|---|---|
| `DRAFT` | muted | Taslak |
| `PUBLISHED` | success | Yayında |
| `ARCHIVED` | muted (Archive ikonuyla, `lucide-react`) | Arşivlendi |

Badge anatomisi: `h-6 px-2.5 rounded-full text-xs font-medium` + solid varyantta arka plan `color/10` opaklık + metin tam doygunlukta token rengi (ör. `bg-warning/10 text-warning`), outline varyantta `border border-{token}/30 text-{token} bg-transparent`.

### Tipografi (sans ağırlıklı, storefront'un serif'inden bağımsız)

| Rol | Boyut | Ağırlık | Satır yük. | Kullanım |
|---|---|---|---|---|
| Page Title | 1.5rem (24px) | 600 | 1.3 | Sayfa `h1` ("Ürünler", "Siparişler") — topbar'da TEKRARLANMAZ (aşağıya bkz.) |
| Section Title | 1.125rem (18px) | 600 | 1.4 | Form bölüm başlığı, dashboard panel başlığı ("Son Siparişler") |
| Table Header | 0.75rem (12px) | 500 | 1.4 | Tablo sütun başlığı — normal case, `muted` renk, all-caps YOK (uppercase, shadcn dashboard konvansiyonunda da zorunlu değil) |
| Table Cell | 0.875rem (14px) | 400 (metin) / 500 (sayısal/para) | 1.4 | Tablo satırı; sayısal hücreler `tabular-nums` + sağa hizalı |
| KPI Value | 1.875rem (30px) | 600 | 1.2 | Dashboard KPI kart rakamı, `tabular-nums` |
| KPI Label | 0.8125rem (13px) | 500 | 1.3 | KPI kart etiketi — normal case, eyebrow/all-caps değil |
| Yardımcı metin | 0.8125rem (13px) | 400 | 1.4 | Form hint, empty state açıklaması |

Font ailesi: `--font-body` (Public Sans, placeholder) tüm admin'de kullanılır; `--font-display` admin'de **hiç kullanılmaz** — mevcut dashboard H1/KPI rakamlarındaki serif kullanımı kaldırılmalı, bu Step 1 audit'in işaretlediği hatanın doğrudan düzeltmesidir.

### Yoğunluk / Spacing ("comfortable/professional SaaS")

- Tablo satır yüksekliği: 48px.
- Tablo hücre padding: dikey 12px, yatay 16px.
- Kart/panel iç boşluk: 20px (küçük kart, ör. KPI) — 24px (büyük panel, ör. form section card).
- Bölümler arası ritim (dashboard panelleri arası, sayfa header→içerik arası): 24–32px.
- Form alanları arası: aynı bölüm içinde 20px, bölümler (kart) arası 32px.
- Bu, storefront'un `gap-20`/`py-16` seviyesinden belirgin şekilde daha sıkı; ama tabloyu/formu birbirine yapıştırmaz.

### Layout Ölçüleri

- **Sidebar genişliği:** 248px. Üstte 64px'lik bir marka/başlık bandı: 32px'lik nötr tonlu (surface-muted zemin, accent renkli tek harf) bir monogram kare + "[Marka Adı] Admin" (14px/600) — bugün sidebar'da hiç marka alanı yok, bu Step 1 audit'in bir diğer maddesiydi. Nav öğeleri: 40px yükseklik, `lucide-react` ikon (18px) + etiket (14px/500), aktif öğe: `accent/10` arka plan + `accent` metin + solda 3px `accent` şerit. İkon eşlemesi: Dashboard→`LayoutDashboard`, Ürünler→`Package`, Kategoriler→`FolderTree`, Koleksiyonlar→`Layers`, Siparişler→`Receipt`, Ayarlar→`Settings`.
- **İçerik max-width:** 1520px (1400–1600 aralığının ortası — storefront'un 1400'ünden bilinçli olarak biraz geniş, çünkü admin tabloları storefront'un editoryal içeriğinden daha fazla yatay alana ihtiyaç duyar). Bu değer, audit'in "dashboard içeriği ~420px'te bitiyor" bulgusunu (içerik container'ı stretch olmuyor) VE "tablolar 1900px'e yayılıyor" bulgusunu (container hiç yok) aynı anda çözer — tek, tutarlı bir üst sınır.
- **Padding skalası:** 24px (temel) → 32px (`≥1280px`).
- **Topbar yüksekliği:** 56px. İçeriği: solda breadcrumb (13px, `muted`) — **sayfa başlığının birebir tekrarı DEĞİL** (audit'in "topbar adı = H1" bulgusunun düzeltmesi, topbar artık konum bilgisi verir, başlık tekrarlamaz); sağda arama ikonu (opsiyonel, bu dalgada pasif olabilir) + admin kullanıcı menüsü (baş harf rozeti, ör. "A", 32px daire).

### Tablo Deseni

- **Sütun genişlik stratejisi:** eşit paylaşım (`table-fixed` + %) YOK, içerik-boyutlu (`width: auto`, kısa sütunlarda `white-space: nowrap`). Yalnızca BİR sütun (birincil tanımlayıcı — ürün adı, müşteri adı) `flex-grow`/kalan alanı doldurur. Örnek (Sipariş tablosu): Sipariş No `min-content` (~120px, mevcut ~450px'in düzeltmesi) · Müşteri flex-grow · Tarih ~110px sabit · Durum (badge) ~140px sabit · Tutar ~110px sabit sağa hizalı `tabular-nums` · İşlemler ~64px sabit sağa hizalı (kebab menü ikonu).
- **Sayısal/parasal hizalama:** her zaman sağa hizalı, `tabular-nums`, 500 ağırlık — audit'in "sola hizalı" bulgusunun düzeltmesi.
- **Satır davranışı:** tüm satır tıklanabilirse `hover:bg-surface-muted` + `cursor-pointer` + satır sonunda sabit bir `ChevronRight` (16px, `muted`) ikonuyla tıklanabilirlik açıkça belirtilir (yalnızca hover rengine güvenilmez).
- **Boş durum:** ikon (`lucide-react`, 32px, `muted`) + başlık (Section Title ölçeği) + tek satır açıklama + varsa birincil aksiyon butonu (ör. "Ürün Ekle").
- **Mobilde (`<768px`):** tablo klasik satır/sütun olarak KALMAZ, her kayıt bağımsız bir kart'a dönüşür: üst satırda kimlik (ör. Sipariş No) + durum rozeti yan yana, ikinci satırda ikincil bilgi (müşteri/tarih), sağ altta tutar — audit'in "mobilde başlık/sipariş no çok satıra bölünüyor" bulgusunun doğrudan çözümü (yatay scroll'a zorlamak yerine dikey karta geçiş).

### Form Deseni (Ürün Oluştur/Düzenle)

İki sütunlu düzen, `max-w-[1200px]` içinde: **sol/ana sütun (~2fr)** — Temel Bilgiler, Görseller, Varyantlar, Ürün Detayları (açıklama/bakım) kartları sırayla; **sağ/yan sütun (~1fr, ~360px)** — Organizasyon (kategori/koleksiyon), Fiyat, Stok, Yayın Durumu kartları. Bu ayrım rastgele değil: sol sütun "içerik girme" işi (uzun, çok alanlı), sağ sütun "meta/karar" işi (kısa, hızlı referans) — Shopify/benzeri commerce admin'lerin yerleşik, işlevsel bir kalıbı, kopya bir "SaaS kit" değil.

Her bölüm bir **kart**: `surface` zemin, `border`, `rounded-lg` (0.5rem, admin'de storefront'tan farklı olarak hafif daha belirgin bir radius kabul edilebilir çünkü kart burada gerçek bir işlevsel gruplama sınırı, dekorasyon değil), kart başlığı (Section Title, 18px/600) + ince bir `border-b` ayracı + 24px iç boşluk.

**Kaydet/Yayınla aksiyonları:** formun en altına gömülmez — sayfa header'ının sağında, Page Title'ın yanında sabit durur ("Taslak Olarak Kaydet" secondary + "Yayınla" primary buton), uzun formda scroll etmeden her zaman erişilebilir. Dar viewport'ta (`<768px`) aynı aksiyonlar ek olarak ekranın altına sabitlenen (`sticky bottom-0`) ikinci bir bar'da tekrarlanır.

**Dosya yükleme (Görseller bölümü):** native `<input type="file">` görsel olarak GİZLENİR (erişilebilirlik için DOM'da kalır, `sr-only`), yerine tıklanabilir bir dropzone gösterilir: `border-2 border-dashed border-border rounded-lg bg-surface-muted`, ortada `ImagePlus` ikonu (24px, `muted`) + "Görsel yükle veya sürükleyip bırakın" (13px, `muted`) + "PNG, JPG — maks. 5MB" (yardımcı metin) — audit'in "stilsiz native Choose File" bulgusunun düzeltmesi.

### KPI Kart Anatomisi

Yatay düzen: solda 40px yuvarlak-köşeli (`rounded-md`) ikon kutusu (`surface-muted` zemin, 20px `lucide-react` ikon — nötr KPI'larda `muted`/`accent` renk, uyarı niteliğindeki KPI'larda `warning` renk) + sağda dikey stack (KPI Value üstte, KPI Label altta). **Uyarı ayrımı zorunlu:** "Stokta Tükenen Varyant" gibi bir eylem gerektiren KPI, ikon rengi/arka planı `warning` tonuyla işaretlenmeli ("Toplam Sipariş" gibi nötr bir sayaçla aynı ağırlıkta gösterilmemeli — bu, Step 1 audit'in doğrudan işaret ettiği bir sorundu).

**Kesin yasak:** sahte trend yüzdesi (ör. "+12%") veya sahte/örnek sparkline chart YOK. Gerçek zaman-serisi veri yoksa (bu dalgada yok), KPI kartı yalnızca ikon + değer + etiket içerir, ikinci bir "trend" satırı hiç render edilmez — boş/sahte bir trend göstermek, veri yokmuş gibi göstermekten daha kötü bir güven sorunu yaratır.
