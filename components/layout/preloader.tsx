"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

export function Preloader() {
  const [loading, setLoading] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(timer)
  }, [pathname])

  if (!loading) return null

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="flex aspect-square size-14 animate-bounce items-center justify-center rounded-2xl shadow-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 80 80"
            fill="none"
            className="h-8 w-8"
          >
            <defs>
              <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#B45309" />
              </linearGradient>
            </defs>
            <polygon points="40,4 72,22 72,58 40,76 8,58 8,22" fill="#0F172A" />
            <polygon
              points="40,4 72,22 72,58 40,76 8,58 8,22"
              stroke="url(#g1)"
              strokeWidth="2"
              fill="none"
            />
            <rect
              x="20"
              y="28"
              width="40"
              height="7"
              rx="3.5"
              fill="url(#g1)"
            />
            <rect
              x="24"
              y="40"
              width="32"
              height="7"
              rx="3.5"
              fill="url(#g1)"
              opacity="0.7"
            />
            <rect
              x="28"
              y="52"
              width="24"
              height="7"
              rx="3.5"
              fill="url(#g1)"
              opacity="0.45"
            />
          </svg>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:0ms]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:150ms]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:300ms]" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}
