import type { CartLine } from "@/lib/cart/types"

const KEY_STORAGE_KEY = "checkout:idempotencyKey"
const SIGNATURE_STORAGE_KEY = "checkout:cartSignature"

/**
 * D017/D022 — checkout sayfası mount anında üretilen, retry/çift tıklamada
 * DEĞİŞMEYEN idempotency key (`docs/ARCHITECTURE.md` §6). `Math.random`
 * DEĞİL, Web Crypto API (`crypto.randomUUID()`) kullanılır.
 *
 * Sepet içeriği checkout'a girildiğinden beri değiştiyse (ör. kullanıcı
 * checkout'tan çıkıp sepeti değiştirip geri geldiyse) eski key artık geçersiz
 * sayılır, yeni bir key üretilir — "aynı sepet → aynı key" ilkesi bir
 * "imza" (satırların variantId+quantity'sinin sıralı JSON'u) üzerinden
 * korunur.
 */
export function getOrCreateIdempotencyKey(lines: CartLine[]): string {
  const signature = computeCartSignature(lines)

  const storedSignature = sessionStorage.getItem(SIGNATURE_STORAGE_KEY)
  const storedKey = sessionStorage.getItem(KEY_STORAGE_KEY)

  if (storedSignature === signature && storedKey) {
    return storedKey
  }

  const newKey = crypto.randomUUID()
  sessionStorage.setItem(SIGNATURE_STORAGE_KEY, signature)
  sessionStorage.setItem(KEY_STORAGE_KEY, newKey)
  return newKey
}

/** Başarılı sipariş sonrası: bir sonraki checkout denemesi her zaman yeni bir key almalı. */
export function clearIdempotencyKey(): void {
  sessionStorage.removeItem(KEY_STORAGE_KEY)
  sessionStorage.removeItem(SIGNATURE_STORAGE_KEY)
}

function computeCartSignature(lines: CartLine[]): string {
  return JSON.stringify(
    [...lines]
      .map((line) => ({ variantId: line.variantId, quantity: line.quantity }))
      .sort((a, b) => a.variantId.localeCompare(b.variantId))
  )
}
