"use server"

import { redirect } from "next/navigation"
import { createFirstAdmin, setSessionCookie } from "@/lib/auth"

export interface SetupActionFailure {
  success: false
  error: { code: string; message: string }
}

/**
 * GÜNCEL SÖZLEŞME (ACİL düzeltme): `createFirstAdmin` artık cookie'yi
 * KENDİSİ SET ETMİYOR — ham `session.token`'ı döndürüyor, cookie'yi yazmak
 * burada `setSessionCookie` ile yapılır (bkz. `app/admin/login/actions.ts`'teki
 * aynı notun tam metni).
 *
 * `ALREADY_SET_UP` kodu (eşzamanlı bir setup isteği/daha önce kapatılmış
 * kurulum) burada sessizce yutulmaz — `error.message` doğrudan `SetupForm`'a
 * döner, kullanıcı Türkçe anlamlı bir mesaj görür.
 *
 * `result.session.token` KESİNLİKLE loglanmaz/client'a döndürülmez — yalnızca
 * `setSessionCookie`'ye geçirilip unutulur.
 */
export async function setupAction(input: unknown): Promise<SetupActionFailure | undefined> {
  const result = await createFirstAdmin(input)
  if (!result.success) {
    return result
  }
  await setSessionCookie(result.session.token, result.session.expiresAt)
  redirect("/admin")
}
