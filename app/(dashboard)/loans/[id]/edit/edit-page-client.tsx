"use client"
import { useQuery } from "@powersync/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"
import { EditLoanForm } from "./edit-loan-form"

function toLoan(r: any) {
  return {
    id: r.id,
    saccoId: r.sacco_id,
    memberId: r.member_id,
    memberName: r.members?.full_name ?? r.member_name ?? "",
    memberCode: r.members?.member_code ?? r.member_code ?? "",
    loanRef: r.loan_ref,
    amount: Number(r.amount),
    balance: Number(r.balance),
    interestRate: r.interest_rate,
    interestType: r.interest_type,
    durationMonths: r.duration_months,
    latePenaltyFee: Number(r.late_penalty_fee ?? 0),
    dailyPayment: Number(r.daily_payment ?? 0),
    monthlyPayment: Number(r.monthly_payment ?? 0),
    status: r.status,
    dueDate: r.due_date ?? null,
    notes: r.notes ?? null,
    expectedReceived: Number(r.expected_received ?? 0),
    createdAt: r.created_at ?? null,
  }
}

export function EditPageClient({ id, initialLoan, interestRates = [] }: { id: string; initialLoan?: any; interestRates?: any[] }) {
  const router = useRouter()
  const { data: rows = [], isLoading: loading } = useQuery(
    `SELECT l.*, m.full_name AS member_name, m.member_code
     FROM loans l LEFT JOIN members m ON m.id = l.member_id
     WHERE l.id = ? LIMIT 1`,
    [id]
  )
  const raw = (rows[0] as any) ?? initialLoan

  useEffect(() => {
    if (raw && ["declined", "settled", "defaulted"].includes(raw.status)) {
      router.push(`/loans/${id}`)
    }
  }, [raw, id, router])

  if (loading && !raw) return <div className="flex items-center justify-center p-12 text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading loan…</div>
  if (!raw) return <div className="p-6 text-sm text-muted-foreground">Loan not found.</div>
  const loan = toLoan(raw)
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Loan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update details for {loan.loanRef} &mdash; {loan.memberName}
        </p>
      </div>
      <EditLoanForm loan={loan} interestRates={interestRates} />
    </div>
  )
}
