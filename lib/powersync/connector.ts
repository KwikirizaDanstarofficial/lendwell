"use client"

import {
  AbstractPowerSyncDatabase,
  PowerSyncBackendConnector,
  UpdateType,
} from "@powersync/web"
import { supabase } from "@/lib/supabase/client"
import { getClientConfig } from "@/lib/client-config"

function opName(op: UpdateType): "PUT" | "PATCH" | "DELETE" {
  if (op === UpdateType.PUT)    return "PUT"
  if (op === UpdateType.PATCH)  return "PATCH"
  return "DELETE"
}

export class SupabaseConnector implements PowerSyncBackendConnector {
  async fetchCredentials() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error("Not authenticated")
    return {
      endpoint: getClientConfig().powersyncUrl,
      token: session.access_token,
    }
  }

  async uploadData(database: AbstractPowerSyncDatabase) {
    const transaction = await database.getNextCrudTransaction()
    if (!transaction) return

    try {
      const ops = transaction.crud.map(({ table, opData, op, id }) => ({
        op: opName(op),
        table,
        id,
        opData,
      }))

      const res = await fetch("/api/powersync/upload", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ops }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(`Upload failed: ${body.error ?? res.statusText}`)
      }

      await transaction.complete()
    } catch (err) {
      console.error("[PowerSync] Upload failed:", err)
      throw err
    }
  }
}
