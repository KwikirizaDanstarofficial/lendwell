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
    db.connect(connector)
    return () => {
      db.disconnect()
    }
  }, [db])

  return (
    <PowerSyncContext.Provider value={db}>{children}</PowerSyncContext.Provider>
  )
}
