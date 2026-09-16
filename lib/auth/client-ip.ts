/**
 * İsteğin istemci IP'sini `next/headers` üzerinden çıkarır.
 *
 * NEDEN AYRI BİR DOSYA: Bu mantık ilk olarak `app/admin/login/actions.ts`
 * içinde satır içi yazılmıştı. VIDEO 09'da public sipariş sorgulama da IP
 * bazlı bir hız sınırına ihtiyaç duyunca (bkz. `lib/commerce/order-lookup.ts`
 * dosya başındaki rate-limit notu) aynı fonksiyonun ikinci bir kopyası
 * yazılacaktı — bunun yerine tek bir yere taşındı. İki kopya olsaydı,
 * ileride "hangi header'a güveniyoruz" kararı yalnızca birinde güncellenip
 * diğeri sessizce eskiyebilirdi.
 *
 * `next/headers`'a dokunduğu için YALNIZCA bir Server Action / Route Handler
 * / Server Component içinden çağrılabilir; bu yüzden bilinçli olarak
 * `lib/auth/index.ts` barrel'ında DEĞİLDİR ve saf/DI-dostu çekirdek
 * modüllerinden (`session-core.ts`, `rate-limit.ts`) ayrı tutulur — o
 * modüller Vitest'ten doğrudan çağrılabilir kalmalıdır.
 *
 * GÜVENİLİRLİK SINIRI (bilinçli): `x-forwarded-for` istemci tarafından
 * uydurulabilir bir header'dır; güvenilirliği, uygulamanın önünde bu header'ı
 * yeniden yazan bir proxy/CDN olmasına bağlıdır. Bu yüzden buradan gelen
 * değer bir KİMLİK olarak ASLA kullanılmaz — yalnızca kaba bir hız sınırı
 * anahtarının parçasıdır. Header hiç yoksa `"unknown"` döner; bu durumda
 * sınırlama daha az ayırt edici olur ama tamamen devre dışı kalmaz.
 */
import { headers } from "next/headers"

export async function getClientIp(): Promise<string> {
  const headerList = await headers()

  const forwardedFor = headerList.get("x-forwarded-for")
  if (forwardedFor) {
    // Zincirin İLK değeri, orijinal istemciye en yakın olandır.
    const first = forwardedFor.split(",")[0]?.trim()
    if (first) return first
  }

  return headerList.get("x-real-ip") ?? "unknown"
}
