export const revalidate = 0
import { requireAuth } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase/server"
import { NewLoanForm } from "./new-loan-loader"

export default async function NewLoanPage() {
  const user = await requireAuth()

  // Pre-fetch from server when online so selects are populated before PowerSync syncs.
  // When offline the fetches fail silently — the form falls back to its internal
  // PowerSync useQuery which reads from local SQLite.
  let members: any[] = []
  let interestRates: any[] = []
  try {
    const [{ data: memberRows }, { data: rateRows }] = await Promise.all([
      supabaseAdmin
        .from("members")
        .select("id, full_name, member_code, phone")
        .eq("sacco_id", user.saccoId)
        .eq("status", "active")
        .order("full_name"),
      supabaseAdmin
        .from("interest_rates")
        .select("id, min_amount, max_amount, rate, rate_type")
        .eq("sacco_id", user.saccoId)
        .eq("is_active", true),
    ])
    members = (memberRows ?? []).map((m: any) => ({
      id: m.id, full_name: m.full_name, member_code: m.member_code, phone: m.phone ?? null,
    }))
    interestRates = (rateRows ?? []).map((r: any) => ({
      id: r.id, minAmount: Number(r.min_amount), maxAmount: Number(r.max_amount),
      rate: r.rate, rateType: r.rate_type,
    }))
  } catch {
    // Offline — form will load members and rates from local PowerSync SQLite
  }

  return (
    <div className="mx-auto max-w-2xl py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">New Loan Application</h1>
        <p className="mt-2 text-muted-foreground">Fill in the details below to submit a new loan application.</p>
      </div>
      <NewLoanForm saccoId={user.saccoId} members={members} interestRates={interestRates} />
    </div>
  )
}
