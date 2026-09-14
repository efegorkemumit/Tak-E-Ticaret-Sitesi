import { AdminPageHeader } from "@/components/admin/page-header"
import { CollectionForm } from "@/components/admin/collection-form"
import { createCollectionAction } from "../actions"

export default function NewAdminCollectionPage() {
  return (
    <div>
      <AdminPageHeader title="Yeni Koleksiyon" />
      <CollectionForm mode="create" action={createCollectionAction} />
    </div>
  )
}
