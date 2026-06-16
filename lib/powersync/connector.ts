"use client"

import {
  AbstractPowerSyncDatabase,
  PowerSyncBackendConnector,
  UpdateType,
} from "@powersync/web"
import { supabase } from "@/lib/supabase/client"
import { getClientConfig } from "@/lib/client-config"

/** Try to get the Supabase session from the Electron vault. */
async function electronSession(): Promise<{ accessToken: string; refreshToken?: string } | null> {
  try {
    if (typeof window === "undefined") return null
    const el = (window as any).electron
    if (!el?.getConfig) return null
    const config = await el.getConfig()
    if (!config?.accessToken) return null
    return { accessToken: config.accessToken, refreshToken: config.refreshToken }
  } catch {
    return null
  }
}

/** Decode a JWT payload without verifying the signature. */
function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    return JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
    )
  } catch {
    return {}
  }
}

export class SupabaseConnector implements PowerSyncBackendConnector {
  async fetchCredentials() {
    // Try browser Supabase client first
    let { data: { session } } = await supabase.auth.getSession()

    // Fallback: restore session from Electron vault
    if (!session) {
      const vault = await electronSession()
      if (vault) {
        await supabase.auth.setSession({
          access_token:  vault.accessToken,
          refresh_token: vault.refreshToken ?? vault.accessToken,
        })
        const { data: { session: s } } = await supabase.auth.getSession()
        session = s
      }
    }

    // If still no session but we have vault tokens, use them as-is.
    // This lets PowerSync operate fully offline with local SQLite data.
    const vault = !session ? await electronSession() : null
    const token = session?.access_token ?? vault?.accessToken

    if (!token) throw new Error("Not authenticated — no session or vault token found")

    // When we have a token (even if potentially expired), try to get sacco_id
    const payload = decodeJwtPayload(token)
    if (!payload.sacco_id && !session) {
      // Offline with vault token — we can still read from local DB.
      // PowerSync Cloud sync won't work, but local SQLite queries will.
      console.warn("[PowerSync] No sacco_id in cached token — local-only mode")
    }

    return {
      endpoint: getClientConfig().powersyncUrl,
      token,
    }
  }

  async uploadData(database: AbstractPowerSyncDatabase) {
    const transaction = await database.getNextCrudTransaction()
    if (!transaction) return

    try {
      for (const { table, opData, op, id } of transaction.crud) {
        let error: any

        if (op === UpdateType.PUT) {
          let uploadData: Record<string, unknown> = { ...opData, id }
          if (table === "members" && typeof uploadData.member_code === "string") {
            const code = uploadData.member_code
            if (!/-[0-9A-F]{4}$/i.test(code)) {
              uploadData.member_code = `${code}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`
            }
          }
          ;({ error } = await supabase.from(table).upsert(uploadData))
        } else if (op === UpdateType.PATCH) {
          ;({ error } = await supabase.from(table).update(opData).eq("id", id))
        } else if (op === UpdateType.DELETE) {
          ;({ error } = await supabase.from(table).delete().eq("id", id))
        }

        if (error) throw error
      }

      await transaction.complete()
    } catch (err) {
      console.error("[PowerSync] Upload failed — will retry:", err)
      throw err
    }
  }
}
