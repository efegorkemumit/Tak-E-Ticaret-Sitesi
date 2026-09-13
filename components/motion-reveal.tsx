"use client"

import { useEffect, useRef, useState } from "react"
import type { ReactNode } from "react"
import { cn } from "cn"

/**
 * `docs/DESIGN_DIRECTION.md` MOTION APPROACH: sayfa başına yalnızca TEK,
 * yumuşak, tekrarlanmayan scroll-triggered fade-in. Geçiş tanımı
 * `app/globals.css`'teki `.motion-reveal-once` utility'sinde zaten var
 * (brand-ui); bu component yalnızca IntersectionObserver ile `is-visible`
 * class'ını bir kez ekleyen tetikleyicidir. Sayfa başına birden fazla
 * kullanılmamalı — motion ilkesini ihlal eder.
 */
function MotionReveal({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={cn("motion-reveal-once", visible && "is-visible", className)}
    >
      {children}
    </div>
  )
}

export { MotionReveal }
