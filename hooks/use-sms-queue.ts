"use client"

import { useEffect, useRef } from "react"
import { toast } from "sonner"

/**
 * Fires POST /api/sms/process-queue whenever the browser/Electron app
 * regains internet connectivity, flushing any SMS messages that were
 * queued while offline.
 */
export function useSmsQueue() {
  const processing = useRef(false)

  const processQueue = async () => {
    if (processing.current) return
    processing.current = true
    try {
      const res = await fetch("/api/sms/process-queue", { method: "POST" })
      if (!res.ok) return
      const { sent, remaining } = await res.json()
      if (sent > 0) {
        toast.success(
          `${sent} queued SMS notification${sent > 1 ? "s" : ""} sent successfully.`,
          { duration: 5000 }
        )
      }
      if (remaining > 0) {
        console.warn(`[SMS Queue] ${remaining} messages still pending after processing`)
      }
    } catch {
      // Silently ignore — will retry on next online event
    } finally {
      processing.current = false
    }
  }

  useEffect(() => {
    // Process queue immediately if we're already online when component mounts
    if (navigator.onLine) {
      processQueue()
    }

    window.addEventListener("online", processQueue)
    return () => window.removeEventListener("online", processQueue)
  }, [])
}
