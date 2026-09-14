import { Shapes } from "lucide-react"
import { listAttributeDefinitionsForAdmin } from "@/lib/admin"
import { AdminPageHeader } from "@/components/admin/page-header"
import { AttributeDefinitionForm } from "@/components/admin/attribute-definition-form"
import { AttributeValueForm } from "@/components/admin/attribute-value-form"
import { EmptyState } from "@/components/ui/empty-state"
import { createAttributeDefinitionAction, createAttributeValueAction } from "./actions"

export const dynamic = "force-dynamic"

/**
 * D028 — öznitelik TİPİ (ör. "materyal") ve her tipin DEĞERLERİ (ör. "Gümüş",
 * "Altın") burada yönetilir. D020'nin seçilebilir/açıklayıcı ayrımı bu
 * ekranda YOKTUR — o ayrım bir değerin bir varyanta mı yoksa bir ürüne mi
 * bağlandığı (`products/[id]` sayfasındaki varyant/açıklayıcı öznitelik
 * formları) anında kurulur, tipin/değerin kendisinde değil.
 */
export default async function AdminAttributesPage() {
  const definitions = await listAttributeDefinitionsForAdmin()

  return (
    <div className="flex flex-col gap-8">
      <div>
        <AdminPageHeader title="Öznitelikler" description="Ürün/varyant seçiminde kullanılan öznitelik tipleri ve değerleri." />
        <div className="rounded-md border border-border p-4">
          <h3 className="mb-3 text-sm font-medium text-foreground">Yeni Öznitelik Tipi</h3>
          <AttributeDefinitionForm action={createAttributeDefinitionAction} />
        </div>
      </div>

      {definitions.length === 0 ? (
        <EmptyState
          icon={<Shapes className="size-8" />}
          title="Henüz öznitelik tipi yok"
          description="Yukarıdaki formla ilk öznitelik tipini (ör. materyal, taş türü) oluşturun."
          className="py-10"
        />
      ) : (
        <div className="flex flex-col gap-4">
          {definitions.map((definition) => (
            <div key={definition.id} className="rounded-md border border-border p-4">
              <div className="mb-3 flex flex-wrap items-baseline gap-2">
                <h3 className="text-sm font-medium text-foreground">{definition.label}</h3>
                <span className="text-xs text-muted-foreground">{definition.key}</span>
              </div>

              {definition.values.length === 0 ? (
                <p className="mb-3 text-sm text-muted-foreground">Henüz değer eklenmedi.</p>
              ) : (
                <ul className="mb-3 flex flex-wrap gap-2">
                  {definition.values.map((value) => (
                    <li
                      key={value.id}
                      className="rounded-full border border-border px-3 py-1 text-sm text-foreground"
                    >
                      {value.value}
                    </li>
                  ))}
                </ul>
              )}

              <AttributeValueForm attributeDefinitionId={definition.id} action={createAttributeValueAction} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
