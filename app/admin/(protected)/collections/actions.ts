"use server"

import { redirect } from "next/navigation"
import { createCollection, updateCollection } from "@/lib/admin"

export interface CollectionActionFailure {
  success: false
  error: { code: string; message: string }
}

export async function createCollectionAction(input: unknown): Promise<CollectionActionFailure | undefined> {
  const result = await createCollection(input)
  if (!result.success) return result
  redirect("/admin/collections")
}

export async function updateCollectionAction(input: unknown): Promise<CollectionActionFailure | undefined> {
  const result = await updateCollection(input)
  if (!result.success) return result
  redirect("/admin/collections")
}
