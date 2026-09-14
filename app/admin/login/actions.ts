"use server"

import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { loginAdmin, setSessionCookie } from "@/lib/auth"

export interface LoginActionFailure {
  success: false
  error: { code: string; message: string }
}

/**
 * İsteğin IP'sini `headers()`'tan çıkarır (`loginAdmin` rate-limit anahtarının
 * bir parçası olarak kullanır) — `x-forwarded-for`'un İLK değeri, yoksa
 * `x-real-ip`, o da yoksa güvenli bir sabit ("unknown"; rate limit yine de
 * email bazında çalışmaya devam eder, yalnızca IP bileşeni daha az ayırt
 * edici olur).
 */
async function getClientIp(): Promise<string> {
  const headerList = await headers()
  const forwardedFor = headerList.get("x-forwarded-for")
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim()
    if (first) return first
  }
  return headerList.get("x-real-ip") ?? "unknown"
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
