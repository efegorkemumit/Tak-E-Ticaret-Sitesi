import type { Metadata } from "next"
import { OrderSuccessView } from "@/components/checkout/order-success-view"

export const metadata: Metadata = {
  title: "Sipariş Alındı",
  robots: { index: false },
}

export default function OrderSuccessPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <OrderSuccessView />
    </div>
  )
}
