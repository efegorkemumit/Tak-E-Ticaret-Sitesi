"use client"

import { useMemo, useState, useTransition } from "react"
import { ExternalLink, Link2, Unlink } from "lucide-react"
import { updateProductShopierLinkSchema } from "@/lib/admin/schemas"
import { validateShopierUrl } from "@/lib/shopier/url"
import { Input } from "@/components/ui/input"
import { FormField } from "@/components/ui/form-field"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/admin/status-badge"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import type { AdminActionFailure } from "@/app/admin/(protected)/products/actions"

/**
 * D030 — Shopier artık checkout içinde bir ödeme SAĞLAYICISI değil, AYRI bir
 * kartlı satış kanalıdır: ürün kaydında Shopier'deki ürünün satış adresi
 * tutulur, müşteri oraya yönlendirilir. Bu yüzden bu bölüm ürünün temel
 * bilgi formundan (`product-form.tsx`) BİLİNÇLİ OLARAK ayrıdır ve kendi
 * Server Action'ını çağırır — bir satış kanalını bağlamak/kaldırmak, ürün
 * adını değiştirmekle aynı işlem değildir.
 *
 * Shopier ürün id'si SALT OKUNURDUR: elle girilmez, sunucu bağlantı
 * adresinden türetir (bkz. `lib/admin/products.ts`) — iki alanın birbiriyle
 * çelişmesi mümkün olmasın diye.
 */
function ProductShopierSection({
  productId,
  shopierProductId,
  shopierUrl,
  action,
}: {
  productId: string
  /** Sunucunun bağlantı adresinden türettiği id — bağlı değilse `null`. */
  shopierProductId: string | null
  /** KAYDEDİLMİŞ satış adresi — bağlı değilse `null`. */
  shopierUrl: string | null
  action: (input: unknown, productId: string) => Promise<AdminActionFailure | undefined>
}) {
  const [url, setUrl] = useState(shopierUrl ?? "")

  // Bkz. aşağıdaki "Aç" linkindeki sertleştirme notu: kutu HAM değeri gösterir,
  // link yalnızca doğrulamadan geçen KANONİK adrese açılır. `lib/shopier/url.ts`
  // bilinçli olarak sıfır bağımlılıklı/client-safe olduğu için burada
  // (client component) doğrudan çağrılabilir.
  const validatedShopierUrl = useMemo(() => {
    if (!shopierUrl) return null
    const validation = validateShopierUrl(shopierUrl)
    return validation.ok ? validation.url : null
  }, [shopierUrl])
  const [error, setError] = useState<string | null>(null)
  const [confirmUnlinkOpen, setConfirmUnlinkOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const isLinked = Boolean(shopierUrl)
  // Alanı boşaltmak = BAĞLANTIYI KALDIR. Geri alınabilir bir işlem gibi
  // görünse de satış kanalını kapattığı için onay ister (D029'daki
  // "arşivleme onay ister" deseniyle aynı mantık).
  const willUnlink = isLinked && url.trim() === ""

  function submit() {
    const parsed = updateProductShopierLinkSchema.safeParse({ productId, shopierUrl: url.trim() })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Geçersiz girdi.")
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await action(parsed.data, productId)
      // Sunucudan gelen mesaj OLDUĞU GİBİ gösterilir — bu kodların mesajları
      // (ör. geçersiz Shopier adresi) bizim yazdığımız Türkçe sabitlerdir.
      if (result && !result.success) setError(result.error.message)
    })
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (willUnlink) {
      setConfirmUnlinkOpen(true)
      return
    }
    submit()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted-foreground">Bağlantı durumu:</span>
        {isLinked ? (
          <Badge label="Bağlı" token="success" variant="solid" icon={Link2} />
        ) : (
          <Badge label="Bağlı değil" token="muted" variant="solid" icon={Unlink} />
        )}
      </div>

      <dl className="flex flex-wrap items-center gap-2 text-sm">
        <dt className="text-muted-foreground">Shopier Ürün ID</dt>
        <dd className="font-mono text-foreground">{shopierProductId ?? "—"}</dd>
      </dl>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <FormField label="Shopier Satış Linki" className="w-full max-w-xl">
            {(props) => (
              <Input
                {...props}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.shopier.com/12345678"
                inputMode="url"
                autoComplete="off"
                spellCheck={false}
              />
            )}
          </FormField>

          <div className="flex shrink-0 items-center gap-3">
            <Button type="submit" disabled={isPending} className="min-h-11">
              {isPending ? "Kaydediliyor…" : willUnlink ? "Bağlantıyı Kaldır" : "Kaydet"}
            </Button>
            {/* KAYDEDİLMİŞ adrese açılır (kutudaki henüz doğrulanmamış
                metne değil) — admin, müşterinin gideceği adresi test eder.

                SERTLEŞTİRME (security incelemesi N2): `shopierUrl` bu
                component'e DTO üzerinden HAM olarak gelir — bu bilinçlidir,
                admin bozuk bir değeri GÖREBİLMELİ ki düzeltebilsin (bkz.
                `lib/admin/products.ts`). Ama "görmek" ile "tıklanabilir
                kılmak" aynı şey değildir: DB'ye başka bir yoldan (elle SQL,
                yedekten geri yükleme) `javascript:...` yazılmış olsaydı,
                admin "Aç"a bastığında bu script ADMIN ORIGIN'İNDE çalışırdı.
                Bu yüzden kutu ham değeri göstermeye devam eder, ama link
                YALNIZCA doğrulamadan geçen kanonik adresle render edilir. */}
            {validatedShopierUrl && (
              <a
                href={validatedShopierUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ExternalLink className="size-4" aria-hidden="true" />
                Aç
              </a>
            )}
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <p className="text-admin-helper text-muted-foreground">
          Yalnızca Shopier&apos;in kendi satış adresleri kabul edilir (ör.{" "}
          <code className="font-mono">https://www.shopier.com/12345678</code>). Alanı boş bırakıp kaydederseniz Shopier
          bağlantısı kaldırılır.
        </p>
      </form>

      <ConfirmDialog
        open={confirmUnlinkOpen}
        onOpenChange={setConfirmUnlinkOpen}
        title="Shopier bağlantısını kaldır"
        description="Bu ürünün Shopier satış linki ve ürün id'si kaldırılacak; ürün Shopier kanalından satılmaz hâle gelir. Bağlantıyı daha sonra adresi tekrar girerek kurabilirsiniz."
        confirmLabel="Bağlantıyı Kaldır"
        destructive
        onConfirm={submit}
      />
    </div>
  )
}

export { ProductShopierSection }
