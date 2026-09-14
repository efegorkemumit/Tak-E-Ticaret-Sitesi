"use server"

import { redirect } from "next/navigation"
import { revokeCurrentSession } from "@/lib/auth"

/**
 * Logout — GET link DEĞİL, POST (Server Action). GET ile tetiklenebilir bir
 * logout, bir `<img src>`/prefetch ile istem dışı çağrılabilir. `LogoutButton`
 * (`components/admin/logout-button.tsx`) bunu bir `<form action={...}>` ile
 * çağırır.
 *
 * `revokeCurrentSession()` DB'deki oturum satırına `revokedAt` yazar (aynı
 * token bir daha kabul edilmez) VE cookie'yi siler — gerçek iptal burada,
 * yönlendirme yalnızca UX.
 */
export async function logoutAction(): Promise<never> {
  await revokeCurrentSession()
  redirect("/admin/login")
}
