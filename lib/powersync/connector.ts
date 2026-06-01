"use client"

import {
  AbstractPowerSyncDatabase,
  PowerSyncBackendConnector,
  UpdateType,
} from "@powersync/web"
import { supabase } from "@/lib/supabase/client"
import { getClientConfig } from "@/lib/client-config"

export class SupabaseConnector implements PowerSyncBackendConnector {
  async fetchCredentials() {
    const {
      data: { session },
    } = await supabase.auth.getSession()
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
      for (const op of transaction.crud) {
        const { table, opData, op: operation, id } = op

        if (operation === UpdateType.PUT) {
          const { error } = await supabase.from(table).upsert({ id, ...opData })
          if (error) throw error
        } else if (operation === UpdateType.PATCH) {
          const { error } = await supabase
            .from(table)
            .update(opData!)
            .eq("id", id)
          if (error) throw error
        } else if (operation === UpdateType.DELETE) {
          const { error } = await supabase.from(table).delete().eq("id", id)
          if (error) throw error
        }
      }
      await transaction.complete()
    } catch (err) {
      console.error("[PowerSync] Upload failed:", err)
      throw err
    }
  }
}
