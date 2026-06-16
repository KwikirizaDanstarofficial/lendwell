"use client"

import { PowerSyncDatabase } from "@powersync/web"
import { PowerSyncContext } from "@powersync/react"
import { ReactNode, useEffect, useMemo } from "react"
import { AppSchema } from "./schema"
import { SupabaseConnector } from "./connector"
import { supabase } from "@/lib/supabase/client"
import type { AuthChangeEvent, Session } from "@supabase/supabase-js"

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
    const el = typeof window !== "undefined" ? (window as any).electron : undefined

    const init = async () => {
      // Restore Supabase session from Electron vault
      try {
        const sessionResponse = await supabase.auth.getSession()
        const session = sessionResponse.data?.session

        if (!session && el?.getConfig) {
          const config = await el.getConfig()
          if (!destroyed && config?.accessToken && config?.refreshToken) {
            // setSession auto-refreshes if access token is expired
            const restoredResponse = await supabase.auth.setSession({
              access_token: config.accessToken,
              refresh_token: config.refreshToken,
            })
            const restored = restoredResponse.data?.session
            if (restored && el?.setConfig) {
              await el.setConfig({
                accessToken: restored.access_token ?? config.accessToken,
                refreshToken: restored.refresh_token ?? config.refreshToken,
              })
            }
          }
        }
      } catch {
        // vault not available — web fallback, session already in browser storage
      }

      if (!destroyed) {
        // Starts BOTH upload and download sync
        // Timeout after 5s so the app isn't blocked when offline
        await Promise.race([
          db.connect(connector),
          new Promise((_, reject) => setTimeout(() => reject(new Error("connect timeout")), 5000)),
        ]).catch((err) => console.warn("[PowerSync] connect skipped:", err?.message ?? err))
      }
    }

    init()

    // Keep vault updated whenever Supabase silently refreshes the token
    const { data } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        if (event === "TOKEN_REFRESHED" && session) {
          el?.setConfig?.({
            accessToken: session.access_token,
            refreshToken: session.refresh_token,
          })
          // Also persist to localStorage
          try {
            localStorage.setItem("lendwell-session", JSON.stringify({
              accessToken: session.access_token,
              refreshToken: session.refresh_token,
              savedAt: Date.now(),
            }))
          } catch {}
          console.log("[Auth] Token refreshed and saved to vault")
        }
      }
    )
    const subscription = data?.subscription

    // Electron: flush database on shutdown signal.
    // IMPORTANT: db.disconnect() does NOT delete any SQLite data.
    // It only closes the connection cleanly and checkpoints the WAL
    // back to the main sacco.db file on disk — all local data is preserved.
    // This prevents SQLite corruption on hard shutdowns (power cuts).
    const handleFlush = async () => {
      try { await db.disconnect() } catch {}
      if (el?.dbFlushed) await el.dbFlushed()
    }

    if (el?.onFlushDb) el.onFlushDb(handleFlush)
    window.addEventListener("beforeunload", handleFlush)

    return () => {
      destroyed = true
      subscription?.unsubscribe()
      db.disconnect().catch(() => {})
      if (el?.removeFlushDbListener) el.removeFlushDbListener(handleFlush)
      window.removeEventListener("beforeunload", handleFlush)
    }
  }, [db])

  return (
    <PowerSyncContext.Provider value={db}>
      {children}
    </PowerSyncContext.Provider>
  )
}
