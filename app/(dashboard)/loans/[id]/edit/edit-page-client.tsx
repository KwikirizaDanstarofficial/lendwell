"use client"
import { useQuery } from "@powersync/react"
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
    dueDate: r.due_date ? new Date(r.due_date) : null,
    notes: r.notes ?? null,
    expectedReceived: Number(r.expected_received ?? 0),
    createdAt: r.created_at ? new Date(r.created_at) : null,
  }
}

export function EditPageClient({ id, initialLoan }: { id: string; initialLoan?: any }) {
  const { data: rows = [] } = useQuery(
    `SELECT l.*, m.full_name AS member_name, m.member_code
     FROM loans l LEFT JOIN members m ON m.id = l.member_id
     WHERE l.id = ? LIMIT 1`,
    [id]
  )
  const raw = (rows[0] as any) ?? initialLoan
  if (!raw) return <div className="p-6 text-sm text-muted-foreground">Loan not found.</div>
  const loan = toLoan(raw)
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Loan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update details for {loan.loanRef} — {loan.memberName}
        </p>
      </div>
      <EditLoanForm loan={loan} />
    </div>
  )
}
