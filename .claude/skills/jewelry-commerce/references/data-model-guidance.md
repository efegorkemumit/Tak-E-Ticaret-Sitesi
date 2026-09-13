# Veri Modelleme Rehberi (Kavramsal)

Bu dosya, `domain-glossary.md`'deki kavramları bir veri modeline (şema, form, API kontratı) dökerken izlenecek **genel prensipleri** anlatır. **Kesin bir Prisma şeması veya alan listesi önermez** — çünkü bu projede varyant yapısı henüz OPEN'dır (`docs/OPEN_QUESTIONS.md` #4). Amaç, hangi agent bu kararı verirse versin (genelde commerce/backend-developer), esnekliği koruyacak bir çerçeve sunmaktır.

## Temel varlık ilişkileri (kavramsal)

Takı e-ticaretinde yaygın olan ilişki şekli şudur (bu, bir şema değil, kavramsal bir haritadır):

- Bir **Product**, bir veya daha fazla **Category**'ye ve bir veya daha fazla **Collection**'a ait olabilir.
- Bir **Product**, bir veya daha fazla satılabilir **Variant**'a sahiptir. Varyantı olmayan basit bir ürün, "tek varyantlı" bir ürün olarak da düşünülebilir (varyant kavramını dışlamaz, sadeleştirir).
- Her **Variant**, tekil bir **SKU**, bir **Price** (ve opsiyonel indirimli fiyat) ve bir **Stock** miktarına sahiptir.
- Bir **Variant**, materyal/kaplama/renk/taş türü/ölçü/zincir uzunluğu gibi özniteliklerin **belirli bir kombinasyonunu** temsil eder.

Bu hiyerarşi (Product → Variant → SKU/Price/Stock) sektörde yaygındır ama bu projede hangi özniteliğin varyant seviyesinde mi yoksa yalnızca ürün seviyesinde bilgi alanı mı olacağı henüz kesinleşmemiştir.

## Neden esnek/genişletilebilir bir yapı gerekiyor

Ham müşteri notlarında öznitelik listesi (materyal, kaplama, renk, taş türü, beden/ölçü, zincir uzunluğu, SKU, fiyat, stok, bakım bilgisi, hediye paketi) verilmiş ama **hepsinin her üründe zorunlu olmadığı** açıkça belirtilmiştir (`docs/PROJECT_BRIEF.md` Bölüm 10). Bu, iki riski birlikte taşır:

1. Sabit/hardcoded kolonlarla (ör. `material`, `plating`, `color`, `stoneType` gibi ürün tablosunda sabit alanlar) modellemek, gerçek ürün kataloğu görülüp kesin varyant yapısı belirlendiğinde (bkz. `docs/OPEN_QUESTIONS.md` #4) maliyetli bir şema değişikliği gerektirebilir.
2. Aşırı erken genelleme (ör. tamamen serbest, tipsiz bir anahtar-değer yapısı) form doğrulamasını ve varyant seçici UI'ını zorlaştırabilir.

Bu ikisi arasında bir denge kurmak — ör. bilinen öznitelik tiplerini (materyal, kaplama, renk, taş türü, ölçü, zincir uzunluğu) tanımlı ama **her biri opsiyonel** tutan, ürüne göre hangi özniteliklerin aktif olduğunu belirleyebilen bir yapı — kesin şemayı belirleyecek agent'ın kendi tercihidir. Bu skill'in verdiği tavsiye, hangi teknik yaklaşım seçilirse seçilsin **"tüm öznitelikler opsiyonel, ürün bazında hangileri kullanılıyorsa onlar dolu"** ilkesinin korunmasıdır.

## Modelleme yaparken sorulacak sorular

Kesin şemaya karar vermeden önce şu soruların cevabı net olmalı (bunlar bu skill tarafından cevaplanmaz, ilgili proje belgesine veya proje sahibine yönlendirilir):

- SKU/fiyat/stok ürün seviyesinde mi yoksa yalnızca varyant seviyesinde mi tutulacak? (`docs/AGENT_TEAM.md` → Recommendations → commerce'den açık madde)
- Category ile Collection arasındaki ilişki nasıl olacak — bir ürün birden fazla koleksiyona girebilir mi? (`docs/AGENT_TEAM.md` → Recommendations → commerce'den açık madde)
- Hangi öznitelikler (materyal, kaplama, renk, taş türü, ölçü, zincir uzunluğu) bu projede gerçekten kullanılacak, hangileri MVP'de hiç gerekmeyecek? (`docs/OPEN_QUESTIONS.md` #4 netleşince belli olur)

## Bu skill'in yapmadığı şey

- Bir Prisma `schema.prisma` taslağı vermez.
- Zorunlu/opsiyonel alan listesi dayatmaz.
- Stok düşme/rezervasyon zamanlamasına dair bir kural önermez (bu tamamen ayrı bir OPEN konudur, bkz. `project-decisions.md`).

Kod/şema yazma zamanı geldiğinde, bu dosyadaki ilkeleri uygulamak ilgili implementasyon agent'ının (genelde commerce/backend-developer) sorumluluğundadır.
