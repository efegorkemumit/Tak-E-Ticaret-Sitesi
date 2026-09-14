"use server"

import { revalidatePath } from "next/cache"
import { createAttributeDefinition, createAttributeValue } from "@/lib/admin"

/**
 * `categories`/`collections`'ın aksine bu sayfa TEK bir ekranda kalır (liste
 * + iki create formu) — başarıda `redirect()` yerine `revalidatePath()`
 * kullanılır, admin aynı sayfada kalıp yeni oluşturulan tip/değeri hemen
 * güncel listede görür.
 */
export interface AttributeActionFailure {
  success: false
  error: { code: string; message: string }
}

export async function createAttributeDefinitionAction(input: unknown): Promise<AttributeActionFailure | undefined> {
  const result = await createAttributeDefinition(input)
  if (!result.success) return result
  revalidatePath("/admin/attributes")
}

export async function createAttributeValueAction(input: unknown): Promise<AttributeActionFailure | undefined> {
  const result = await createAttributeValue(input)
  if (!result.success) return result
  revalidatePath("/admin/attributes")
}
