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
    if (syncingRef.current) return  // prevent overlapping syncs
    syncingRef.current = true
    try {
      // Pull all data via the server-side API route (uses supabaseAdmin, bypasses RLS).
      // saccoId is resolved server-side from the active session — no client-side JWT parsing needed.
      await pullFromSupabase(db, "")
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

  useEffect(() => {
    const disconnect = () => db.disconnect()

    // Wait for an active session then run the first sync.
    const tryInitialSync = async () => {
      for (let i = 0; i < 10; i++) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          await doSync()
          syncedRef.current = true
          return
        }
        await new Promise((r) => setTimeout(r, 500))
      }
    }
    tryInitialSync()

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
        if (session && !syncedRef.current) {
          syncedRef.current = true
          doSync()
        }
      }
    )

    return () => {
      disconnect()
      clearInterval(periodicTimer)
      window.removeEventListener("online", doSync)
      window.removeEventListener("offline", disconnect)
      subscription?.unsubscribe()
    }
  }, [db, doSync])

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
      {children}
    </PowerSyncContext.Provider>
  )
}
