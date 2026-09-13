# Asset Manifest Şeması

Bu şema, `licensed-media-scout` skill'inin araştırdığı **her lisanslı stok görsel** için üretilmesi gereken kaydın biçimidir. Amaç, hangi görselin nereden geldiğini, hangi lisansla kullanıldığını ve ne zaman doğrulandığını proje bağımsız, tutarlı bir formatta izlenebilir kılmaktır.

Bu manifest yalnızca **lisanslı stok görseller** içindir — gerçek ürün fotoğrafları bu kaydın kapsamına girmez (onlar lisans gerektirmez, marka/tedarikçi tarafından sağlanır).

## Alan tanımları

| Alan | Tip | Zorunlu mu | Açıklama |
|---|---|---|---|
| `file` | string | Evet | Görselin proje içindeki dosya adı/yolu. Görsel henüz indirilmediyse, planlanan dosya adı (ör. `hero-ana-sayfa-01.jpg`). |
| `usage` | enum | Evet | Şu dört değerden biri: `hero`, `editorial`, `collection_cover`, `brand_story`. Başka bir değer bu manifest için geçerli değildir. |
| `source` | string | Evet | Kaynağın adı (ör. `"Unsplash"`, `"Pexels"`, `"Adobe Stock"`). |
| `source_url` | string (URL) | Evet | Görselin bulunduğu sayfanın tam, doğrudan erişilebilir URL'i. Arama sonucu sayfası değil, görselin kendi sayfası olmalı. |
| `creator` | string veya `null` | Lisans attribution gerektiriyorsa zorunlu, aksi hâlde biliniyorsa önerilir | Fotoğrafçı/kaynak kişi veya stüdyo adı. Kaynak anonim/kurumsal ise kurum adı yazılabilir. |
| `license` | string | Evet | Lisans türü, kaynağın **kendi ifadesiyle** (ör. `"CC0"`, `"Unsplash License"`, `"Adobe Stock Standard License"`). Genel bir kategori adı (ör. sadece `"royalty-free"`) yeterli değildir — kaynağın kullandığı tam ismi yaz. |
| `license_checked_at` | string (ISO 8601 tarih, `YYYY-MM-DD`) | Evet | Lisansın fiilen kontrol edildiği tarih. Lisans şartları değişebileceği için bu alan, kaydın "ne zaman doğrulandığını" gösterir — görselin ilk bulunduğu tarih değil, lisansın **son okunduğu** tarih. |
| `alt` | string | Evet | Görselin içeriğini anlatan, sitenin diliyle tutarlı, erişilebilirlik/SEO amaçlı alt metin. |

## Örnek kayıt

```json
{
  "file": "hero-ana-sayfa-01.jpg",
  "usage": "hero",
  "source": "Unsplash",
  "source_url": "https://unsplash.com/photos/ORNEK-ID",
  "creator": "Örnek Fotoğrafçı Adı",
  "license": "Unsplash License",
  "license_checked_at": "2026-09-13",
  "alt": "Ahşap masa üzerinde altın rengi kolye ve yüzük düzenlemesi"
}
```

Tam bir çalışma örneği için `assets/asset-manifest.example.json` dosyasına bak.

## Manifest dosyasının saklanması

Bu şema, tek bir kayıt formatını tanımlar. Bir proje genelde tüm kayıtları tek bir dosyada (ör. `docs/media/asset-manifest.json` gibi bir dizi/array) veya her görsel için ayrı bir kayıt (CMS/veritabanı satırı) olarak tutabilir — hangi saklama yönteminin seçileceği bu skill'in kapsamı dışındadır ve implementasyon agent'ının kararıdır. Önemli olan, hangi yöntem seçilirse seçilsin yukarıdaki 8 alanın tam olarak bu adlarla ve bu anlamlarla korunmasıdır — böylece farklı projelerde ve farklı agent'lar arasında aynı format okunabilir kalır.
