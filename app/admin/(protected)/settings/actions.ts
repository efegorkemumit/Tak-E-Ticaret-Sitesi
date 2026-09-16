"use server"

import { revalidatePath } from "next/cache"
import { updateSiteSettings } from "@/lib/settings/service"

export interface AdminActionFailure {
  success: false
  error: { code: string; message: string }
}

/**
 * `orders/actions.ts`'teki AYNI ince sarmalayıcı deseni: tüm iş kuralı ve
 * yetki kontrolü (`requireAdmin`) servis katmanındadır — burada yalnızca
 * hata sonucu geri yansıtılır ve cache tazelenir.
 *
 * YALNIZCA `/admin/settings` revalidate edilir. Havale bilgisini gösteren
 * PUBLIC sayfalar (`/siparis-basarili`, `/siparis-sorgula`) `force-dynamic`
 * olduğu için her istekte zaten yeniden render edilir — onlar için ayrıca
 * revalidate ETMEK gereksiz olurdu.
 */
export async function updateSiteSettingsAction(input: unknown): Promise<AdminActionFailure | undefined> {
  const result = await updateSiteSettings(input)
  if (!result.success) return result
  revalidatePath("/admin/settings")
}
