"use client"

import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react"
import type { CartLine, CartState } from "./types"
import { readCartFromStorage, writeCartToStorage } from "./storage"
import { useIsClient } from "@/lib/use-is-client"

interface InternalCartState extends CartState {
  /**
   * localStorage'dan ilk okuma tamamlandı mı. BİLİNÇLİ OLARAK reducer
   * state'inin bir PARÇASI (ayrı bir ref DEĞİL) — bkz. dosya sonundaki
   * "neden ref değil state" notu (qa'nın bulduğu gerçek bug'ın düzeltmesi).
   */
  hydrated: boolean
}

type CartAction =
  | { type: "HYDRATE"; lines: CartLine[] }
  | { type: "ADD_ITEM"; line: CartLine }
  | { type: "SET_QUANTITY"; variantId: string; quantity: number }
  | { type: "REMOVE_ITEM"; variantId: string }
  | { type: "CLEAR" }

function cartReducer(state: InternalCartState, action: CartAction): InternalCartState {
  switch (action.type) {
    case "HYDRATE":
      return { lines: action.lines, hydrated: true }
    case "ADD_ITEM": {
      const existing = state.lines.find((line) => line.variantId === action.line.variantId)
      if (existing) {
        return {
          ...state,
          lines: state.lines.map((line) =>
            line.variantId === action.line.variantId
              ? { ...line, quantity: line.quantity + action.line.quantity }
              : line
          ),
        }
      }
      return { ...state, lines: [...state.lines, action.line] }
    }
    case "SET_QUANTITY": {
      const quantity = Math.max(1, Math.floor(action.quantity))
      return {
        ...state,
        lines: state.lines.map((line) =>
          line.variantId === action.variantId ? { ...line, quantity } : line
        ),
      }
    }
    case "REMOVE_ITEM":
      return { ...state, lines: state.lines.filter((line) => line.variantId !== action.variantId) }
    case "CLEAR":
      return { ...state, lines: [] }
    default:
      return state
  }
}

interface CartContextValue {
  lines: CartLine[]
  itemCount: number
  subtotal: number
  isHydrated: boolean
  addItem: (line: CartLine) => void
  setQuantity: (variantId: string, quantity: number) => void
  removeItem: (variantId: string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { lines: [], hydrated: false })
  // Render sırasında okunacak, hydration-safe "istemcideyiz" bayrağı —
  // context tüketicilerine (`isHydrated`) bunun üzerinden verilir.
  const isClient = useIsClient()

  // İlk mount'ta localStorage'dan oku (yalnızca client'ta çalışır, SSR'da
  // `lines: []` ile başlar — bu yüzden hydration mismatch riski yok, ilk
  // server render'ı zaten boş sepetle eşleşir).
  useEffect(() => {
    dispatch({ type: "HYDRATE", lines: readCartFromStorage().lines })
  }, [])

  /**
   * Her değişiklikte localStorage'a yaz — ama yalnızca `state.hydrated` TRUE
   * olduğunda.
   *
   * NEDEN AYRI BİR REF DEĞİL, `state`'in kendi alanı: qa gerçek, tekrarlanabilir
   * bir bug buldu — "hydrate tamamlandı mı" bilgisi ayrı bir `useRef` olarak
   * tutulduğunda, o ref hydrate-effect içinde SENKRON olarak `true`'ya
   * çevriliyordu, ama BU effect'in (aynı commit içinde, effect sırasına göre
   * hemen sonra çalışan) `state` closure'ı hâlâ dispatch'in işlenmesini
   * BEKLEYEN eski (boş) state'i taşıyordu. Sonuç: guard "hydrate tamam"
   * sanıp henüz gerçek veriyi içermeyen boş state'i localStorage'a yazıp
   * önceki oturumun sepetini SİLİYORDU (hard reload'da tekrarlanabilir veri
   * kaybı). `hydrated` artık `state`'in kendi alanı olduğu için bu effect'in
   * closure'ı guard'ı ve veriyi HER ZAMAN aynı, tutarlı state anlık
   * görüntüsünden okur — ikisi asla birbirinden bağımsız/senkronsuz olamaz.
   */
  useEffect(() => {
    if (!state.hydrated) return
    writeCartToStorage({ lines: state.lines })
  }, [state])

  const value = useMemo<CartContextValue>(() => {
    const itemCount = state.lines.reduce((sum, line) => sum + line.quantity, 0)
    const subtotal = state.lines.reduce(
      (sum, line) => sum + Number(line.unitPrice) * line.quantity,
      0
    )
    return {
      lines: state.lines,
      itemCount,
      subtotal,
      isHydrated: isClient,
      addItem: (line) => dispatch({ type: "ADD_ITEM", line }),
      setQuantity: (variantId, quantity) => dispatch({ type: "SET_QUANTITY", variantId, quantity }),
      removeItem: (variantId) => dispatch({ type: "REMOVE_ITEM", variantId }),
      clearCart: () => dispatch({ type: "CLEAR" }),
    }
  }, [state, isClient])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (!context) throw new Error("useCart, <CartProvider> içinde kullanılmalıdır")
  return context
}

export { CartProvider, useCart }
