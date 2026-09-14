"use server"

import { revalidatePath } from "next/cache"
import { updateOrderStatus } from "@/lib/admin"

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
