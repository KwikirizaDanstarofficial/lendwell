/**
 * Drop all SACCO tables via Supabase SQL (service role).
 * Run: npx tsx scripts/drop-tables.ts
 */
import * as dotenv from "dotenv"
import { createClient } from "@supabase/supabase-js"

dotenv.config({ path: ".env.local" })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const DROP_SQL = `
  DROP TABLE IF EXISTS audit_logs CASCADE;
  DROP TABLE IF EXISTS complaints CASCADE;
  DROP TABLE IF EXISTS documents CASCADE;
  DROP TABLE IF EXISTS fines CASCADE;
  DROP TABLE IF EXISTS fine_categories CASCADE;
  DROP TABLE IF EXISTS loan_top_ups CASCADE;
  DROP TABLE IF EXISTS loan_extensions CASCADE;
  DROP TABLE IF EXISTS loan_guarantors CASCADE;
  DROP TABLE IF EXISTS loans CASCADE;
  DROP TABLE IF EXISTS interest_rates CASCADE;
  DROP TABLE IF EXISTS loan_categories CASCADE;
  DROP TABLE IF EXISTS transactions CASCADE;
  DROP TABLE IF EXISTS savings_accounts CASCADE;
  DROP TABLE IF EXISTS savings_categories CASCADE;
  DROP TABLE IF EXISTS members CASCADE;
  DROP TABLE IF EXISTS notifications CASCADE;
  DROP TABLE IF EXISTS sacco_users CASCADE;
  DROP TABLE IF EXISTS sacco_stats CASCADE;
  DROP TABLE IF EXISTS saccos CASCADE;
  DROP TABLE IF EXISTS superadmins CASCADE;
  DROP TABLE IF EXISTS cms_activity_logs CASCADE;

  DROP TYPE IF EXISTS user_role CASCADE;
  DROP TYPE IF EXISTS sacco_user_role CASCADE;
  DROP TYPE IF EXISTS member_status CASCADE;
  DROP TYPE IF EXISTS loan_status CASCADE;
  DROP TYPE IF EXISTS savings_account_type CASCADE;
  DROP TYPE IF EXISTS fine_status CASCADE;
  DROP TYPE IF EXISTS transaction_type CASCADE;
  DROP TYPE IF EXISTS payment_method CASCADE;
  DROP TYPE IF EXISTS document_type CASCADE;
  DROP TYPE IF EXISTS notification_type CASCADE;
  DROP TYPE IF EXISTS notification_status CASCADE;
  DROP TYPE IF EXISTS complaint_status CASCADE;
  DROP TYPE IF EXISTS interest_type CASCADE;
  DROP TYPE IF EXISTS sacco_status CASCADE;
  DROP TYPE IF EXISTS superadmin_role CASCADE;
`

async function dropTables() {
  console.log("Dropping all tables...")

  const { error } = await supabase.rpc("exec_sql", { sql: DROP_SQL }).single()

  if (error) {
    // Fallback: try via the SQL editor endpoint (requires Supabase Management API)
    console.error("RPC failed — run the following SQL manually in Supabase SQL editor:")
    console.log(DROP_SQL)
    process.exit(1)
  }

  console.log("✅ All tables and types dropped")
}

dropTables().catch(console.error)
