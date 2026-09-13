"use client"

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionPanel,
} from "@/components/ui/accordion"
import { getAttributeTypeLabel } from "@/lib/catalog"
import type { ProductAttribute } from "@/lib/catalog"

/**
 * `docs/COMPONENT_INVENTORY.md` #20 — açıklama/bakım bilgisi için yatay Tabs
 * yerine dikey Accordion (tek-sütun/mobil-öncelikli akışa daha uygun).
 *
 * Yalnızca fixture'da gerçekten var olan veriyi gösterir: sabit (seçilemeyen)
 * öznitelikler ve `careInfo`. Kargo/iade gibi henüz OPEN olan (#5-7, #13)
 * politika metinleri burada UYDURULMAZ — bu panel eklenmedi.
 */
function ProductInfoAccordion({
  constantAttributes,
  careInfo,
}: {
  constantAttributes: ProductAttribute[]
  careInfo: string
}) {
  const defaultOpen = constantAttributes.length > 0 ? ["ozellikler"] : ["bakim"]

  return (
    <Accordion defaultValue={defaultOpen}>
      {constantAttributes.length > 0 && (
        <AccordionItem value="ozellikler">
          <AccordionTrigger>Ürün Özellikleri</AccordionTrigger>
          <AccordionPanel>
            <dl className="flex flex-col gap-1.5">
              {constantAttributes.map((attribute) => (
                <div key={attribute.type} className="flex gap-2">
                  <dt className="text-foreground/80">{getAttributeTypeLabel(attribute.type)}:</dt>
                  <dd>{attribute.value}</dd>
                </div>
              ))}
            </dl>
          </AccordionPanel>
        </AccordionItem>
      )}
      <AccordionItem value="bakim">
        <AccordionTrigger>Bakım Bilgisi</AccordionTrigger>
        <AccordionPanel>
          <p>{careInfo}</p>
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  )
}

export { ProductInfoAccordion }
