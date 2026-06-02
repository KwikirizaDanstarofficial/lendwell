"use client"

import { PowerSyncDatabase } from "@powersync/web"
import { PowerSyncContext } from "@powersync/react"
import { ReactNode, useEffect, useMemo, useState } from "react"
import { AppSchema } from "./schema"
import { SupabaseConnector } from "./connector"

const connector = new SupabaseConnector()

export function PowerSyncProvider({ children }: { children: ReactNode }) {
  const [jwtWarning, setJwtWarning] = useState(false)

  const db = useMemo(
    () =>
      new PowerSyncDatabase({
        schema: AppSchema,
        database: { dbFilename: "sacco.db" },
      }),
    []
  )

  useEffect(() => {
    const connect = async () => {
      try {
        await db.connect(connector)
        setJwtWarning(false)
      } catch (err: any) {
        if (String(err).includes("sacco_id")) {
          setJwtWarning(true)
        }
      }
    }
    const disconnect = () => db.disconnect()

    if (navigator.onLine) connect()
    window.addEventListener("online", connect)
    window.addEventListener("offline", disconnect)

    return () => {
      disconnect()
      window.removeEventListener("online", connect)
      window.removeEventListener("offline", disconnect)
    }
  }, [db])

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
