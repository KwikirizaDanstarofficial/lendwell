import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase/server"
import { TABLE_COLUMNS } from "@/lib/powersync/sync-columns"

export async function GET(req: NextRequest) {
  try {
    console.log("[sync/pull] env check:", {
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      keyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 8),
      hasUrl: !!process.env.SUPABASE_URL,
    })

    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!user.saccoId) return NextResponse.json({ error: "No sacco_id on session" }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const table = searchParams.get("table") ?? ""
    const since = searchParams.get("since")

    const columns = TABLE_COLUMNS[table]
    if (!columns) {
      return NextResponse.json({ error: `Unknown table: ${table}` }, { status: 400 })
    }

    const selectCols = columns.join(",")

    let query = (supabaseAdmin as any)
      .from(table)
      .select(selectCols)
      .eq("sacco_id", user.saccoId)
      .order("created_at", { ascending: true })
      .limit(5000)

    const hasUpdatedAt = columns.includes("updated_at")
    if (since && hasUpdatedAt) {
      query = query.gte("updated_at", since)
    }

    if (table === "members" || table === "fines") {
      query = query.is("deleted_at", null)
    }

    const { data, error } = await query
    if (error) {
      console.error(`[sync/pull] ${table}:`, error)
      return NextResponse.json({ error: error.message, details: error }, { status: 500 })
    }

    return NextResponse.json({ data: data ?? [], table, count: (data ?? []).length })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[sync/pull] catch block:", err)
    return NextResponse.json({ error: msg, stack: err instanceof Error ? err.stack : undefined }, { status: 500 })
  }
}
