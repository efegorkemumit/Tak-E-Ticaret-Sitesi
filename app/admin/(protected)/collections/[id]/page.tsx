import { notFound } from "next/navigation"
import { listCollectionsForAdmin } from "@/lib/admin"
import { AdminPageHeader } from "@/components/admin/page-header"
import { CollectionForm } from "@/components/admin/collection-form"
import { updateCollectionAction } from "../actions"

export const dynamic = "force-dynamic"

export default async function EditAdminCollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const collections = await listCollectionsForAdmin()
  const collection = collections.find((c) => c.id === id)
  if (!collection) notFound()

  return (
    <div>
      <AdminPageHeader title={collection.name} description="Koleksiyon bilgilerini düzenle." />
      <CollectionForm mode="edit" initialValues={collection} action={updateCollectionAction} />
    </div>
  )
}
