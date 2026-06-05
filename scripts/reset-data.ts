/**
 * Reset all SACCO business data.
 * Truncates every business table and clears sacco_id / branch_id from
 * auth user metadata so you can re-run onboarding.
 * Auth users themselves are NOT deleted — you can still log in.
 *
 * Run: npx tsx scripts/reset-data.ts
 */
import * as dotenv from "dotenv"
import { createClient } from "@supabase/supabase-js"

dotenv.config({ path: ".env.local" })

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// Tables ordered to respect foreign-key constraints (children first)
const TABLES = [
  "cms_activity_logs",
  "audit_logs",
  "loan_top_ups",
  "loan_extensions",
  "loan_guarantors",
  "interest_rates",
  "transactions",
  "notifications",
  "documents",
  "complaints",
  "fines",
  "fine_categories",
  "loans",
  "loan_categories",
  "savings_accounts",
  "savings_categories",
  "members",
  "sacco_stats",
  "sacco_users",
  "branches",
  "saccos",
]

async function clearTable(table: string) {
  // Delete every row — using gte on created_at as a wildcard condition
  const { error } = await (supabase as any)
    .from(table)
    .delete()
    .gte("created_at", "1900-01-01")

  if (error) {
    // Some tables may not have created_at; fall back to id-based delete
    const { error: e2 } = await (supabase as any)
      .from(table)
      .delete()
      .not("id", "is", null)

    if (e2) {
      console.warn(`  ⚠ ${table}: ${e2.message}`)
    } else {
      console.log(`  ✓ ${table}`)
    }
  } else {
    console.log(`  ✓ ${table}`)
  }
}

async function clearAuthUserMetadata() {
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  if (error) { console.warn("  ⚠ Could not list auth users:", error.message); return }

  let cleared = 0
  for (const user of data.users) {
    if (user.user_metadata?.sacco_id || user.user_metadata?.branch_id) {
      const { error: e } = await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          sacco_id: null,
          branch_id: null,
          branch_code: null,
        },
      })
      if (!e) cleared++
      else console.warn(`  ⚠ Could not clear metadata for ${user.email}: ${e.message}`)
    }
  }
  console.log(`  ✓ Cleared sacco_id/branch_id from ${cleared} auth user(s)`)
}

async function run() {
  console.log("\n🗑  Clearing business data tables…")
  for (const table of TABLES) {
    await clearTable(table)
  }

  console.log("\n🔑  Clearing sacco metadata from auth users…")
  await clearAuthUserMetadata()

  console.log("\n✅  Done. You can now re-run onboarding.\n")
}

run().catch((err) => {
  console.error("Error:", err)
  process.exit(1)
})
