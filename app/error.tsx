"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

/**
 * Route segment error boundary (Next.js App Router zorunlu kılıyor: "use
 * client"). Root layout'un (Header/Footer) İÇİNDE, sayfa içeriğinin YERİNE
 * render edilir — Header/Footer görünür kalır, yalnızca ana içerik alanı bu
 * jenerik ekranla değişir.
 *
 * Security review önerisi: kullanıcıya ham hata mesajı/stack trace ASLA
 * gösterilmez (`error.message`/`error.digest` burada render edilmiyor,
 * yalnızca sunucu tarafı log'a yazılıyor) — Next'in production'da zaten
 * client'a sızdırmadığı bilgiyi burada da tekrar sızdırmamak için bilinçli
 * bir tercih, salt jenerik bir mesaj gösterilir.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Route segment error:", error)
  }, [error])

  return (
    <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <h1 className="font-display text-2xl text-foreground">Bir şeyler ters gitti</h1>
      <p className="text-sm text-muted-foreground">
        Sayfa yüklenirken beklenmeyen bir sorun oluştu. Lütfen tekrar deneyin.
      </p>
      <Button onClick={() => reset()}>Tekrar Dene</Button>
    </div>
  )
}
