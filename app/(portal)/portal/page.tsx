import { requireMember } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase/server"
import { PiggyBank, Banknote, AlertCircle, CheckCircle2, Clock, XCircle } from "lucide-react"

function fmt(n: number) {
  return new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 }).format(n)
}

const LOAN_STATUS_ICON: Record<string, React.ReactNode> = {
  active:    <CheckCircle2 className="h-4 w-4 text-green-500" />,
  disbursed: <CheckCircle2 className="h-4 w-4 text-blue-500" />,
  pending:   <Clock className="h-4 w-4 text-amber-500" />,
  approved:  <Clock className="h-4 w-4 text-sky-500" />,
  settled:   <CheckCircle2 className="h-4 w-4 text-muted-foreground" />,
  declined:  <XCircle className="h-4 w-4 text-destructive" />,
  defaulted: <XCircle className="h-4 w-4 text-destructive" />,
}

export default async function PortalPage() {
  const user = await requireMember()

  const [memberRes, savingsRes, loansRes, finesRes] = await Promise.all([
    supabaseAdmin
      .from("members")
      .select("id, member_code, full_name, phone, status, joined_at")
      .eq("sacco_id", user.saccoId)
      .eq("member_code", user.memberCode ?? "")
      .single(),
    supabaseAdmin
      .from("savings_accounts")
      .select("id, account_number, balance, account_type")
      .eq("sacco_id", user.saccoId),
    supabaseAdmin
      .from("loans")
      .select("id, loan_ref, amount, balance, status, due_date, created_at")
      .eq("sacco_id", user.saccoId)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("fines")
      .select("id, amount, status, reason, created_at")
      .eq("sacco_id", user.saccoId)
      .order("created_at", { ascending: false }),
  ])

  const member   = memberRes.data
  const savings  = savingsRes.data ?? []
  const loans    = loansRes.data ?? []
  const fines    = finesRes.data ?? []

  const totalSavings = savings.reduce((s, a) => s + (a.balance ?? 0), 0)
  const activeLoans  = loans.filter((l) => ["active", "disbursed", "approved", "pending"].includes(l.status))
  const pendingFines = fines.filter((f) => f.status === "pending")

  return (
    <div className="space-y-6">
      {/* Member card */}
      <div className="rounded-xl border bg-card p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Member</p>
        <p className="mt-1 text-xl font-bold">{member?.full_name ?? user.fullName}</p>
        <p className="text-sm text-muted-foreground">{member?.member_code} · {member?.phone}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Member since {member?.joined_at ? new Date(member.joined_at).toLocaleDateString("en-UG", { month: "long", year: "numeric" }) : "—"}
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border bg-card p-4 text-center">
          <PiggyBank className="mx-auto mb-1 h-5 w-5 text-emerald-500" />
          <p className="text-xs text-muted-foreground">Savings</p>
          <p className="font-bold text-sm">{fmt(totalSavings)}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <Banknote className="mx-auto mb-1 h-5 w-5 text-blue-500" />
          <p className="text-xs text-muted-foreground">Active Loans</p>
          <p className="font-bold text-sm">{activeLoans.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <AlertCircle className="mx-auto mb-1 h-5 w-5 text-red-500" />
          <p className="text-xs text-muted-foreground">Pending Fines</p>
          <p className="font-bold text-sm">{pendingFines.length}</p>
        </div>
      </div>

      {/* Savings accounts */}
      <section>
        <h2 className="mb-3 text-sm font-semibold">Savings Accounts</h2>
        {savings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No savings accounts yet.</p>
        ) : (
          <div className="space-y-2">
            {savings.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{a.account_number}</p>
                  <p className="text-xs capitalize text-muted-foreground">{a.account_type}</p>
                </div>
                <p className="font-bold text-sm">{fmt(a.balance)}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Loans */}
      <section>
        <h2 className="mb-3 text-sm font-semibold">Loans</h2>
        {loans.length === 0 ? (
          <p className="text-sm text-muted-foreground">No loans yet.</p>
        ) : (
          <div className="space-y-2">
            {loans.map((l) => (
              <div key={l.id} className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
                <div className="flex items-center gap-2">
                  {LOAN_STATUS_ICON[l.status] ?? <Clock className="h-4 w-4 text-muted-foreground" />}
                  <div>
                    <p className="text-sm font-medium">{l.loan_ref}</p>
                    <p className="text-xs capitalize text-muted-foreground">{l.status}{l.due_date ? ` · due ${new Date(l.due_date).toLocaleDateString()}` : ""}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{fmt(l.amount)}</p>
                  {l.balance > 0 && <p className="text-xs text-muted-foreground">bal. {fmt(l.balance)}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Fines */}
      {fines.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold">Fines</h2>
          <div className="space-y-2">
            {fines.map((f) => (
              <div key={f.id} className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
                <div>
                  <p className="text-sm">{f.reason ?? "Fine"}</p>
                  <p className="text-xs capitalize text-muted-foreground">{f.status}</p>
                </div>
                <p className="text-sm font-bold">{fmt(f.amount)}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
