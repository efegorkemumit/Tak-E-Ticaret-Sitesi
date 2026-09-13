---
name: jewelry-commerce
description: Takı e-ticaret domain bilgisi — Product, Category, Collection, Variant, SKU, Price, Stock, Material, Plating, Color, Stone type, Size/ölçü, Chain length, ürün bakım bilgisi ve hediye paketi kavramları için ortak sözlük ve modelleme rehberi. Bu skill'i şu durumlarda MUTLAKA kullan: ürün/kategori/koleksiyon/varyant veri modeli veya şeması tasarlarken, ürün ekleme/düzenleme arayüzü veya admin ürün formu yazarken, varyant seçici (renk/beden/materyal/kaplama) UI'ı kurarken, SKU/fiyat/stok alanlarıyla ilgili bir karar verirken, ya da "takı" "kolye" "yüzük" "bileklik" "küpe" "materyal" "kaplama" "taş türü" "zincir uzunluğu" "ölçü" gibi terimler geçtiğinde — kullanıcı bu skill'i adıyla anmasa bile. frontend-developer, backend-developer (commerce) ve Team Lead agent'ları arasında terim ve kapsam tutarlılığı sağlamak içindir.
---

# Takı E-Ticaret Domain Bilgisi

Bu skill, takı e-ticaret projesinin ürün/katalog domain'ine dair **ortak, tekrar kullanılabilir bilgiyi** tek bir yerde toplar. Amaç, frontend, commerce (backend) ve Team Lead agent'larının aynı terimleri aynı anlamda kullanması ve kimsenin kendi başına yeni bir domain kararı uydurmamasıdır.

**Bu skill bir uygulama/kod üretim skill'i değildir.** Prisma şeması, component veya API route yazmaz; ürün/varyant/kategori kavramlarını doğru ve tutarlı şekilde anlamak/anlatmak için bir referans katmanıdır. Kod veya şema yazma görevi geldiğinde ilgili agent (çoğunlukla commerce/backend-developer) bu skill'in verdiği kavramsal çerçeveyi kullanarak kendi implementasyon kararını verir.

## Önce oku, sonra karar ver

Bir ürün/varyant/kategori sorusuyla karşılaştığında bu sırayla ilerle:

1. **`references/domain-glossary.md`** — Materyal, kaplama, renk, taş türü, ölçü, zincir uzunluğu, ürün bakım bilgisi ve hediye paketi gibi terimlerin genel takı sektörü anlamını ve Category/Collection/Variant/SKU arasındaki farkı buradan öğren.
2. **`references/data-model-guidance.md`** — Bu kavramları bir veri modeline (şema, form, API kontratı) dökerken izlenecek genel prensipleri buradan al. Kesin bir şema *önermez*; esnek/genişletilebilir bir yaklaşımı nasıl koruyacağını anlatır.
3. **`references/project-decisions.md`** — Bu projeye özgü, proje sahibi tarafından onaylanmış kesin kararları (`docs/DECISIONS.md`) ve hâlâ açık olan soruları (`docs/OPEN_QUESTIONS.md`) buradan kontrol et. **Bu dosya diğer ikisinden önceliklidir**: genel domain bilgisiyle proje kararı çelişiyorsa proje kararı geçerlidir.

Bu üç dosya da bir **geçmiş anlık görüntüdür (snapshot)** — kesin karar arıyorsan her zaman kaynak belgeyi (`docs/DECISIONS.md`, `docs/OPEN_QUESTIONS.md`, `docs/PROJECT_BRIEF.md`) açıp doğrula; bu skill onların yerini almaz, okumayı hızlandırır.

## Beş değişmez kural

Bu proje çok-agent'lı bir ekip tarafından geliştiriliyor ve `docs/AGENT_TEAM.md` ile `docs/DECISIONS.md`'de zaten resmî olarak kayıtlı kurallar var. Bu skill onları tekrarlamaz ama domain çalışırken özellikle şunlara dikkat et:

- **Varyant yapısını kendi başına kesinleştirme.** Hangi özniteliğin (materyal, kaplama, renk, taş türü, beden/ölçü, zincir uzunluğu) zorunlu/opsiyonel olacağı henüz OPEN (`docs/OPEN_QUESTIONS.md` #4). Esnek/genişletilebilir bir yapı öner, sabit bir şema dayatma.
- **Stok düşme/rezervasyon politikasını kendi başına kesinleştirme.** Ne zaman düşüleceği/rezerve edileceği henüz OPEN (`docs/OPEN_QUESTIONS.md` #8, `docs/DECISIONS.md` D016). Bu skill bir stok *politikası* önermez.
- **Yeni bir commerce özelliği uydurma.** MVP kapsamı `docs/PROJECT_BRIEF.md` Bölüm 6/7 ve `docs/DECISIONS.md` D014 ile sınırlıdır (ör. üyelik, favoriler, yorumlar, sadakat puanı yok).
- **Ödeme sağlayıcısı implementasyonuna veya Shopier'in teknik detaylarına girme.** Bu, `payment-integration` agent'ının ve ayrı bir araştırma adımının konusudur (`docs/DECISIONS.md` D008-D010); bu skill yalnızca ürün/katalog domain'ini kapsar.
- **Gerçek olmayan ürün görselini gerçek ürün görseli gibi sunma.** Ürün kartı/detayında yalnızca satılan gerçek ürüne ait görsel kullanılır; lisanslı stok görsel yalnızca hero/koleksiyon/editorial alanlarındadır (`docs/DECISIONS.md` D012-D013). Bu görsel yönetimi bir UI konusu olsa da, ürün veri modelinde görsel alanlarını tasarlarken bu ayrımı (ör. `isStockPhoto` gibi bir bayrak ihtiyacı) akılda tut.

## Hızlı kavram özeti

| Kavram | Kısa tanım | Detay |
|---|---|---|
| Category (kategori) | Navigasyonel, genelde tek bir gruba ait sabit sınıflandırma (ör. Kolye, Yüzük, Bileklik, Küpe) | `references/domain-glossary.md` |
| Collection (koleksiyon) | Tematik/sezonluk, kategoriler arası kesişebilen küratörlü gruplama (ör. "Yaz Koleksiyonu") | `references/domain-glossary.md` |
| Variant (varyant) | Bir ürünün satılabilir somut kombinasyonu (ör. belirli renk + belirli ölçü) | `references/data-model-guidance.md` |
| SKU | Bir varyantı tekil olarak tanımlayan stok/kod referansı | `references/data-model-guidance.md` |
| Material / Plating / Color / Stone type | Takıya özgü öznitelik sözlüğü | `references/domain-glossary.md` |
| Size / Chain length | Ölçü birimleri ve gösterim biçimleri | `references/domain-glossary.md` |
| Product care info | Bakım bilgisi metin kalıpları (genel, ürüne özgü iddia değil) | `references/domain-glossary.md` |
| Gift packaging | Hediye paketi kavramı ve checkout'a olası etkisi (OPEN) | `references/domain-glossary.md`, `references/project-decisions.md` |

Bu tablodaki her satır kısa bir hatırlatmadır; tanım/gerekçe için ilgili reference dosyasını aç.
