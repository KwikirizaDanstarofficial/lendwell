"use client"
import { useState } from "react"
import { KeyRound, X } from "lucide-react"

export function TempPasswordBanner() {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <div className="flex items-center gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
      <KeyRound className="h-4 w-4 shrink-0" />
      <p className="flex-1">
        You are using a temporary password.{" "}
        <a href="/settings?tab=security" className="font-medium underline underline-offset-4 hover:text-amber-900 dark:hover:text-amber-200">
          Change your password
        </a>{" "}
        to secure your account.
      </p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded p-0.5 hover:bg-amber-100 dark:hover:bg-amber-800/50"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
