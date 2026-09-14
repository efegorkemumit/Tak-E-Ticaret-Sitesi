import type { CheckoutOrderSummary as CheckoutOrderResult } from "@/lib/commerce/checkout-action"

const ORDER_RESULT_KEY = "checkout:lastOrderResult"

/**
 * D022 sonucu: sunucuda kalıcı bir sipariş sorgulama/oturum kaydı yok (bu
 * modülün de kapsamı dışında — "order lookup public UI" ayrı bir tur).
 * Başarılı checkout sonucu, sipariş başarı sayfasına yalnızca bu sekmede
 * (sessionStorage) taşınır; sayfa okuduktan sonra silinmez (yenilemede de
 * görünsün diye) ama yeni bir checkout başladığında üzerine yazılır.
 */
export function storeOrderResult(result: CheckoutOrderResult): void {
  sessionStorage.setItem(ORDER_RESULT_KEY, JSON.stringify(result))
}

export function readOrderResult(): CheckoutOrderResult | null {
  const raw = sessionStorage.getItem(ORDER_RESULT_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as CheckoutOrderResult
  } catch {
    return null
  }
}
