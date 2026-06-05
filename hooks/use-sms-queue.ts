"use client"

import { useEffect, useRef } from "react"
import { toast } from "sonner"
import { isOffline } from "@/lib/utils/is-offline"

/**
 * Flushes the SMS queue whenever the device regains internet connectivity.
 *
 * Two-layer detection:
 *  1. window "online" event  — fires immediately in browsers and sometimes Electron
 *  2. isOffline() polling    — reliable in Electron (uses net.isOnline() via IPC)
 *     Polls every 30 s, fires processQueue when it detects offline → online transition.
 */
export function useSmsQueue() {
  const processing = useRef(false)
  const wasOffline  = useRef(isOffline()) // track previous state for transition detection

  const processQueue = async () => {
    if (processing.current) return
    if (isOffline()) return // don't try while still offline
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
      // Silently ignore — will retry on next check
    } finally {
      processing.current = false
    }
  }

  useEffect(() => {
    // Attempt flush immediately if online at mount
    if (!isOffline()) {
      processQueue()
    }

    // Browser-level online event (works in regular browsers, sometimes Electron)
    window.addEventListener("online", processQueue)

    // Polling fallback — reliable in Electron via IPC net.isOnline() check.
    // Detects offline → online transition and flushes the queue.
    const poll = setInterval(() => {
      const offline = isOffline()
      if (wasOffline.current && !offline) {
        // Just came back online
        processQueue()
      }
      wasOffline.current = offline
    }, 30_000)

    return () => {
      window.removeEventListener("online", processQueue)
      clearInterval(poll)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
