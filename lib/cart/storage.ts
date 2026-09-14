import type { CartState } from "./types"

const STORAGE_KEY = "cart:v1"

/** SSR'da `window` yok; her çağıran bunu kontrol etmek zorunda kalmasın diye burada tek yerde ele alınır. */
function isBrowser(): boolean {
  return typeof window !== "undefined"
}

export function readCartFromStorage(): CartState {
  if (!isBrowser()) return { lines: [] }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { lines: [] }
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.lines)) return { lines: [] }
    return parsed as CartState
  } catch {
    // Bozuk/eski şekilli veri sessizce yok sayılır — sepeti boşaltmak,
    // kullanıcıya kırık bir sayfa göstermekten daha iyi bir bozulma şeklidir.
    return { lines: [] }
  }
}

export function writeCartToStorage(state: CartState): void {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Kota aşımı vb. — sepet işlevi sessizce localStorage'sız (yalnızca bellek
    // içi state ile) devam eder, sayfa çökmez.
  }
}
