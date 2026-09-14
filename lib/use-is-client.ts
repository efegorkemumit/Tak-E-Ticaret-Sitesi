"use client"

import { useSyncExternalStore } from "react"

function subscribe() {
  return () => {}
}

/**
 * SSR/hydration-safe "istemcideyiz" bayrağı. `localStorage`/`sessionStorage`
 * gibi yalnızca tarayıcıda var olan API'leri okumadan önce bunu kontrol
 * etmek, sunucunun ve istemcinin ilk render çıktısının eşleşmesini garanti
 * eder — React'in bu tür durumlar için resmi olarak önerdiği
 * `useSyncExternalStore` deseni (`useEffect` içinde `setState` çağırıp
 * gereksiz bir "cascading render" yaratmak yerine).
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false)
}
