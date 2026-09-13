# Component Envanteri — Takı E-Ticaret Sitesi

> Bu envanter, `docs/DESIGN_DIRECTION.md`'de tanımlanan "Açık Alan" yönünü uygulamak için gereken component'leri listeler. brand-ui (tasarım/davranış) ve storefront (shadcn/ui eşleşmesi/implementasyon notu) tarafından birlikte hazırlanmıştır. Bu bir kod belgesi değildir — henüz hiçbir component oluşturulmamıştır; storefront implementasyona geçtiğinde bu envanteri referans alır.
>
> Component 17-18 yalnızca ana sayfanın editorial/koleksiyon-tanıtım bölümüne özgüdür; genel ürün listeleme/kart component'lerinden implementasyon düzeyinde tamamen izoledir (bkz. "İzolasyon Notu").

| # | Component | Amaç | Açık Alan'a özgü not | State'ler | shadcn/ui eşleşmesi |
|---|---|---|---|---|---|
| 1 | Button | Genel eylem butonu | Çerçevesiz/minimal ilkeyle uyumlu sade varyantlar | default/hover/focus/disabled/loading | Direkt (shadcn `Button`) |
| 2 | ProductCard | Ürün listeleme birimi | Çerçevesiz, yalnızca gerçek ürün fotoğrafı (D012) + altında minimal metin; hover'da yalnızca metin belirginleşir, görsel sabit | default/hover/focus-visible (**zorunlu** — çerçevesiz tasarımda görünür klavye odağı olmadan a11y riski oluşur) | Uyarlanmış — shadcn `Card` KULLANILMAZ (varsayılan border/gölge "çerçevesiz" hedefiyle çelişir); düz Tailwind + `next/image` ile sıfırdan |
| 3 | ProductGallery | Ürün detay görsel akışı | Tek sütun, büyük görsel; sıralı akış | scroll pozisyonu, opsiyonel nokta göstergesi | Uyarlanmış — carousel kütüphanesi değil, native CSS `scroll-snap` (JS'siz, mobilde native swipe) |
| 4 | AttributeButtonGroup | Varyant/öznitelik seçimi | Renk swatch yerine düz metin buton (ör. "Gümüş") | default/selected/disabled (stokta yoksa — commerce'ten `availability` bilgisi gerektirir) | Uyarlanmış (shadcn `ToggleGroup`, Radix tabanlı tek-seçim; doğru `aria-pressed` semantiği için `Button` yerine bu tercih edildi) |
| 5 | QuantityStepper | Sepette/detayda adet seçimi | Sade, minimal ikon | min/max-reached, disabled (stok yok), loading (async sepet güncelleme) | Uyarlanmış (shadcn `Button` ikon varyantı + `Input` kompozisyonu) |
| 6 | CartLineItem / CartSummary | Sepet satırı/özeti | Çerçevesiz tutarlılık — `Card` içine alınmaz, boşluk/`Separator` ile gruplanır | loading (güncelleme), hata (stok yetersiz) | Özel kompozisyon (shadcn `Separator` + `Skeleton`) |
| 7 | Header/Footer/MobileNav | Navigasyon iskeleti | Sepet badge sayaç geçişi sade, sıçramalı animasyon yok (tek/tekrarsız motion ilkesi) | açık/kapalı (mobil drawer), scroll durumu | Uyarlanmış (shadcn `NavigationMenu` + `Sheet` + `Button`) |
| 8 | Breadcrumb | Sayfa içi konum | Minimal, dekoratif eyebrow değil | — | Direkt (shadcn `Breadcrumb`) |
| 9 | FormInput / FormField | Checkout/form girişleri | 44px min dokunma hedefi, net hata mesajı ilişkilendirmesi (aria) | default/focus/error/disabled | Direkt (shadcn `Form` + react-hook-form/zod + `Input`/`Label`/`FormMessage`) |
| 10 | CheckoutStepper | Checkout adım göstergesi | Sade, minimal görsel dil | upcoming/current/completed/error | Özel, düşük karmaşıklık (elle yazılmış, kütüphane gerekmez) |
| 11 | PaymentMethodSelector | Ödeme yöntemi seçimi | Jenerik radio/card, Shopier'e özgü görünüm YOK (D009/D010) | default/selected/disabled | Uyarlanmış (shadcn `RadioGroup`, kart/satır stilize) |
| 12 | OrderStatusBadge | Sipariş durumu göstergesi | Sade badge, dekoratif değil | durum başına 1 varyant (İptal/İade dahil) | Direkt (shadcn `Badge`) — **kısıt:** yalnızca commerce'in `orderStatus`'undan render edilir, ham `paymentStatus`'tan değil (bkz. `docs/ARCHITECTURE.md` §3); durum→etiket eşlemesi lookup tablosundan gelir |
| 13 | Modal / Drawer | Mobil sepet, detay modalı vb. | Minimal, ürünün önüne geçmeyen giriş/çıkış | açık/kapalı | Direkt (shadcn `Dialog` + mobil için `Sheet`) |
| 14 | Toast | Başarı/hata/uyarı bildirimi | Sade, tek amaçlı mesaj | success/error/warning | Direkt (shadcn Sonner entegrasyonu) |
| 15 | EmptyState / ErrorState | Boş/hata durumları | İkon/illüstrasyon slotu + başlık + gövde + opsiyonel CTA; sipariş sorgulamada mesaj kasıtlı jenerik (hangi alanın yanlış olduğunu belirtmez — security'nin recommendation'ıyla örtüşür, kesin karar değil) | — | Özel, düşük karmaşıklık |
| 16 | Skeleton / LoadingState | Asenkron yüklenme | İçerik tipine göre şekil | — | Direkt (shadcn `Skeleton`) |
| 17 | EditorialAsymmetricBlock | **Yalnızca ana sayfa** editorial/koleksiyon-tanıtım bloğu | Kontrollü asimetrik kompozisyon (elle kurgulanmış sabit blok düzeni, data-driven per-product boyutlandırma DEĞİL) | — | Özel |
| 18 | FeaturedCollectionSection | **Yalnızca ana sayfa** koleksiyon tanıtım bölümü | 17'yi sarabilir; içinde değişmemiş `ProductCard`'ları "vitrin" amaçlı gösterebilir | — | Özel |
| 19 | PriceDisplay | Fiyat + indirimli fiyat/üstü çizili gösterim | ProductCard/ProductGallery/CartLineItem/CartSummary'de tekrar kullanılan ortak birim | — | shadcn eşleşmesi yok, saf tipografi + custom |
| 20 | ProductInfoAccordion | Açıklama/bakım bilgisi/kargo bilgisi | Yatay Tabs değil dikey Accordion — tek-sütun/mobil-öncelikli akışa daha uygun | açık/kapalı (panel başına) | Direkt (shadcn `Accordion`) |
| 21 | GiftPackagingToggle | Checkout'ta hediye paketi seçimi | Yalnızca seçimi iletir; ücretlendirme mantığı yok — hediye paketinin checkout'a etkisi hâlâ OPEN (`docs/PROJECT_BRIEF.md` Bölüm 10), bu nedenle diğerlerinden farklı bir OPEN bağımlılığı taşır | seçili/seçili değil | Direkt (shadcn `Switch`/`Checkbox`) |

## İzolasyon Notu (17-18)

`EditorialAsymmetricBlock`, içerik prop'larını (görsel(ler), başlık, gövde metni, opsiyonel CTA linki) homepage/editorial içerik kaynağından alır; `Product`/`Variant` nesnesi almaz, `ProductCard`'ın prop şekliyle hiçbir ortak alanı yoktur ve yalnızca ana sayfa route ağacında kullanılır — `/kategori`, `/koleksiyon`, `/urun` listeleme grid'lerinde asla kullanılmaz. Asimetrisi tamamen elle kurgulanmış, sabit sayıda editoryal blok kompozisyonudur; commerce veri modeline "featured/span alanı" eklenmesi ihtiyacına hiç girmez (bu ihtiyaç `docs/DESIGN_DIRECTION.md`'de açıkça iptal edilmiştir). `FeaturedCollectionSection` bu blokları sarabilir ve içinde birkaç standart `ProductCard`'ı değiştirmeden "vitrin" amaçlı gösterebilir — bu, `ProductCard`'ı değiştirmez, yalnızca onu editoryal bir bağlamda tüketir.

## Genel Not

Hiçbir component MVP kapsamı dışına çıkmıyor; 21 component de 14 müşteri sayfası + admin ile tutarlı. Çıkarma önerisi yok. Bu envanter, marka kimliği (OPEN #1/#2) ve final renk/font netleştiğinde değişmeden kalır — yalnızca token değerleri güncellenir, component listesi/davranışı etkilenmez.
