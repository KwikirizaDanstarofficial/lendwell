"use client"
import { Suspense } from "react"
import Link from "next/link"
import { useQuery } from "@powersync/react"
import { useMemo } from "react"
import { GuarantorsSection } from "../components/guarantors-section"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatUGX, formatDate } from "@/lib/utils/format"
import { formatLoanSchedule } from "@/lib/pdf/loan-calculator"
import {
  Banknote,
  Calendar,
  Clock,
  User,
  AlertCircle,
  ArrowLeft,
  FileText,
  TrendingUp,
  CreditCard,
  Phone,
  Mail,
  Loader2,
  ArrowDownLeft,
  ArrowUpRight,
  Minus,
} from "lucide-react"

export function LoanDetailClient({ id }: { id: string }) {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading loan details…</div>}>
      <LoanDetailContent id={id} />
    </Suspense>
  )
}

const statusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "secondary",
  approved: "default",
  disbursed: "default",
  active: "default",
  settled: "outline",
  declined: "destructive",
  defaulted: "destructive",
}


// ── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  icon: Icon,
  title,
  children,
  aside,
}: {
  icon: React.ElementType
  title: string
  children: React.ReactNode
  aside?: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <h2 className="text-sm font-semibold tracking-widest text-foreground uppercase">
            {title}
          </h2>
        </div>
        {aside}
      </div>
      {children}
    </div>
  )
}

// ── Info row ─────────────────────────────────────────────────────────────────

function InfoGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
      {children}
    </div>
  )
}

function InfoItem({
  label,
  value,
  accent,
  mono,
}: {
  label: string
  value: React.ReactNode
  accent?: "green" | "orange" | "red" | "blue"
  mono?: boolean
}) {
  const valueColor =
    accent === "green"
      ? "text-green-600 dark:text-green-400"
      : accent === "orange"
        ? "text-orange-500 dark:text-orange-400"
        : accent === "red"
          ? "text-red-500 dark:text-red-400"
          : accent === "blue"
            ? "text-blue-600 dark:text-blue-400"
            : "text-foreground"

  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
        {label}
      </p>
      <p
        className={`text-sm font-semibold ${valueColor} ${mono ? "font-mono" : ""}`}
      >
        {value}
      </p>
    </div>
  )
}

// ── Payment tile ─────────────────────────────────────────────────────────────

function PaymentTile({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent: "blue" | "green" | "orange"
}) {
  const ring =
    accent === "blue"
      ? "border-blue-200 dark:border-blue-800"
      : accent === "green"
        ? "border-green-200 dark:border-green-800"
        : "border-orange-200 dark:border-orange-800"

  const text =
    accent === "blue"
      ? "text-blue-600 dark:text-blue-400"
      : accent === "green"
        ? "text-green-600 dark:text-green-400"
        : "text-orange-500 dark:text-orange-400"

  return (
    <div
      className={`rounded-xl border ${ring} flex flex-col gap-1 bg-background px-4 py-3`}
    >
      <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
        {label}
      </p>
      <p className={`text-lg font-bold ${text}`}>{value}</p>
    </div>
  )
}

// ── Main content ─────────────────────────────────────────────────────────────

function LoanDetailContent({ id }: { id: string }) {
  const { data: loanRows = [], isLoading: loadingLoan } = useQuery(
    `SELECT l.*, m.full_name AS member_name, m.member_code AS member_code_val,
             m.phone AS member_phone, m.email AS member_email
      FROM loans l LEFT JOIN members m ON m.id = l.member_id
      WHERE l.id = ? LIMIT 1`,
    [id]
  )
  const { data: guarantorRows = [], error: guarantorError } = useQuery(
    `SELECT g.*, m.full_name AS member_name, m.member_code
      FROM loan_guarantors g LEFT JOIN members m ON m.id = g.member_id
      WHERE g.loan_id = ?`,
    [id]
  )
  if (guarantorError) console.warn("[LoanDetail] loan_guarantors not yet synced:", guarantorError)
  const { data: memberRows = [] } = useQuery(
    "SELECT id, full_name, member_code, phone FROM members LIMIT 1000"
  )

  const loanRow = loanRows[0] as any
  if (loadingLoan && !loanRow) return <div className="flex items-center justify-center p-12 text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading loan…</div>
  if (!loanRow) return <div className="p-6 text-sm text-muted-foreground">Loan not found or not yet synced.</div>

  const loan = {
    id: loanRow.id, loanRef: loanRow.loan_ref, amount: Number(loanRow.amount),
    balance: Number(loanRow.balance), interestRate: loanRow.interest_rate,
    interestType: loanRow.interest_type, status: loanRow.status,
    dueDate: loanRow.due_date ? new Date(loanRow.due_date) : null,
    disbursedAt: loanRow.disbursed_at ? new Date(loanRow.disbursed_at) : null,
    settledAt: loanRow.settled_at ? new Date(loanRow.settled_at) : null,
    declineReason: loanRow.decline_reason ?? null,
    notes: loanRow.notes ?? null,
    expectedReceived: Number(loanRow.expected_received ?? 0),
    durationMonths: loanRow.duration_months,
    latePenaltyFee: Number(loanRow.late_penalty_fee ?? 0),
    dailyPayment: Number(loanRow.daily_payment ?? 0),
    monthlyPayment: Number(loanRow.monthly_payment ?? 0),
    createdAt: loanRow.created_at ? new Date(loanRow.created_at) : null,
    memberId: loanRow.member_id,
  }

  const loanWithMember = {
    ...loan,
    member_name: loanRow.member_name ?? "Unknown",
    member_code: loanRow.member_code_val ?? "N/A",
    member_phone: loanRow.member_phone ?? null,
    member_email: loanRow.member_email ?? null,
  }

  // GuarantorsSection expects snake_case keys (full_name, member_code, member_id)
  const allMembers: any[] = (memberRows as any[]).map((r) => ({
    id: r.id, full_name: r.full_name, member_code: r.member_code, phone: r.phone,
  }))

  const guarantors = (guarantorRows as any[]).map((r) => ({
    id: r.id,
    member_id: r.member_id,
    status: r.status,
    notes: r.notes ?? null,
    created_at: r.created_at,
    members: {
      id: r.member_id,
      full_name: r.member_name ?? "",
      member_code: r.member_code ?? "",
      phone: null,
      photo_url: null,
    },
  }))

  const schedule =
    loan.durationMonths && loan.monthlyPayment && loan.createdAt
      ? formatLoanSchedule(loan.expectedReceived, loan.durationMonths, new Date(loan.createdAt))
      : []

  const { data: paymentRows = [] } = useQuery(
    `SELECT id, amount, balance_after, payment_method, reference_id, narration, created_at
     FROM transactions
     WHERE type = 'loan_repayment' AND member_id = ?
       AND (reference_id = ? OR narration LIKE ?)
     ORDER BY created_at ASC`,
    [loan.memberId, id, `%${loan.loanRef}%`]
  )

  const payments = (paymentRows as any[]).map((p) => ({
    id: p.id,
    amount: Number(p.amount ?? 0),
    balanceAfter: p.balance_after != null ? Number(p.balance_after) : null,
    paymentMethod: p.payment_method ?? null,
    narration: p.narration ?? null,
    createdAt: p.created_at ?? null,
  }))

  const TYPE_META: Record<string, { label: string; icon: React.ElementType; color: string; bg: string; sign: "+" | "-" | "" }> = {
    loan_repayment: {
      label: "Loan Repayment",
      icon: ArrowDownLeft,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-500/10",
      sign: "+",
    },
    savings_deposit: {
      label: "Savings Deposit",
      icon: ArrowDownLeft,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
      sign: "+",
    },
  }

  const repaidAmount = loan.expectedReceived - loan.balance
  const progress = loan.expectedReceived > 0
    ? Math.min(100, Math.round((repaidAmount / loan.expectedReceived) * 100))
    : 0

  const timelineEvents = [
    { label: "Applied", date: loan.createdAt, color: "bg-yellow-400" },
    { label: "Disbursed", date: loan.disbursedAt, color: "bg-purple-500" },
    { label: "Settled", date: loan.settledAt, color: "bg-green-500" },
  ].filter((e) => e.date)

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {/* ── Page header ── */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/loans">
            <button className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back to Loans
            </button>
          </Link>
        </div>
        <Link href={`/loans/${id}/contract`}>
          <Button variant="outline" size="sm" className="gap-2 rounded-lg">
            <FileText className="h-4 w-4" />
            View Contract
          </Button>
        </Link>
      </div>

      {/* ── Loan ref + status bar ── */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card px-6 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-medium tracking-widest text-muted-foreground uppercase">
            Loan Reference
          </p>
          <h1 className="font-mono text-xl font-bold text-foreground">
            {loan.loanRef}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <Badge
            variant={statusVariant[loan.status] ?? "outline"}
            className="px-3 py-1 text-sm capitalize"
          >
            {loan.status}
          </Badge>

          {loan.status === "active" && (
            <div className="flex items-center gap-2">
              <span className="hidden text-xs text-muted-foreground sm:block">
                Repaid
              </span>
              <div className="h-2 w-28 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-green-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-foreground">
                {progress}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Decline reason ── */}
      {loan.declineReason && (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div>
            <p className="text-sm font-semibold text-destructive">
              Decline Reason
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {loan.declineReason}
            </p>
          </div>
        </div>
      )}

      {/* ── Two-column: Borrower + Loan Summary ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Borrower */}
        <Section icon={User} title="Borrower">
          <InfoGrid>
            <InfoItem label="Full Name" value={loanWithMember.member_name} />
            <InfoItem
              label="Member Code"
              value={loanWithMember.member_code}
              mono
            />
            <InfoItem
              label="Phone"
              value={loanWithMember.member_phone ?? "—"}
            />
            <InfoItem
              label="Email"
              value={loanWithMember.member_email ?? "—"}
            />
          </InfoGrid>
        </Section>

        {/* Loan Summary */}
        <Section icon={Banknote} title="Loan Summary">
          <InfoGrid>
            <InfoItem label="Principal" value={formatUGX(loan.amount)} />
            <InfoItem
              label="Total to Repay"
              value={formatUGX(loan.expectedReceived)}
              accent="green"
            />
            <InfoItem
              label="Balance Remaining"
              value={formatUGX(loan.balance)}
              accent="orange"
            />
            <InfoItem
              label="Interest Rate"
              value={`${loan.interestRate}% · ${loan.interestType}`}
              accent="blue"
            />
            <InfoItem
              label="Duration"
              value={`${loan.durationMonths} months`}
            />
            <InfoItem label="Due Date" value={formatDate(loan.dueDate)} />
            {(loan.latePenaltyFee ?? 0) > 0 && (
              <InfoItem
                label="Late Penalty"
                value={formatUGX(loan.latePenaltyFee ?? 0)}
                accent="red"
              />
            )}
          </InfoGrid>
        </Section>
      </div>

      {/* ── Payment History ── */}
      {payments.length > 0 && (
        <Section icon={TrendingUp} title="Payment History">
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="max-h-72 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-xs tracking-widest text-muted-foreground uppercase">Date</TableHead>
                    <TableHead className="text-xs tracking-widest text-muted-foreground uppercase">Amount</TableHead>
                    <TableHead className="text-xs tracking-widest text-muted-foreground uppercase">Balance After</TableHead>
                    <TableHead className="text-xs tracking-widest text-muted-foreground uppercase">Payment Method</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => {
                    const meta = TYPE_META.loan_repayment
                    return (
                      <TableRow key={p.id} className="text-sm">
                        <TableCell className="text-muted-foreground tabular-nums">
                          {new Date(p.createdAt).toLocaleDateString("en-UG", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1.5 font-semibold tabular-nums">
                            <span className={`inline-flex items-center rounded-full p-0.5 ${meta.bg} ${meta.color}`}>
                              <ArrowDownLeft className="h-3 w-3" />
                            </span>
                            {meta.sign}{formatUGX(p.amount)}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground tabular-nums">
                          {p.balanceAfter != null ? formatUGX(p.balanceAfter) : "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground capitalize">
                          {p.paymentMethod ? p.paymentMethod.replace(/_/g, " ") : "—"}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </Section>
      )}

      {/* ── Payment Schedule ── */}
      <Section icon={Calendar} title="Payment Schedule">
        <div className="mb-6 grid grid-cols-3 gap-3">
          <PaymentTile
            label="Daily Payment"
            value={formatUGX(loan.dailyPayment ?? 0)}
            accent="blue"
          />
          <PaymentTile
            label="Monthly Payment"
            value={formatUGX(loan.monthlyPayment ?? 0)}
            accent="green"
          />
          <PaymentTile
            label="Late Penalty"
            value={formatUGX(loan.latePenaltyFee ?? 0)}
            accent="orange"
          />
        </div>

        {schedule.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="max-h-64 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-xs tracking-widest text-muted-foreground uppercase">
                      #
                    </TableHead>
                    <TableHead className="text-xs tracking-widest text-muted-foreground uppercase">
                      Due Date
                    </TableHead>
                    <TableHead className="text-xs tracking-widest text-muted-foreground uppercase">
                      Payment
                    </TableHead>
                    <TableHead className="text-xs tracking-widest text-muted-foreground uppercase">
                      Balance
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedule.map((row) => (
                    <TableRow key={row.installment} className="text-sm">
                      <TableCell className="text-muted-foreground">
                        {row.installment}
                      </TableCell>
                      <TableCell>{row.date}</TableCell>
                      <TableCell className="font-medium">
                        {formatUGX(row.amount)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatUGX(row.balance)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </Section>

      {/* ── Guarantors ── */}
      <GuarantorsSection
        loanId={id}
        loanRef={loan.loanRef}
        saccoId={loanRow.sacco_id}
        guarantors={guarantors as any}
        members={allMembers ?? []}
        borrowerMemberId={loan.memberId}
      />

      {/* ── Notes ── */}
      {loan.notes && (
        <div className="rounded-2xl border border-border bg-card px-6 py-5 shadow-sm">
          <p className="mb-2 text-xs font-medium tracking-widest text-muted-foreground uppercase">
            Notes
          </p>
          <p className="text-sm leading-relaxed text-foreground">
            {loan.notes}
          </p>
        </div>
      )}

      {/* ── Timeline ── */}
      {timelineEvents.length > 0 && (
        <Section icon={Clock} title="Timeline">
          <div className="relative pl-4">
            {/* vertical connector */}
            {timelineEvents.length > 1 && (
              <div className="absolute top-3 bottom-3 left-[7px] w-px bg-border" />
            )}
            <div className="space-y-4">
              {timelineEvents.map((event, i) => (
                <div key={i} className="relative flex items-center gap-4">
                  <div
                    className={`h-3 w-3 rounded-full ${event.color} shrink-0 ring-2 ring-background`}
                  />
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-foreground">
                      {event.label}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(event.date)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}
    </div>
  )
}
