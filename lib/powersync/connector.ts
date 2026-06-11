"use client"

import {
  AbstractPowerSyncDatabase,
  PowerSyncBackendConnector,
  UpdateType,
} from "@powersync/web"
import { supabase } from "@/lib/supabase/client"
import { getClientConfig } from "@/lib/client-config"

/** Try to get the Supabase access token from the Electron vault. */
async function electronAccessToken(): Promise<string | null> {
  try {
    if (typeof window === "undefined") return null
    const el = (window as any).electron
    if (!el?.getConfig) return null
    const config = await el.getConfig()
    return config?.accessToken ?? null
  } catch {
    return null
  }
}

function opName(op: UpdateType): "PUT" | "PATCH" | "DELETE" {
  if (op === UpdateType.PUT)    return "PUT"
  if (op === UpdateType.PATCH)  return "PATCH"
  return "DELETE"
}

/** Decode a JWT payload without verifying the signature. */
function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    return JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")))
  } catch {
    return {}
  }
}

export class SupabaseConnector implements PowerSyncBackendConnector {
  async fetchCredentials() {
    // Try browser Supabase client first (works in web / Next.js server)
    let { data: { session } } = await supabase.auth.getSession()

    // Fallback: read access token from Electron vault
    if (!session) {
      const token = await electronAccessToken()
      if (token) {
        // Set the session on the browser client so subsequent calls also work
        await supabase.auth.setSession({
          access_token: token,
          refresh_token: token,
        })
        const { data: { session: s } } = await supabase.auth.getSession()
        session = s
      }
    }

    if (!session) throw new Error("Not authenticated")

    // Guard: the JWT MUST have sacco_id at root level for PowerSync Cloud
    // to resolve token_parameters.sacco_id. Without this root-level claim
    // the sync bucket will be empty and PowerSync will DELETE all local data.
    // The root-level claim requires the Supabase custom_access_token_hook
    // (see POWERSYNC_JWT_SETUP.md) and a fresh sign-in.
    const payload = decodeJwtPayload(session.access_token)
    if (!payload.sacco_id) {
      console.error(
        "[PowerSync] JWT is missing root-level sacco_id claim.\n" +
        "Set up the Supabase custom_access_token_hook (see POWERSYNC_JWT_SETUP.md)\n" +
        "then sign out and back in to get a valid JWT."
      )
      throw new Error("JWT missing sacco_id — sync blocked to protect local data. See POWERSYNC_JWT_SETUP.md.")
    }

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
