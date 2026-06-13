"use client"

import { PowerSyncDatabase } from "@powersync/web"
import { PowerSyncContext } from "@powersync/react"
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState, createContext, useContext } from "react"
import { AppSchema } from "./schema"
import { SupabaseConnector } from "./connector"
import { pullFromSupabase } from "./sync-engine"
import { supabase } from "@/lib/supabase/client"
import { isOffline } from "@/lib/utils/is-offline"


const connector = new SupabaseConnector()

type SyncContextValue = {
  syncNow: () => Promise<void>
  jwtWarning: boolean
  syncErrors: string[]
}

const SyncContext = createContext<SyncContextValue | null>(null)

export function useSyncNow() {
  const ctx = useContext(SyncContext)
  if (!ctx) throw new Error("useSyncNow must be used inside PowerSyncProvider")
  return ctx
}

export function PowerSyncProvider({ children }: { children: ReactNode }) {
  const [jwtWarning, setJwtWarning] = useState(false)
  const [syncErrors, setSyncErrors] = useState<string[]>([])
  const syncingRef = useRef(false)

  const db = useMemo(
    () =>
      new PowerSyncDatabase({
        schema: AppSchema,
        database: { dbFilename: "sacco.db" },
      }),
    []
  )

  // Connect PowerSync on mount (required for useQuery reactivity)
  const [connected, setConnected] = useState(false)
  const initialSyncDone = useRef(false)
  useEffect(() => {
    if (connected) return
    db.connect(connector)
      .then(() => {
        setConnected(true)
        setJwtWarning(false)
        // Auto-populate data on first connect
        if (!initialSyncDone.current) {
          initialSyncDone.current = true
          pullFromSupabase(db, "").catch(() => {})
        }
      })
      .catch((err: any) => {
        if (String(err).includes("sacco_id")) setJwtWarning(true)
      })
  }, [db, connected])

  const syncNow = useCallback(async () => {
    if (syncingRef.current) return
    if (isOffline()) {
      console.log("[PowerSync] Skipping sync — offline")
      setSyncErrors([])
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

    // Restore Supabase session from Electron vault (no auto-sync).
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (destroyed) return
      if (session) return
      try {
        const el = typeof window !== "undefined" ? (window as any).electron : undefined
        if (el?.getConfig) {
          const config = await el.getConfig()
          if (destroyed) return
          if (config?.accessToken) {
            await supabase.auth.setSession({
              access_token: config.accessToken,
              refresh_token: config.refreshToken ?? config.accessToken,
            })
          }
        }
      } catch {
        // vault not available
      }
    }

    initSession()

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
      if (el?.removeFlushDbListener) {
        el.removeFlushDbListener()
      }
      window.removeEventListener("beforeunload", handleFlush)
    }
  }, [db, handleFlush])

  return (
    <PowerSyncContext.Provider value={db}>
      <SyncContext.Provider value={{ syncNow, jwtWarning, syncErrors }}>
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
      </SyncContext.Provider>
    </PowerSyncContext.Provider>
  )
}
