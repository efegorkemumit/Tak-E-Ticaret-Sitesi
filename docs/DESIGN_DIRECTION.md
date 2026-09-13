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
