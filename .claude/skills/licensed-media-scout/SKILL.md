---
name: licensed-media-scout
description: Lisanslı, AI ile üretilmemiş hazır (stok) görsel araştırma ve kaynak/lisans kaydı skill'i. Hero görseli, koleksiyon kapağı, editorial içerik veya marka hikâyesi için görsel aranırken; "stok görsel", "royalty-free", "Creative Commons", "Unsplash", "Pexels", "Adobe Stock", "lisanslı fotoğraf", "hangi görseli kullanabiliriz", "attribution gerekiyor mu" gibi konular geçtiğinde; ya da bir görselin ticari kullanıma uygun olup olmadığı, kaynağının/lisansının belli olup olmadığı sorgulanırken MUTLAKA bu skill'i kullan — kullanıcı skill'i adıyla anmasa bile. Ürün kartı/ürün detayı için "ürün fotoğrafı" aranıyorsa bu skill'i KULLANMA (o alanlarda yalnızca gerçek ürün görseli kullanılır, stok görsel aranmaz) — ama bu ayrımı hatırlatmak için yine bu skill'e bakılabilir. Herhangi bir web/e-ticaret projesinde yeniden kullanılabilir, proje bağımsız bir araştırma/kayıt metodolojisidir.
---

# Licensed Media Scout

Bu skill, **AI ile görsel üretmeden**, gerçek fotoğrafçılar/kaynaklar tarafından üretilmiş ve kullanım hakkı açık (lisanslı) hazır görselleri araştırmak, bu görsellerin doğru yerde kullanılıp kullanılamayacağını değerlendirmek ve kaynak/lisans bilgisini standart bir formatta kayıt altına almak içindir.

**Bu skill görsel indirmez veya kod yazmaz.** Çıktısı bir asset manifest kaydıdır (bkz. aşağı) — gerçek dosya indirme, entegrasyon veya component kodu ayrı bir implementasyon adımıdır.

## Sert kurallar (hiçbir durumda esnetilmez)

- **AI ile görsel üretme.** fal.ai, Midjourney, DALL-E, Stable Diffusion veya başka bir AI görsel üretim aracı bu skill'in workflow'unun hiçbir adımında kullanılmaz. Aranan her görsel gerçek bir fotoğrafçı/kaynak tarafından üretilmiş olmalıdır.
- **Kaynağı veya kullanım hakkı belirsiz asset kullanma.** "Muhtemelen serbesttir", "büyük ihtimalle ücretsizdir" gibi varsayımlar yeterli değildir; lisans, kaynağın **güncel** lisans sayfasından doğrulanmalıdır (bkz. `references/licensing-basics.md`). Doğrulanamayan bir görsel kullanılmaz, ikinci bir aday aranır.
- **Başka bir ürüne ait stok görseli gerçek ürün fotoğrafı gibi sunma.** Bu skill'in ürettiği görseller yalnızca aşağıdaki kullanım alanlarına girer; ürün kartı veya ürün detay sayfası **bu skill'in kapsamına girmez**.
- **Stok görseller yalnızca şu dört kullanım alanında (`usage`) kullanılabilir:**
  - `hero` — ana sayfa/kahraman görseli
  - `editorial` — editoryal/içerik odaklı görsel
  - `collection_cover` — koleksiyon kapak görseli
  - `brand_story` — marka hikâyesi görseli

  Bu listenin dışında bir kullanım alanı (özellikle ürün kartı/ürün detayı) için stok görsel **aranmaz bile** — o ihtiyaç gerçek ürün fotoğrafçılığı gerektirir ve bu skill'in kapsamı dışındadır.

Bu kurallar proje bağımsızdır; hangi web/e-ticaret projesinde çalışırsan çalış geçerlidir. Bu projeye özgü ek bağlam için `references/project-usage-policy.md` dosyasına bak.

## 8 adımlık workflow

1. **Görsel ihtiyacını sınıflandır.** İhtiyaç `hero` / `editorial` / `collection_cover` / `brand_story` alanlarından hangisine giriyor? Girmiyorsa (ör. ürün fotoğrafı), dur — bu skill'in kapsamı dışında, gerçek ürün çekimi gerekir.
2. **Lisanslı kaynak araştır.** Kullanım amacına uygun, ticari kullanıma izin veren kaynaklarda ara. Genel kaynak türleri ve dikkat edilecek noktalar için `references/licensing-basics.md`.
3. **Kullanım alanına uygunluğunu değerlendir.** Görsel gerçekten ticari kullanıma açık mı? Editorial-only bir lisans mı (o zaman pazarlama/hero kullanımı için uygun değildir)? Görselde tanınabilir bir kişi veya marka varsa model/property release var mı?
4. **Source URL kaydet.** Görselin bulunduğu sayfanın tam URL'i.
5. **License kaydet.** Lisans türü (ör. "CC0", "Unsplash License", "Royalty-Free — Editorial Only" gibi kaynağın kendi ifadesiyle) + varsa lisans metninin linki.
6. **Creator / photographer bilgisini gerekiyorsa kaydet.** Attribution (kaynak gösterme) gerektiren bir lisansta bu alan zorunludur; gerektirmiyorsa da biliniyorsa kaydetmek iyi bir pratiktir.
7. **Alt text oluştur.** Görselin içeriğini kısa ve açıklayıcı biçimde anlatan, sitenin diliyle tutarlı bir alt metin yaz (erişilebilirlik ve temel SEO için).
8. **Asset manifest kaydı üret.** Aşağıdaki şemaya uygun bir kayıt oluştur — bkz. `references/asset-manifest-schema.md` ve örnek şablon `assets/asset-manifest.example.json`.

## Asset manifest alanları

| Alan | Açıklama |
|---|---|
| `file` | Görselin proje içindeki dosya adı/yolu (henüz indirilmemişse planlanan ad) |
| `usage` | `hero` \| `editorial` \| `collection_cover` \| `brand_story` |
| `source` | Kaynağın adı (ör. "Unsplash", "Pexels", "Adobe Stock") |
| `source_url` | Görselin bulunduğu sayfanın tam URL'i |
| `creator` | Fotoğrafçı/kaynak kişi veya stüdyo adı (biliniyorsa) |
| `license` | Lisans türü, kaynağın kendi ifadesiyle |
| `license_checked_at` | Lisansın doğrulandığı tarih (ISO 8601, ör. `2026-09-13`) — lisans şartları zamanla değişebileceği için bu tarih önemlidir |
| `alt` | Erişilebilirlik/SEO için alt metin |

Tam şema, örnekler ve alan formatı detayları için `references/asset-manifest-schema.md`.

## Ne zaman dur ve kullanıcıya sor

- Bir görselin lisans sayfası belirsiz, çelişkili veya erişilemezse.
- Ticari kullanım izni açıkça belirtilmemişse (yalnızca "editorial use" ibaresi varsa ve kullanım alanı pazarlama/hero ise).
- Attribution gereksinimi var ama nasıl uygulanacağı (görünür kredi mi, sadece kayıt mı) belirsizse.

Bu durumlarda tahmin yürütüp devam etmek yerine durumu olduğu gibi bildir; hangi kaynağın/görselin kullanılacağına dair nihai kararı proje sahibi/kullanıcı versin.
