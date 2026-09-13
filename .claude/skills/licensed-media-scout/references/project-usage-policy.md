# Bu Proje İçin Ek Bağlam (Takı E-Ticaret Sitesi)

`SKILL.md` ve diğer reference dosyaları proje bağımsızdır. Bu dosya, bu belirli projede (takı e-ticaret sitesi) skill'in nasıl konumlandığını özetler — bir anlık görüntüdür (snapshot), kesin karar için her zaman `docs/DECISIONS.md` ve `docs/PROJECT_BRIEF.md`'yi doğrula.

## İlgili kesinleşmiş kararlar

| Karar | Özet | Bu skill için anlamı |
|---|---|---|
| D011 | Projede hiçbir ürün veya editorial görseli yapay zeka ile üretilmeyecek. | Bu skill'in "AI ile görsel üretme" kuralı bu kararın doğrudan uygulamasıdır; istisna yoktur. |
| D012 | Ürün kartlarında ve ürün detay sayfalarında yalnızca satılan gerçek ürüne ait görseller kullanılacak. | Bu skill ürün kartı/detayı için hiç görsel aramaz; bu skill'i bu amaçla çalıştırmak kapsam dışıdır. |
| D013 | Lisanslı hazır stok görseller yalnızca hero, koleksiyon kapağı, editorial içerik ve marka hikâyesi alanlarında kullanılabilir. | Bu skill'in `usage` alanındaki dört değer (`hero`, `editorial`, `collection_cover`, `brand_story`) doğrudan bu karardan türetilmiştir — başka bir `usage` değeri bu projede geçerli değildir. |

`docs/PROJECT_BRIEF.md` Bölüm 15 ayrıca şunu da gerektirir: "Kullanılan hazır (stok) görsellerin kaynak ve lisans bilgileri kayıt altında tutulmalıdır." — bu skill'in ürettiği asset manifest kaydı tam olarak bu ihtiyacı karşılar.

## Henüz OPEN olan, dolaylı ilgili konu

- Ürün görsellerini kimin sağlayacağı (müşteri/profesyonel çekim/tedarikçi) henüz netleşmemiştir (`docs/OPEN_QUESTIONS.md` #11). Bu, gerçek ürün fotoğrafçılığıyla ilgilidir ve bu skill'in kapsamına (yalnızca lisanslı stok görsel) girmez; bu skill bu OPEN soruyu kesinleştirmeye çalışmaz.

## Ekip içi sahiplik

`docs/AGENT_TEAM.md`'e göre lisans/kaynak kayıt şablonunun hazırlanması `brand-ui` (ui-designer) sorumluluğunda, ilk geliştirme dalgasının bir parçası olarak listelenmiştir. Bu skill'in ürettiği asset manifest şeması, bu şablon ihtiyacını karşılamak için kullanılabilir. `docs/AGENT_TEAM.md`'deki paylaşılan kurallar (DECISIONS.md'yi değiştirmeme, OPEN kararı kendin kesinleştirmeme, MVP kapsamını büyütmeme) bu skill için de geçerlidir.

## Bu skill'in kapsamadığı şeyler (bu proje için de geçerli genel sınır)

- Shopier veya başka bir ödeme sağlayıcısıyla ilgili hiçbir iş mantığı — bu skill yalnızca görsel araştırma/lisans kaydı yapar, ödeme/commerce mantığına girmez.
- Gerçek görsel indirme veya bu görselleri projeye entegre eden kod (component, storage, CDN ayarları vb.) — bu skill yalnızca araştırma ve manifest kaydı üretir.
