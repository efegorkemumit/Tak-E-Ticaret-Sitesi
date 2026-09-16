import { beforeEach, describe, expect, it } from "vitest"
import { testPrisma } from "../helpers/test-prisma"
import { PaymentMethod, PaymentStatus } from "../../lib/generated/prisma/client"
import { checkoutInputSchema } from "../../lib/commerce/checkout-schema"
import { submitCheckoutOrder } from "../../lib/commerce/checkout-action"
import { createOrder } from "../../lib/commerce/create-order"
import { buildCheckoutInput, createPublishedProductWithVariant, resetCommerceTables } from "../helpers/factories"

beforeEach(async () => {
  await resetCommerceTables()
})

/**
 * D030 — Shopier ARTIK bizim checkout'umuzun içindeki bir ödeme sağlayıcısı
 * DEĞİLDİR; ayrı bir kartlı satış kanalıdır ve Shopier'den geçen bir satışın
 * bizim `Order` tablomuzda karşılığı OLUŞMAZ.
 *
 * Bu dosyanın amacı, o sınırın client'tan gelen bir değerle AŞILAMADIĞINI
 * kanıtlamaktır: Prisma `PaymentMethod` enum'unda `SHOPIER` geriye uyumluluk
 * için hâlâ DURUYOR, dolayısıyla "şema zaten kabul etmez" varsayımı tek
 * başına yeterli bir güvence değildir — gerçekten test edilmesi gerekir.
 */
describe("checkoutInputSchema — paymentMethod sınırı (D030)", () => {
  it("SHOPIER girdisini REDDEDER (enum'da hâlâ var olmasına rağmen)", () => {
    const input = { ...buildCheckoutInput({ items: [{ variantId: "x", quantity: 1 }] }), paymentMethod: "SHOPIER" }

    const parsed = checkoutInputSchema.safeParse(input)

    expect(parsed.success).toBe(false)
    if (parsed.success) throw new Error("beklenmedik kabul")
    expect(parsed.error.issues.some((issue) => issue.path.includes("paymentMethod"))).toBe(true)
  })

  it("tanınmayan bir ödeme yöntemini de reddeder", () => {
    const input = { ...buildCheckoutInput({ items: [{ variantId: "x", quantity: 1 }] }), paymentMethod: "CRYPTO" }

    expect(checkoutInputSchema.safeParse(input).success).toBe(false)
  })

  it("BANK_TRANSFER girdisini kabul eder", () => {
    const input = buildCheckoutInput({ items: [{ variantId: "x", quantity: 1 }] })

    const parsed = checkoutInputSchema.safeParse(input)

    expect(parsed.success).toBe(true)
    if (!parsed.success) throw new Error("beklenmedik red")
    expect(parsed.data.paymentMethod).toBe(PaymentMethod.BANK_TRANSFER)
  })
})

describe("Checkout — yalnızca Havale/EFT sipariş üretir (D030)", () => {
  it("BANK_TRANSFER ile sipariş oluşur ve paymentStatus PENDING'dir", async () => {
    const { variantId } = await createPublishedProductWithVariant({ stockQuantity: 5, price: 100 })

    const order = await createOrder(buildCheckoutInput({ items: [{ variantId, quantity: 1 }] }), testPrisma)

    expect(order.paymentStatus).toBe(PaymentStatus.PENDING)

    const row = await testPrisma.order.findUniqueOrThrow({ where: { id: order.orderId } })
    expect(row.paymentMethod).toBe(PaymentMethod.BANK_TRANSFER)
    expect(row.paymentStatus).toBe(PaymentStatus.PENDING)
  })

  it("submitCheckoutOrder SHOPIER ile çağrıldığında INVALID_INPUT döner ve HİÇBİR sipariş oluşmaz", async () => {
    const { variantId } = await createPublishedProductWithVariant({ stockQuantity: 5, price: 100 })
    const input = { ...buildCheckoutInput({ items: [{ variantId, quantity: 1 }] }), paymentMethod: "SHOPIER" }

    const result = await submitCheckoutOrder(input, testPrisma)

    expect(result.success).toBe(false)
    if (result.success) throw new Error("beklenmedik başarı")
    expect(result.error.code).toBe("INVALID_INPUT")

    // ASIL İDDİA: sahte bir Shopier siparişi DB'ye yazılmadı.
    expect(await testPrisma.order.count()).toBe(0)
    expect(await testPrisma.inventoryReservation.count()).toBe(0)
  })

  it("createOrder da SHOPIER girdisini reddeder (servis katmanı kendi doğrulamasını yapar)", async () => {
    const { variantId } = await createPublishedProductWithVariant({ stockQuantity: 5, price: 100 })
    const input = { ...buildCheckoutInput({ items: [{ variantId, quantity: 1 }] }), paymentMethod: "SHOPIER" }

    await expect(createOrder(input as never, testPrisma)).rejects.toThrow()
    expect(await testPrisma.order.count()).toBe(0)
  })
})
