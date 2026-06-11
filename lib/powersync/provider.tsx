"use client"

import { PowerSyncDatabase } from "@powersync/web"
import { PowerSyncContext } from "@powersync/react"
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AppSchema } from "./schema"
import { SupabaseConnector } from "./connector"
import { pullFromSupabase } from "./sync-engine"
import { supabase } from "@/lib/supabase/client"
import type { AuthChangeEvent, Session } from "@supabase/supabase-js"


const connector = new SupabaseConnector()

/** How often to re-sync in the background while the app is open (ms). */
const AUTO_SYNC_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

export function PowerSyncProvider({ children }: { children: ReactNode }) {
  const [jwtWarning, setJwtWarning] = useState(false)
  const [syncErrors, setSyncErrors] = useState<string[]>([])
  const syncedRef = useRef(false)
  const syncingRef = useRef(false)

  const db = useMemo(
    () =>
      new PowerSyncDatabase({
        schema: AppSchema,
        database: { dbFilename: "sacco.db" },
      }),
    []
  )

  const doSync = useCallback(async () => {
    if (syncingRef.current) return
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      console.log("[PowerSync] Skipping sync — offline")
      return
    }
    syncingRef.current = true
    setSyncErrors([])
    try {
      const result = await pullFromSupabase(db, "")
      if (result.errors.length > 0) {
        setSyncErrors(result.errors)
        console.error("[PowerSync] Sync errors:", result.errors)
      } else {
        console.log("[PowerSync] Sync OK —", result.total, "rows")
      }
    } catch (err) {
      console.error("[PowerSync] Direct pull failed:", err)
    } finally {
      syncingRef.current = false
    }

    // Connect to PowerSync cloud for ongoing real-time sync (optional — may fail if JWT missing sacco_id).
    try {
      await db.connect(connector)
      setJwtWarning(false)
    } catch (err: any) {
      if (String(err).includes("sacco_id")) {
        setJwtWarning(true)
      }
    }
  }, [db])

  // Flush handler — gracefully close the database connection on shutdown
  const handleFlush = useCallback(async () => {
    try {
      await db.disconnect()
    } catch {
      // DB may already be disconnected
    }
    const el = typeof window !== "undefined" ? (window as any).electron : undefined
    if (el?.dbFlushed) {
      await el.dbFlushed()
    }
  }, [db])

  useEffect(() => {
    const disconnect = () => db.disconnect()
    let destroyed = false

    // Wait for the Supabase session to be restored before syncing.
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      if (destroyed) return
      if (session) {
        doSync().then(() => { syncedRef.current = true })
      }
    })

    // Re-sync periodically while the app is open.
    const periodicTimer = setInterval(() => {
      doSync()
    }, AUTO_SYNC_INTERVAL_MS)

    // Sync immediately when the network comes back online.
    window.addEventListener("online", doSync)
    window.addEventListener("offline", disconnect)

    // Sync on sign-in / session restore.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        if (session) {
          doSync()
        }
      }
    )

    // Electron: flush database when main process signals shutdown
    const el = typeof window !== "undefined" ? (window as any).electron : undefined
    if (el?.onFlushDb) {
      el.onFlushDb(handleFlush)
    }

    // Browser fallback: flush on beforeunload
    window.addEventListener("beforeunload", handleFlush)

    return () => {
      destroyed = true
      disconnect()
      clearInterval(periodicTimer)
      window.removeEventListener("online", doSync)
      window.removeEventListener("offline", disconnect)
      subscription?.unsubscribe()
      if (el?.removeFlushDbListener) {
        el.removeFlushDbListener()
      }
      window.removeEventListener("beforeunload", handleFlush)
    }
  }, [db, doSync, handleFlush])

  return (
    <PowerSyncContext.Provider value={db}>
      {jwtWarning && (
        <div className="fixed bottom-4 left-4 right-4 z-[9999] max-w-xl mx-auto bg-red-900/95 border border-red-500/50 rounded-xl px-4 py-3 text-sm text-red-200 shadow-xl backdrop-blur">
          <strong className="text-red-100">⚠ Sync disabled — JWT missing sacco_id</strong>
          <p className="text-xs mt-1 text-red-300">
            Set up the Supabase custom_access_token_hook (see POWERSYNC_JWT_SETUP.md),
            then <strong>sign out and sign back in</strong> to fix this.
            Your offline data is safe.
          </p>
        </div>
      )}
      {syncErrors.length > 0 && (
        <div className="fixed bottom-20 left-4 right-4 z-[9999] max-w-xl mx-auto bg-orange-900/95 border border-orange-500/50 rounded-xl px-4 py-3 text-sm text-orange-200 shadow-xl backdrop-blur">
          <strong className="text-orange-100">⚠ Sync pull failed</strong>
          <ul className="text-xs mt-1 space-y-0.5 text-orange-300">
            {syncErrors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
          <p className="text-xs mt-1 text-orange-400">
            Check DevTools Console (Ctrl+Shift+I) for details.
          </p>
        </div>
      )}
      {children}
    </PowerSyncContext.Provider>
  )
}
