"use client"

import { useEffect, useState } from "react"
import { useTheme } from "@/components/providers/theme-provider"

export function PageLoader() {
  const [progress, setProgress] = useState(1)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        // Hold at 90 — Next.js unmounts this component when the page is ready
        if (p >= 90) {
          clearInterval(interval)
          return 90
        }
        const increment = p < 50 ? 5 : p < 75 ? 2 : 1
        return p + increment
      })
    }, 20)
    return () => clearInterval(interval)
  }, [])

  const logo =
    resolvedTheme === "dark"
      ? "/lendwell-logo-primary.svg"
      : "/lendwell-logo-dark.svg"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-5 rounded-2xl border bg-card px-14 py-10 shadow-xl">
        {/* Logo */}
        <img src={logo} alt="Logo" className="h-10 object-contain" />

        {/* Counter */}
        <div className="text-5xl font-bold tabular-nums tracking-tight text-foreground">
          {progress}
        </div>

        {/* Progress bar */}
        <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Label */}
        <p className="text-sm text-muted-foreground text-center max-w-[200px] leading-snug">
          Please wait while data is loading…
        </p>
      </div>
    </div>
  )
}
