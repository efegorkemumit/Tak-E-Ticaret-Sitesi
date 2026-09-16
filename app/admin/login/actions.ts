"use server"

import { redirect } from "next/navigation"
import { loginAdmin, setSessionCookie } from "@/lib/auth"
import { getClientIp } from "@/lib/auth/client-ip"

export interface LoginActionFailure {
  success: false
  error: { code: string; message: string }
}

/**
 * GÜNCEL SÖZLEŞME (ACİL düzeltme): `loginAdmin` artık cookie'yi KENDİSİ SET
 * ETMİYOR — `next/headers`'a hiç dokunmayan saf `issueSession`'ı çağırıp ham
 * `session.token`'ı DÖNDÜRÜYOR (qa'nın test edilebilirlik talebi üzerine).
 * Cookie'yi yazmak burada, `setSessionCookie` ile YAPILIR.
 *
 * `result.session.token` KESİNLİKLE loglanmaz, client'a döndürülmez, form
 * state'ine konmaz — yalnızca `setSessionCookie`'ye geçirilip unutulur.
 * `LoginActionFailure` tipi zaten `session` alanı TAŞIMIYOR, bu yüzden hata
 * durumunda client'a hiçbir token sızma riski yok.
 */
export async function loginAction(input: unknown): Promise<LoginActionFailure | undefined> {
  const ip = await getClientIp()
  const result = await loginAdmin(input, ip)
  if (!result.success) {
    return result
  }
  await setSessionCookie(result.session.token, result.session.expiresAt)
  redirect("/admin")
}
