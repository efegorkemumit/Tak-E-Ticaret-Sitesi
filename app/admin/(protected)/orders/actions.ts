"use server"

import { revalidatePath } from "next/cache"
import { updateOrderStatus } from "@/lib/admin"
// VIDEO 09 — barrel (`@/lib/admin`) henüz ödeme fonksiyonlarını dışa açmıyor
// olabilir; doğrudan modülden import ediliyor.
import { confirmOrderPayment, rejectOrderPayment } from "@/lib/admin/payments"

export interface AdminActionFailure {
  success: false
  error: { code: string; message: string }
}

export async function updateOrderStatusAction(input: unknown, orderId: string): Promise<AdminActionFailure | undefined> {
  const result = await updateOrderStatus(input)
  if (!result.success) return result
  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath("/admin/orders")
}

// ---------------------------------------------------------------------------
// Havale ödemesinin manuel onayı/reddi (D007). VIDEO 09'da D026 GEVŞETİLDİ —
// Video 07'de `paymentStatus` salt okunurdu, artık admin tarafından
// yönetiliyor. Stok ve iptal etkileri SERVİS katmanındadır: onay ayrılan
// stoğu kalıcı düşer ve `orderStatus`'u DEĞİŞTİRMEZ; red siparişi iptal edip
// rezervasyonu serbest bırakır. UI bunları yalnızca ANLATIR, kendisi
// uygulamaz.
// ---------------------------------------------------------------------------

export async function confirmOrderPaymentAction(input: unknown, orderId: string): Promise<AdminActionFailure | undefined> {
  const result = await confirmOrderPayment(input)
  if (!result.success) return result
  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath("/admin/orders")
}

export async function rejectOrderPaymentAction(input: unknown, orderId: string): Promise<AdminActionFailure | undefined> {
  const result = await rejectOrderPayment(input)
  if (!result.success) return result
  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath("/admin/orders")
}
