import type { Metadata } from "next"
import { Container } from "@/components/container"
import { OrderSuccessView } from "@/components/checkout/order-success-view"

export const metadata: Metadata = {
  title: "Sipariş Alındı",
  robots: { index: false },
}

export default function OrderSuccessPage() {
  return (
    <Container size="narrow" className="py-10 lg:py-16">
      <OrderSuccessView />
    </Container>
  )
}
