"use server"

import { redirect } from "next/navigation"
import { createCategory, updateCategory } from "@/lib/admin"

/**
 * `login`/`setup` Server Action'larındaki AYNI ince-katman deseni: girdi
 * doğrulama/DB mantığı tamamen `lib/admin/categories.ts`'te, burası yalnızca
 * başarı → `redirect()`, başarısızlık → sonucu client'a döndürme köprüsü.
 */
export interface CategoryActionFailure {
  success: false
  error: { code: string; message: string }
}

export async function createCategoryAction(input: unknown): Promise<CategoryActionFailure | undefined> {
  const result = await createCategory(input)
  if (!result.success) return result
  redirect("/admin/categories")
}

export async function updateCategoryAction(input: unknown): Promise<CategoryActionFailure | undefined> {
  const result = await updateCategory(input)
  if (!result.success) return result
  redirect("/admin/categories")
}
