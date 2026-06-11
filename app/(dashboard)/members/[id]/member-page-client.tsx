"use client"
import { useQuery } from "@powersync/react"
import { Loader2 } from "lucide-react"
import { MemberProfile } from "./member-profile"

export function MemberPageClient({ id }: { id: string }) {
  const { data: memberRows = [], isLoading: loadingMembers } = useQuery("SELECT * FROM members WHERE id = ? LIMIT 1", [id])
  const { data: loanRows = [] } = useQuery("SELECT * FROM loans WHERE member_id = ? ORDER BY created_at DESC", [id])
  const { data: savingsRows = [] } = useQuery("SELECT * FROM savings_accounts WHERE member_id = ? ORDER BY created_at DESC", [id])
  const { data: fineRows = [] } = useQuery("SELECT * FROM fines WHERE member_id = ? ORDER BY created_at DESC", [id])
  const { data: txRows = [] } = useQuery("SELECT * FROM transactions WHERE member_id = ? ORDER BY created_at DESC LIMIT 50", [id])

  const m = memberRows[0] as any
  if (loadingMembers && !m) return <div className="flex items-center justify-center p-12 text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading member…</div>
  if (!m) return <div className="p-6 text-sm text-muted-foreground">Member not found or not yet synced.</div>

  const member = {
    id: m.id, saccoId: m.sacco_id, memberCode: m.member_code, fullName: m.full_name,
    email: m.email, phone: m.phone, nationalId: m.national_id, photoUrl: m.photo_url,
    dateOfBirth: m.date_of_birth, address: m.address, nextOfKin: m.next_of_kin,
    nextOfKinPhone: m.next_of_kin_phone, nextOfKinRelationship: m.next_of_kin_relationship,
    nextOfKinAddress: m.next_of_kin_address, status: m.status, joinedAt: m.joined_at,
    createdAt: m.created_at ? new Date(m.created_at) : null,
    updatedAt: m.updated_at ? new Date(m.updated_at) : null,
  }

  const loans = (loanRows as any[]).map((r) => ({
    id: r.id, saccoId: r.sacco_id, memberId: r.member_id, categoryId: r.category_id,
    loanRef: r.loan_ref, amount: Number(r.amount), balance: Number(r.balance),
    interestRate: r.interest_rate, status: r.status, dueDate: r.due_date,
    disbursedAt: r.disbursed_at, settledAt: r.settled_at, declineReason: r.decline_reason,
    notes: r.notes, createdAt: r.created_at, updatedAt: r.updated_at,
    interestRateId: null, expectedReceived: Number(r.expected_received ?? 0),
    interestType: r.interest_type, durationMonths: r.duration_months,
    latePenaltyFee: Number(r.late_penalty_fee ?? 0), dailyPayment: Number(r.daily_payment ?? 0),
    monthlyPayment: Number(r.monthly_payment ?? 0),
  }))

  const savings = (savingsRows as any[]).map((r) => ({
    id: r.id, saccoId: r.sacco_id, memberId: r.member_id, categoryId: r.category_id,
    accountNumber: r.account_number, balance: Number(r.balance), accountType: r.account_type,
    isLocked: Boolean(r.is_locked), lockUntil: r.lock_until, lockReason: r.lock_reason,
    createdAt: r.created_at, updatedAt: r.updated_at,
  }))

  const fines = (fineRows as any[]).map((r) => ({
    id: r.id, fine_ref: r.fine_ref, amount: Number(r.amount), reason: r.reason,
    description: null, status: r.status, priority: null, due_date: r.due_date,
    paid_at: r.paid_at, payment_method: r.payment_method, payment_reference: r.payment_reference,
    notes: r.notes, created_at: r.created_at, updated_at: r.updated_at,
    member_id: r.member_id, category_id: r.category_id,
  }))

  const transactions = (txRows as any[]).map((r) => ({
    id: r.id, saccoId: r.sacco_id, memberId: r.member_id, type: r.type,
    amount: Number(r.amount), balanceAfter: Number(r.balance_after ?? 0),
    referenceId: r.reference_id, paymentMethod: r.payment_method, narration: r.narration,
    createdAt: r.created_at,
  }))

  const stats = {
    totalSavings: savings.reduce((s, a) => s + a.balance, 0),
    totalLoans: loans.filter((l) => ["active","disbursed"].includes(l.status)).length,
    totalFines: fines.filter((f) => f.status === "pending").length,
    totalTransactions: transactions.length,
  }

  return (
    <MemberProfile
      member={member as any} sacco={null}
      loans={loans as any} savings={savings as any} fines={fines as any}
      transactions={transactions as any} stats={stats}
    />
  )
}
