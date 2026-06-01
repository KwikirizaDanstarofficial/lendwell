"use client"

import { PowerSyncDatabase } from "@powersync/web"
import { PowerSyncContext } from "@powersync/react"
import { ReactNode, useEffect, useMemo, useState } from "react"
import { AppSchema } from "./schema"
import { SupabaseConnector } from "./connector"

const connector = new SupabaseConnector()

export function PowerSyncProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)

  const db = useMemo(
    () =>
      new PowerSyncDatabase({
        schema: AppSchema,
        database: { dbFilename: "sacco.db" },
      }),
    []
  )

  useEffect(() => {
    setMounted(true)
    db.connect(connector)
    return () => {
      db.disconnect()
    }
  }, [db])

  if (!mounted) return <>{children}</>

  return (
    <PowerSyncContext.Provider value={db}>{children}</PowerSyncContext.Provider>
  )
}
