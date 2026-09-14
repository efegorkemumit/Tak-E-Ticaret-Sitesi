import { Shapes } from "lucide-react"
import { listAttributeDefinitionsForAdmin } from "@/lib/admin"
import { AdminPageHeader } from "@/components/admin/page-header"
import { AdminFormSection } from "@/components/admin/form-section"
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
 *
 * VIDEO 08 STEP 3 (part 2) — Kategori/Koleksiyon'la AYNI kart/tipografi
 * dili (`AdminFormSection`, `EmptyState`), ama BİLİNÇLİ OLARAK aynı
 * "tıklanabilir satır → düzenleme sayfası" yapısında DEĞİL: `lib/admin/
 * attributes.ts`'te bir `updateAttributeDefinition`/silme fonksiyonu YOK
 * (kasıtlı, dosya başı yorumu) — gidilecek bir düzenleme sayfası zaten
 * yok, bu yüzden kartlar liste + inline "değer ekle" formu olarak kalıyor.
 */
export default async function AdminAttributesPage() {
  const definitions = await listAttributeDefinitionsForAdmin()

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader title="Öznitelikler" description="Ürün/varyant seçiminde kullanılan öznitelik tipleri ve değerleri." />

      <AdminFormSection title="Yeni Öznitelik Tipi">
        <AttributeDefinitionForm action={createAttributeDefinitionAction} />
      </AdminFormSection>

      {definitions.length === 0 ? (
        <EmptyState
          icon={<Shapes className="size-8" />}
          title="Henüz öznitelik tipi yok"
          description="Yukarıdaki formla ilk öznitelik tipini (ör. materyal, taş türü) oluşturun."
          className="py-10"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {definitions.map((definition) => (
            <AdminFormSection key={definition.id} title={definition.label} description={definition.key}>
              {definition.values.length === 0 ? (
                <p className="text-sm text-muted-foreground">Henüz değer eklenmedi.</p>
              ) : (
                <ul className="flex flex-wrap gap-2">
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
            </AdminFormSection>
          ))}
        </div>
      )}
    </div>
  )
}
