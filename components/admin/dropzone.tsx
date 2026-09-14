"use client"

import { forwardRef, useId, useState } from "react"
import { ImagePlus } from "lucide-react"
import { cn } from "cn"

/**
 * VIDEO 08 STEP 3 (part 2) — `docs/DESIGN_DIRECTION.md`'nin "Dosya yükleme"
 * anatomisiyle BİREBİR: native `<input type="file">` `sr-only` (erişilebilirlik
 * BOZULMADI), yerine `ImagePlus` ikonlu, tıklanabilir + gerçek sürükle-bırak
 * destekli bir dropzone. Upload/storage MANTIĞINA dokunulmadı — bu yalnızca
 * görünüm/etkileşim katmanı; seçilen/bırakılan dosya, çağıranın zaten sahip
 * olduğu `handleSubmit`/doğrulama akışına AYNEN gider (`onFileChange`).
 */
const AdminDropzone = forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input"> & { onFileChange?: (file: File | null) => void; helperText: string }
>(function AdminDropzone({ className, onChange, onFileChange, helperText, id, ...props }, ref) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const [fileName, setFileName] = useState<string | null>(null)
  const [isDraggingOver, setIsDraggingOver] = useState(false)

  function applyFile(file: File | null) {
    setFileName(file?.name ?? null)
    onFileChange?.(file)
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label
        htmlFor={inputId}
        onDragOver={(event) => {
          event.preventDefault()
          setIsDraggingOver(true)
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={(event) => {
          event.preventDefault()
          setIsDraggingOver(false)
          const file = event.dataTransfer.files?.[0]
          if (!file) return
          // Native input'un kendi `files` listesini de senkron tut — form
          // submit'i hâlâ `fileInputRef.current.files`'tan okuyor (bkz.
          // `product-images-section.tsx`), sürükle-bırakla gelen dosya da
          // AYNI yoldan geçmeli, ayrı bir "sürüklenen dosya" state'i YOK.
          const transfer = new DataTransfer()
          transfer.items.add(file)
          const inputEl = document.getElementById(inputId) as HTMLInputElement | null
          if (inputEl) {
            inputEl.files = transfer.files
            inputEl.dispatchEvent(new Event("change", { bubbles: true }))
          }
        }}
        className={cn(
          "flex min-h-32 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed bg-surface-muted px-6 py-8 text-center transition-colors",
          "has-[:focus-visible]:outline-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
          isDraggingOver ? "border-primary bg-primary/5" : "border-border hover:border-foreground/40"
        )}
      >
        <ImagePlus className="size-6 text-muted-foreground" aria-hidden="true" />
        <span className="text-sm text-muted-foreground">
          {fileName ?? "Görsel yükle veya sürükleyip bırakın"}
        </span>
        <span className="text-admin-helper text-muted-foreground">{helperText}</span>
        <input
          {...props}
          ref={ref}
          id={inputId}
          type="file"
          className="sr-only"
          onChange={(event) => {
            applyFile(event.target.files?.[0] ?? null)
            onChange?.(event)
          }}
        />
      </label>
    </div>
  )
})

export { AdminDropzone }
