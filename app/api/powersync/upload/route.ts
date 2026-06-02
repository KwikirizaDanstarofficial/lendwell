import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase/server"

type CrudOp = {
  op: "PUT" | "PATCH" | "DELETE"
  table: string
  id: string
  opData?: Record<string, unknown>
}

// Tables that are allowed to be synced via this endpoint
const ALLOWED_TABLES = new Set([
  "members", "loans", "savings_accounts", "transactions",
  "fines", "fine_categories", "loan_categories", "savings_categories",
  "interest_rates", "complaints", "documents", "notifications",
  "loan_guarantors",
])

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { ops }: { ops: CrudOp[] } = await req.json()
    if (!Array.isArray(ops) || ops.length === 0) {
      return NextResponse.json({ success: true })
    }

    const errors: string[] = []

    for (const { op, table, id, opData } of ops) {
      if (!ALLOWED_TABLES.has(table)) {
        errors.push(`Table ${table} not allowed`)
        continue
      }

      // Enforce sacco isolation — the row must belong to this user's sacco
      const data = { id, ...opData }
      if ("sacco_id" in data && data.sacco_id !== user.saccoId) {
        errors.push(`sacco_id mismatch on ${table}:${id}`)
        continue
      }

      if (op === "PUT") {
        const { error } = await supabaseAdmin.from(table).upsert(data)
        if (error) errors.push(`${table} upsert: ${error.message}`)
      } else if (op === "PATCH") {
        const { error } = await supabaseAdmin.from(table).update(opData!).eq("id", id)
        if (error) errors.push(`${table} update: ${error.message}`)
      } else if (op === "DELETE") {
        const { error } = await supabaseAdmin.from(table).delete().eq("id", id)
        if (error) errors.push(`${table} delete: ${error.message}`)
      }
    }

    if (errors.length > 0) {
      // Log errors but still return 200 so PowerSync marks the transaction
      // as complete and doesn't retry forever. Errors here are typically
      // constraint violations that won't fix themselves on retry.
      console.error("[PowerSync upload] Non-fatal errors:", errors)
    }

    return NextResponse.json({ success: true, errors })
  } catch (err) {
    console.error("[PowerSync upload]", err)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
