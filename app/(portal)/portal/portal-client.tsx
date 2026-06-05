"use client"
import { useQuery } from "@powersync/react"
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

export function PortalClient({ memberCode, saccoId }: { memberCode: string; saccoId: string }) {
  const { data: memberRows = [] } = useQuery(
    "SELECT id, member_code, full_name, phone, status, joined_at FROM members WHERE member_code = ? LIMIT 1",
    [memberCode]
  )
  const member = memberRows[0] as any

  // Use member_id from the matched member row, or fall back to querying by sacco
  const memberId = member?.id ?? ""
  const { data: savingsRows = [] } = useQuery(
    "SELECT id, account_number, balance, account_type FROM savings_accounts WHERE member_id = ?",
    [memberId]
  )
  const { data: loanRows = [] } = useQuery(
    "SELECT id, loan_ref, amount, balance, status, due_date, created_at FROM loans WHERE member_id = ? ORDER BY created_at DESC",
    [memberId]
  )
  const { data: fineRows = [] } = useQuery(
    "SELECT id, amount, status, reason, created_at FROM fines WHERE member_id = ? ORDER BY created_at DESC",
    [memberId]
  )

  const savings = savingsRows as any[]
  const loans = loanRows as any[]
  const fines = fineRows as any[]

  const totalSavings = savings.reduce((s, a) => s + Number(a.balance ?? 0), 0)
  const activeLoans  = loans.filter((l) => ["active","disbursed","approved","pending"].includes(l.status))
  const pendingFines = fines.filter((f) => f.status === "pending")

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Member</p>
        <p className="mt-1 text-xl font-bold">{member?.full_name ?? "—"}</p>
        <p className="text-sm text-muted-foreground">{member?.member_code} · {member?.phone}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Member since {member?.joined_at ? new Date(member.joined_at).toLocaleDateString("en-UG", { month: "long", year: "numeric" }) : "—"}
        </p>
      </div>

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

      <section>
        <h2 className="mb-3 text-sm font-semibold">Savings Accounts</h2>
        {savings.length === 0
          ? <p className="text-sm text-muted-foreground">No savings accounts yet.</p>
          : <div className="space-y-2">{savings.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
                <div><p className="text-sm font-medium">{a.account_number}</p><p className="text-xs capitalize text-muted-foreground">{a.account_type}</p></div>
                <p className="font-bold text-sm">{fmt(Number(a.balance))}</p>
              </div>
            ))}</div>
        }
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold">Loans</h2>
        {loans.length === 0
          ? <p className="text-sm text-muted-foreground">No loans yet.</p>
          : <div className="space-y-2">{loans.map((l) => (
              <div key={l.id} className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
                <div className="flex items-center gap-2">
                  {LOAN_STATUS_ICON[l.status] ?? <Clock className="h-4 w-4 text-muted-foreground" />}
                  <div>
                    <p className="text-sm font-medium">{l.loan_ref}</p>
                    <p className="text-xs capitalize text-muted-foreground">{l.status}{l.due_date ? ` · due ${new Date(l.due_date).toLocaleDateString()}` : ""}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{fmt(Number(l.amount))}</p>
                  {Number(l.balance) > 0 && <p className="text-xs text-muted-foreground">bal. {fmt(Number(l.balance))}</p>}
                </div>
              </div>
            ))}</div>
        }
      </section>

      {fines.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold">Fines</h2>
          <div className="space-y-2">{fines.map((f) => (
            <div key={f.id} className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
              <div><p className="text-sm">{f.reason ?? "Fine"}</p><p className="text-xs capitalize text-muted-foreground">{f.status}</p></div>
              <p className="text-sm font-bold">{fmt(Number(f.amount))}</p>
            </div>
          ))}</div>
        </section>
      )}
    </div>
  )
}
