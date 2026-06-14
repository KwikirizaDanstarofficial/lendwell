"use client"

import { PowerSyncDatabase } from "@powersync/web"
import { PowerSyncContext } from "@powersync/react"
import { ReactNode, useEffect, useMemo } from "react"
import { AppSchema } from "./schema"
import { SupabaseConnector } from "./connector"
import { supabase } from "@/lib/supabase/client"

/**
 * No-op hook since PowerSync Cloud handles sync automatically via `db.connect()`.
 * Callers that previously used this to trigger a manual pull can safely keep
 * the import — it just resolves immediately.
 */
export function useSyncNow() {
  return {
    syncNow: async () => {},
    syncErrors: [] as string[],
  }
}

export function PowerSyncProvider({ children }: { children: ReactNode }) {
  const db = useMemo(
    () =>
      new PowerSyncDatabase({
        schema: AppSchema,
        database: { dbFilename: "sacco.db" },
      }),
    []
  )

  useEffect(() => {
    let destroyed = false
    const connector = new SupabaseConnector()

    const init = async () => {
      // Restore Supabase session from Electron vault
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          const el = typeof window !== "undefined" ? (window as any).electron : undefined
          if (el?.getConfig) {
            const config = await el.getConfig()
            if (!destroyed && config?.accessToken && config?.refreshToken) {
              // setSession auto-refreshes if access token is expired
              const { data: { session: restored } } = await supabase.auth.setSession({
                access_token:  config.accessToken,
                refresh_token: config.refreshToken,
              })
              // Save refreshed tokens back to vault
              if (restored) {
                await el.setConfig({
                  accessToken:  restored.access_token,
                  refreshToken: restored.refresh_token,
                })
              }
            }
          }
        }
      } catch {
        // vault not available — web fallback, session already in browser storage
      }

      if (!destroyed) {
        // Starts BOTH upload and download sync
        await db.connect(connector).catch(console.error)
      }
    }

    init()

    // Keep vault updated whenever Supabase silently refreshes the token
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "TOKEN_REFRESHED" && session) {
          const el = typeof window !== "undefined" ? (window as any).electron : undefined
          el?.setConfig?.({
            accessToken:  session.access_token,
            refreshToken: session.refresh_token,
          })
          console.log("[Auth] Token refreshed and saved to vault")
        }
      }
    )

    // Electron: flush database on shutdown signal.
    // IMPORTANT: db.disconnect() does NOT delete any SQLite data.
    // It only closes the connection cleanly and checkpoints the WAL
    // back to the main sacco.db file on disk — all local data is preserved.
    // This prevents SQLite corruption on hard shutdowns (power cuts).
    const handleFlush = async () => {
      try { await db.disconnect() } catch {}
      const el = typeof window !== "undefined" ? (window as any).electron : undefined
      if (el?.dbFlushed) await el.dbFlushed()
    }

    const el = typeof window !== "undefined" ? (window as any).electron : undefined
    if (el?.onFlushDb) el.onFlushDb(handleFlush)
    window.addEventListener("beforeunload", handleFlush)

    return () => {
      destroyed = true
      subscription.unsubscribe()
      db.disconnect().catch(() => {})
      if (el?.removeFlushDbListener) el.removeFlushDbListener()
      window.removeEventListener("beforeunload", handleFlush)
    }
  }, [db])

  return (
    <PowerSyncContext.Provider value={db}>
      {children}
    </PowerSyncContext.Provider>
  )
}
