"use client"

import { PowerSyncDatabase } from "@powersync/web"
import { PowerSyncContext } from "@powersync/react"
import { ReactNode, useEffect, useMemo } from "react"
import { AppSchema } from "./schema"
import { SupabaseConnector } from "./connector"

const connector = new SupabaseConnector()

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
    // Only connect when online so PowerSync doesn't receive an empty sync
    // bucket (caused by missing sacco_id JWT claim) and clear local data.
    const connect = () => db.connect(connector)
    const disconnect = () => db.disconnect()

    if (navigator.onLine) {
      connect()
    }

    window.addEventListener("online", connect)
    window.addEventListener("offline", disconnect)

    return () => {
      disconnect()
      window.removeEventListener("online", connect)
      window.removeEventListener("offline", disconnect)
    }
  }, [db])

  // Always provide the context — db is created synchronously so it's
  // available on first render. connect() is async and starts in background.
  return (
    <PowerSyncContext.Provider value={db}>{children}</PowerSyncContext.Provider>
  )
}
