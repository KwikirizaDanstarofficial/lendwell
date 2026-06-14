"use client"

import { useState, useRef, useEffect } from "react"
import { Lock, AlertCircle, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"

interface AppLockScreenProps {
  onUnlock: (pin: string) => boolean
  onForgotPin: () => void
  logo?: string
}

export function AppLockScreen({ onUnlock, onForgotPin, logo }: AppLockScreenProps) {
  const [pin, setPin] = useState("")
  const [error, setError] = useState(false)
  const [shaking, setShaking] = useState(false)

  const handleDigit = (d: string) => {
    if (pin.length >= 4) return
    setError(false)
    setPin((prev) => {
      const next = prev + d
      if (next.length === 4) {
        const ok = onUnlock(next)
        if (!ok) {
          setError(true)
          setShaking(true)
          setTimeout(() => setShaking(false), 500)
          return ""
        }
      }
      return next
    })
  }

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1))
    setError(false)
  }

  const digits = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["", "0", ""],
  ]

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background">
      <div className={cn("flex flex-col items-center gap-8", shaking && "animate-shake")}>
        {logo ? (
          <img src={logo} alt="Logo" className="h-12 object-contain" />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Lock className="h-7 w-7 text-primary" />
          </div>
        )}

        <div className="text-center">
          <h1 className="text-xl font-semibold tracking-tight">App Locked</h1>
          <p className="mt-1 text-sm text-muted-foreground">Enter your PIN to unlock</p>
        </div>

        <div className="flex gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-3 w-3 rounded-full border-2 border-muted-foreground/40 transition-all duration-150",
                i < pin.length && "border-primary bg-primary",
                error && "border-destructive bg-destructive"
              )}
            />
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-1.5 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            Incorrect PIN
          </div>
        )}

        <div className="flex flex-col gap-3">
          {digits.map((row, ri) => (
            <div key={ri} className="flex justify-center gap-3">
              {row.map((d, di) =>
                d === "" ? (
                  <div key={di} className="w-16 h-16" />
                ) : (
                  <button
                    key={di}
                    type="button"
                    onClick={() => handleDigit(d)}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-xl font-semibold text-foreground transition-colors hover:bg-muted/80 active:scale-95 select-none"
                  >
                    {d}
                  </button>
                )
              )}
            </div>
          ))}
        </div>

        {pin.length > 0 && (
          <button
            type="button"
            onClick={handleDelete}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Delete
          </button>
        )}

        <button
          type="button"
          onClick={onForgotPin}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="h-3 w-3" />
          Forgot PIN? Sign out & reset
        </button>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  )
}
