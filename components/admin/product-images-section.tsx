"use client"

import { useRef, useState, useTransition } from "react"
import { ArrowDown, ArrowUp, Star, Trash2 } from "lucide-react"
import { MAX_IMAGE_UPLOAD_BYTES } from "@/lib/admin/image-validation"
import { Input } from "@/components/ui/input"
import { FormField } from "@/components/ui/form-field"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { AdminDropzone } from "@/components/admin/dropzone"
import type { AdminActionFailure } from "@/app/admin/(protected)/products/actions"

interface ImageDto {
  id: string
  url: string
  alt: string
  isPlaceholder: boolean
  sortOrder: number
}

const ACCEPTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"]

/**
 * D024 — çoklu görsel yükleme/sıralama/ana görsel/silme.
 *
 * `next/image` YERİNE bilinçli olarak düz `<img>` kullanılır: aktif storage
 * adaptörü (yerel/S3) `docs/DECISIONS.md` D024'te hâlâ OPEN, `next.config.ts`
 * `images.remotePatterns`'ı somut bir sağlayıcı host'una bağlamak bu kararı
 * erkenden sabitler (bkz. bu turun §15 analizi) — admin panelinde (müşteri
 * yüzü OLMAYAN, performans kritik olmayan bir araç) `next/image` şart değil.
 *
 * Görsel doğrulamasının OTORİTER kaynağı sunucudur (`validateImageUpload`,
 * gerçek magic-byte kontrolü, `uploadProductImage` içinde çalışır). Burada
 * `Buffer` (tarayıcıda mevcut değil) gerektiren o fonksiyon DEĞİL, yalnızca
 * boyut + tarayıcının bildirdiği (GÜVENİLMEYEN) `file.type`'a dayalı erken
 * geri bildirim için hafif bir ön kontrol yapılır.
 */
function ProductImagesSection({
  productId,
  images,
  uploadAction,
  deleteAction,
  reorderAction,
  setMainAction,
}: {
  productId: string
  images: ImageDto[]
  uploadAction: (formData: FormData) => Promise<AdminActionFailure | undefined>
  deleteAction: (imageId: string, productId: string) => Promise<AdminActionFailure | undefined>
  reorderAction: (productId: string, orderedImageIds: string[]) => Promise<AdminActionFailure | undefined>
  setMainAction: (productId: string, imageId: string) => Promise<AdminActionFailure | undefined>
}) {
  const sorted = [...images].sort((a, b) => a.sortOrder - b.sortOrder)
  const [reorderPendingId, setReorderPendingId] = useState<string | null>(null)
  const [isReordering, startReorderTransition] = useTransition()
  const [isSettingMain, startSetMainTransition] = useTransition()
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [isDeleting, startDeleteTransition] = useTransition()
  const [sectionError, setSectionError] = useState<string | null>(null)

  function moveImage(index: number, direction: -1 | 1) {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= sorted.length) return
    const next = [...sorted]
    ;[next[index], next[targetIndex]] = [next[targetIndex], next[index]]
    const orderedIds = next.map((image) => image.id)
    setReorderPendingId(sorted[index].id)
    setSectionError(null)
    startReorderTransition(async () => {
      const result = await reorderAction(productId, orderedIds)
      if (result && !result.success) setSectionError(result.error.message)
      setReorderPendingId(null)
    })
  }

  function handleSetMain(imageId: string) {
    setSectionError(null)
    startSetMainTransition(async () => {
      const result = await setMainAction(productId, imageId)
      if (result && !result.success) setSectionError(result.error.message)
    })
  }

  function handleDelete(imageId: string) {
    setSectionError(null)
    startDeleteTransition(async () => {
      const result = await deleteAction(imageId, productId)
      if (result && !result.success) setSectionError(result.error.message)
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {sectionError && <p className="text-sm text-destructive">{sectionError}</p>}

      {sorted.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {sorted.map((image, index) => (
            <div key={image.id} className="flex flex-col gap-2 rounded-lg border border-border p-2">
              <div className="relative aspect-square w-full overflow-hidden rounded-md bg-surface-muted">
                {/* eslint-disable-next-line @next/next/no-img-element -- bkz. dosya başı yorumu: D024 OPEN olduğu için next/image bilinçli olarak kullanılmıyor */}
                <img src={image.url} alt={image.alt} className="size-full object-cover" />
                {image.sortOrder === 0 && (
                  <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-xs font-medium text-foreground">
                    <Star className="size-3 fill-current" /> Ana görsel
                  </span>
                )}
                {image.isPlaceholder && (
                  <span className="absolute right-2 top-2 rounded-full bg-background/90 px-2 py-0.5 text-xs text-muted-foreground">
                    Örnek
                  </span>
                )}
              </div>
              <p className="truncate text-xs text-muted-foreground" title={image.alt}>
                {image.alt}
              </p>
              <div className="flex items-center justify-between gap-1">
                {image.sortOrder === 0 ? (
                  <span className="h-9" />
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isSettingMain}
                    onClick={() => handleSetMain(image.id)}
                    className="h-9 w-fit gap-1 px-2"
                  >
                    <Star className="size-3.5" /> Ana yap
                  </Button>
                )}
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label="Yukarı taşı"
                    disabled={index === 0 || (isReordering && reorderPendingId !== null)}
                    onClick={() => moveImage(index, -1)}
                  >
                    <ArrowUp className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label="Aşağı taşı"
                    disabled={index === sorted.length - 1 || (isReordering && reorderPendingId !== null)}
                    onClick={() => moveImage(index, 1)}
                  >
                    <ArrowDown className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon-sm"
                    aria-label="Görseli sil"
                    disabled={isDeleting}
                    onClick={() => setDeleteTargetId(image.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <UploadImageForm productId={productId} action={uploadAction} />

      <ConfirmDialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
        title="Görseli sil"
        description="Bu görsel üründen kaldırılacak. Bu işlem geri alınamaz."
        confirmLabel="Sil"
        destructive
        onConfirm={() => {
          if (deleteTargetId) handleDelete(deleteTargetId)
        }}
      />
    </div>
  )
}

function UploadImageForm({
  productId,
  action,
}: {
  productId: string
  action: (formData: FormData) => Promise<AdminActionFailure | undefined>
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [alt, setAlt] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const file = fileInputRef.current?.files?.[0]

    if (!file) {
      setError("Lütfen bir dosya seçin.")
      return
    }
    if (alt.trim().length === 0) {
      setError("Görsel açıklaması (alt metni) zorunludur.")
      return
    }
    // Yalnızca erken UX geri bildirimi — OTORİTER doğrulama sunucuda
    // gerçek magic-byte kontrolüyle yapılır (bkz. dosya başı yorumu).
    if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
      setError(`Dosya çok büyük (maksimum ${MAX_IMAGE_UPLOAD_BYTES / (1024 * 1024)} MB).`)
      return
    }
    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      setError("Desteklenmeyen görsel formatı. Yalnızca JPEG, PNG, WebP veya AVIF kabul edilir.")
      return
    }
    setError(null)

    const formData = new FormData()
    formData.set("productId", productId)
    formData.set("alt", alt)
    formData.set("file", file)

    startTransition(async () => {
      const result = await action(formData)
      if (result && !result.success) {
        setError(result.error.message)
        return
      }
      setAlt("")
      if (fileInputRef.current) fileInputRef.current.value = ""
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-start">
      <AdminDropzone
        ref={fileInputRef}
        accept={ACCEPTED_MIME_TYPES.join(",")}
        helperText="JPEG, PNG, WebP, AVIF — maks. 8MB"
        className="sm:w-72"
      />
      <div className="flex flex-1 flex-col gap-3 sm:pt-0">
        <FormField label="Alt Metni">
          {(props) => <Input {...props} value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Ürünü tanımlayan kısa metin" />}
        </FormField>
        <Button type="submit" disabled={isPending} className="min-h-11 w-fit">
          {isPending ? "Yükleniyor…" : "Görsel Yükle"}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </form>
  )
}

export { ProductImagesSection }
