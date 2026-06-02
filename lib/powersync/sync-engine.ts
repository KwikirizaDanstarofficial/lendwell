"use client"

/**
 * Direct pull-sync engine.
 *
 * Fetches data via the /api/sync/pull server route (which uses supabaseAdmin
 * and bypasses RLS). Writes rows directly into the local PowerSync SQLite DB.
 *
 * Strategy:
 *   - First run: full pull of all records
 *   - Subsequent runs: incremental (only records updated since last sync)
 *   - lastSync is only stamped when actual rows are returned
 */

import { AbstractPowerSyncDatabase } from "@powersync/web"
import { TABLE_COLUMNS } from "./sync-columns"

const SYNC_META_KEY = "last_sync"

/** Ensure the local-only metadata table exists. */
async function ensureMetaTable(db: AbstractPowerSyncDatabase): Promise<void> {
  await db.execute(
    `CREATE TABLE IF NOT EXISTS _sync_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)`
  )
}

async function getLastSync(db: AbstractPowerSyncDatabase): Promise<string | null> {
  try {
    await ensureMetaTable(db)
    const rows = await db.getAll(
      `SELECT value FROM _sync_meta WHERE key = ?`, [SYNC_META_KEY]
    )
    return (rows[0] as any)?.value ?? null
  } catch { return null }
}

async function setLastSync(db: AbstractPowerSyncDatabase): Promise<void> {
  try {
    await ensureMetaTable(db)
    await db.execute(
      `INSERT OR REPLACE INTO _sync_meta (key, value) VALUES (?, ?)`,
      [SYNC_META_KEY, new Date().toISOString()]
    )
  } catch {}
}

export async function clearSyncTimestamp(db: AbstractPowerSyncDatabase): Promise<void> {
  try {
    await ensureMetaTable(db)
    await db.execute(`DELETE FROM _sync_meta WHERE key = ?`, [SYNC_META_KEY])
  } catch {}
}

/** Pull one table via the server API and upsert into local SQLite. */
async function syncTable(
  db: AbstractPowerSyncDatabase,
  table: string,
  since: string | null,
): Promise<{ count: number; error?: string }> {
  const columns = TABLE_COLUMNS[table]
  if (!columns) return { count: 0 }

  const params = new URLSearchParams({ table })
  if (since) params.set("since", since)

  let res: Response
  try {
    res = await fetch(`/api/sync/pull?${params}`)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[SyncEngine] ${table}: fetch failed:`, msg)
    return { count: 0, error: `${table}: network error — ${msg}` }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const msg = body.error ?? `HTTP ${res.status}`
    console.error(`[SyncEngine] ${table}: API error:`, msg)
    return { count: 0, error: `${table}: ${msg}` }
  }

  const { data, count } = await res.json()
  if (!data?.length) {
    console.warn(`[SyncEngine] ${table}: 0 rows (since=${since ?? "full pull"})`)
    return { count: 0 }
  }

  console.log(`[SyncEngine] ${table}: writing ${count} rows to local DB`)

  for (const row of data as Record<string, unknown>[]) {
    const filtered: Record<string, unknown> = {}
    for (const col of columns) {
      filtered[col] = row[col] ?? null
    }
    const cols = Object.keys(filtered).join(", ")
    const placeholders = Object.keys(filtered).map(() => "?").join(", ")
    const vals = Object.values(filtered)
    await db.execute(
      `INSERT OR REPLACE INTO ${table} (${cols}) VALUES (${placeholders})`,
      vals
    )
  }

  return { count: data.length }
}

/** Pull all tables for this sacco from the server into local SQLite. */
export async function pullFromSupabase(
  db: AbstractPowerSyncDatabase,
  _saccoId: string,
  options?: { onProgress?: (msg: string) => void }
): Promise<{ total: number; isFirstSync: boolean; errors: string[] }> {
  const since = await getLastSync(db)
  const isFirstSync = !since
  let total = 0
  const errors: string[] = []

  for (const table of Object.keys(TABLE_COLUMNS)) {
    try {
      const { count, error } = await syncTable(db, table, since)
      if (error) {
        errors.push(error)
      } else if (count > 0) {
        options?.onProgress?.(`Synced ${count} ${table}`)
        total += count
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[SyncEngine] Failed to sync ${table}:`, err)
      errors.push(`${table}: ${msg}`)
    }
  }

  // Only stamp when actual rows were written — never on empty pulls.
  if (total > 0) {
    await setLastSync(db)
  }

  return { total, isFirstSync, errors }
}
