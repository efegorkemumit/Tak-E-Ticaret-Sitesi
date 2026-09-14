"use client"

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionPanel,
} from "@/components/ui/accordion"
import type { CatalogAttributeDto } from "@/lib/commerce/catalog"

/**
 * `docs/COMPONENT_INVENTORY.md` #20 — açıklama/bakım bilgisi için yatay Tabs
 * yerine dikey Accordion (tek-sütun/mobil-öncelikli akışa daha uygun).
 *
 * Yalnızca gerçekten var olan veriyi gösterir. `careInfo` (bakım bilgisi)
 * şemada henüz yok (commerce/Team Lead'e bildirildi) — bu yüzden opsiyonel;
 * yoksa o panel hiç render edilmez. Hiçbir panel için içerik yoksa component
 * tamamen `null` döner (boş bir accordion göstermez).
 */
function ProductInfoAccordion({
  description,
  descriptiveAttributes,
  careInfo,
}: {
  description?: string | null
  descriptiveAttributes: CatalogAttributeDto[]
  careInfo?: string | null
}) {
  const panels = [
    description && { id: "aciklama", label: "Açıklama" },
    descriptiveAttributes.length > 0 && { id: "ozellikler", label: "Ürün Özellikleri" },
    careInfo && { id: "bakim", label: "Bakım Bilgisi" },
  ].filter(Boolean) as { id: string; label: string }[]

  if (panels.length === 0) return null

  return (
    <Accordion defaultValue={[panels[0].id]}>
      {description && (
        <AccordionItem value="aciklama">
          <AccordionTrigger>Açıklama</AccordionTrigger>
          <AccordionPanel>
            <p>{description}</p>
          </AccordionPanel>
        </AccordionItem>
      )}
      {descriptiveAttributes.length > 0 && (
        <AccordionItem value="ozellikler">
          <AccordionTrigger>Ürün Özellikleri</AccordionTrigger>
          <AccordionPanel>
            <dl className="flex flex-col gap-1.5">
              {descriptiveAttributes.map((attribute, index) => (
                <div key={`${attribute.type}-${index}`} className="flex gap-2">
                  <dt className="text-foreground/80">{attribute.label}:</dt>
                  <dd>{attribute.value}</dd>
                </div>
              ))}
            </dl>
          </AccordionPanel>
        </AccordionItem>
      )}
      {careInfo && (
        <AccordionItem value="bakim">
          <AccordionTrigger>Bakım Bilgisi</AccordionTrigger>
          <AccordionPanel>
            <p>{careInfo}</p>
          </AccordionPanel>
        </AccordionItem>
      )}
    </Accordion>
  )
}

export { ProductInfoAccordion }
