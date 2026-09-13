# Takı E-Ticaret Domain Sözlüğü

Bu dosya, takı e-ticaret sektöründe genel kabul görmüş kavramları tanımlar. Bu bilgi bu projeye özgü değildir — herhangi bir takı kataloğu için genelde geçerlidir. Projeye özgü kısıtlar için `project-decisions.md` dosyasına bak.

## İçindekiler

1. [Category vs Collection](#category-vs-collection)
2. [Material (Materyal)](#material-materyal)
3. [Plating (Kaplama)](#plating-kaplama)
4. [Color (Renk)](#color-renk)
5. [Stone type (Taş türü)](#stone-type-taş-türü)
6. [Size / Ölçü](#size--ölçü)
7. [Chain length (Zincir uzunluğu)](#chain-length-zincir-uzunluğu)
8. [Product care information (Ürün bakım bilgisi)](#product-care-information-ürün-bakım-bilgisi)
9. [Gift packaging (Hediye paketi)](#gift-packaging-hediye-paketi)

---

## Category vs Collection

Bu iki kavram sık karıştırılır; ayrımı net tutmak navigasyon ve ürün veri modeli için önemlidir.

- **Category (kategori)**: Ürünün *ne olduğuna* dair, genelde tek bir kategoriye ait, kalıcı ve yapısal bir sınıflandırmadır. Takı sektöründe tipik örnekler: Kolye, Yüzük, Bileklik, Küpe, Broş, Halhal, Saat. Bir ürün genellikle **tek** bir ana kategoriye aittir.
- **Collection (koleksiyon)**: Ürünün *hangi hikâyeye/temaya* ait olduğuna dair, pazarlama odaklı, zaman sınırlı olabilen (sezonluk) veya kalıcı olabilen (imza serisi) bir gruplamadır. Tipik örnekler: "Yaz Koleksiyonu", "Nişan Serisi", "Minimal Günlük Koleksiyonu". Bir ürün **birden fazla** koleksiyonda yer alabilir ve koleksiyonlar kategoriler arasında kesişebilir (bir koleksiyonda hem kolye hem yüzük olabilir).
- Pratik sonuç: kategori navigasyon menüsünü ve URL yapısını şekillendirirken, koleksiyon genelde ana sayfa/vitrin/kampanya sayfalarını şekillendirir. İkisi de üründe ayrı, çoktan-çoğa (many-to-many olabilecek) ilişkilerdir; birbirinin yerine geçmez.

> Bu projede kesin kategori listesi henüz OPEN'dır (`docs/OPEN_QUESTIONS.md` #3) — burada verilen örnekler yalnızca sektörde yaygın örneklerdir, bu projenin gerçek kategori listesi değildir.

## Material (Materyal)

Takının ana gövdesini oluşturan fiziksel malzemedir. Yaygın örnekler: gümüş (925 ayar gümüş), pirinç (brass), paslanmaz çelik (stainless steel), altın (has altın oranı ayar ile belirtilir, ör. 14 ayar/18 ayar), bakır alaşımı, zamak.

Materyal, ürünün dayanıklılığını, fiyat segmentini ve bakım gereksinimlerini doğrudan etkiler; bu yüzden genelde bir öznitelik olarak ürün veya varyant seviyesinde tutulur.

## Plating (Kaplama)

Materyalin üzerine uygulanan ince metal kaplamadır; görünen rengi ve parlaklığı belirler ama ana materyalden ayrıdır. Yaygın örnekler: altın kaplama (gold plated), rose gold (roze altın) kaplama, rodyum kaplama (parlak gümüş/beyaz görünüm, çizilmeye karşı koruma), gümüş kaplama.

Kaplama genelde **Color (renk)** özniteliğiyle örtüşür ama kavramsal olarak farklıdır: renk müşteri arayüzünde gösterilen seçim etiketidir (ör. "Altın", "Gümüş", "Rose Gold"), kaplama ise bunun arkasındaki teknik/üretim detayıdır. İkisini aynı alan olarak modellemek (basitleştirme) ya da ayrı tutmak (teknik detay + müşteri etiketi) bir tasarım kararıdır; bu skill hangisinin doğru olduğunu dayatmaz.

## Color (Renk)

Müşteriye gösterilen, genelde kaplama veya taş rengiyle ilişkili seçilebilir bir özniteliktir (ör. Altın, Gümüş, Rose Gold, Siyah, Beyaz). Varyant seçici UI'da en sık kullanılan öznitelik tiplerinden biridir (genelde swatch/renk noktası olarak gösterilir).

## Stone type (Taş türü)

Takıda kullanılan taş veya süsleme malzemesinin türüdür. Yaygın örnekler: zirkon/kübik zirkonya (CZ — sentetik, elmas görünümlü), inci (doğal veya kültür inci), doğal taş (ör. akik, ay taşı), sentetik/cam taş, taşsız (taş içermeyen tasarım).

Taş türü genelde fiyatı ve "hediyelik/günlük kullanım" konumlandırmasını etkiler; bazı ürünlerde bu öznitelik hiç bulunmayabilir (ör. sade zincir bileklik).

## Size / Ölçü

Takı türüne göre farklı ölçü birimleri kullanılır:

- **Yüzük**: Türkiye'de yaygın olarak TR ölçü numarası (ör. 14, 16, 18) veya iç çap (mm) ile ifade edilir. Uluslararası standartlar (US/UK ring size) farklıdır; hangisinin kullanılacağı bu projede henüz netleşmemiştir.
- **Bileklik/Halhal**: Genelde çevre uzunluğu (cm) veya ayarlanabilir aralık (ör. "16-19 cm ayarlanabilir") ile ifade edilir.
- **Küpe**: Genelde tekil bir ölçüsü olmaz ama boyut (uzunluk/çap, mm veya cm) belirtilebilir.

Ölçü, ürüne göre zorunlu olmayabilir (ör. ayarlanabilir bileklik "tek ölçü/one size" olabilir) — bu yüzden ölçü özniteliği her üründe zorunlu değil, ürün türüne bağlı opsiyonel bir alan olarak düşünülmelidir.

## Chain length (Zincir uzunluğu)

Kolye, bileklik gibi zincirli ürünlerde zincirin uzunluğunu ifade eder; genelde cm cinsindendir. İki yaygın model vardır:

1. **Sabit uzunluk**: Tek bir değer (ör. "45 cm").
2. **Ayarlanabilir uzunluk**: Bir aralık (ör. "40-45 cm ayarlanabilir zincir") — bu durumda ürün açıklamasında aralık belirtilir, müşteri genelde bir seçim yapmaz (varyant değil, bilgi alanı olabilir).

Zincir uzunluğunun bir varyant seçeneği mi (müşteri seçer) yoksa yalnızca bilgi alanı mı (sabit, açıklamada yazar) olacağı ürüne ve tasarıma bağlıdır; ikisi de meşru bir modelleme seçimidir.

## Product care information (Ürün bakım bilgisi)

Takının ömrünü uzatmak için müşteriye verilen genel bakım tavsiyeleridir. Sektörde yaygın kalıplar:

- Su, parfüm, losyon ve kimyasallarla temastan kaçının.
- Kullanmadığınızda kapalı bir kutu/kese içinde saklayın.
- Yumuşak bir bezle nazikçe temizleyin; aşındırıcı madde kullanmayın.
- Kaplamalı ürünlerde sürtünme/çizilmeye dikkat edin (kaplama zamanla aşınabilir).
- Havuz/deniz suyuna maruz bırakmayın.

**Önemli:** Bunlar sektörde yaygın *genel* kalıplardır, belirli bir ürüne özgü doğrulanmış iddia değildir. Bir ürün için bakım metni yazılırken bu kalıplar başlangıç noktası olarak kullanılabilir ama "bu ürün suya dayanıklıdır" gibi doğrulanmamış özel bir iddia üretilmemelidir.

## Gift packaging (Hediye paketi)

Müşterinin siparişine eklenebilecek, ürünün hediye görünümünde (kutu, kese, kart vb.) gönderilmesini sağlayan bir seçenektir. Genel olarak iki noktada checkout akışını etkileyebilir:

- **Ek ücret**: Ücretsiz veya ücretli bir hizmet olabilir.
- **Checkout adımı**: Sepette/ürün sayfasında bir seçenek (checkbox/toggle) olarak sunulabilir.

> Bu projede hediye paketinin sipariş sürecine tam olarak nasıl yansıyacağı (ücretli mi, hangi adımda seçiliyor) henüz netleşmemiştir (`docs/PROJECT_BRIEF.md` Bölüm 10). Bu skill bir varsayılan davranış dayatmaz.
