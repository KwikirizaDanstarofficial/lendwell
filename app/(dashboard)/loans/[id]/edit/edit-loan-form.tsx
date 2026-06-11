"use client"

import { useActionState, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePowerSync } from "@powersync/react"
import { toast } from "sonner"
import { updateLoanAction } from "../../actions"
import { offlineEditLoan } from "@/lib/powersync/offline-mutations"
import { calculateLoan } from "@/lib/pdf/loan-calculator"
import { formatUGX } from "@/lib/utils/format"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { isOffline } from "@/lib/utils/is-offline"
import type { LoanFormState } from "../../actions"

const CENTS_PER_UNIT = 100
const MAX_DURATION_MONTHS = 60
const INITIAL_FORM_STATE: LoanFormState = {}

type Loan = {
  id: string
  saccoId: string
  memberId: string
  memberName: string
  memberCode: string
  loanRef: string
  amount: number
  balance: number
  interestRate: string
  interestType: string
  durationMonths: number
  latePenaltyFee: number
  dailyPayment: number
  monthlyPayment: number
  status: string
  dueDate: Date | null
  notes: string | null
  expectedReceived: number
  createdAt: Date | null
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold tracking-widest text-foreground uppercase">{title}</h3>
      {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
    </div>
  )
}

function Field({
  id, label, required, error, children,
}: {
  id: string; label: string; required?: boolean; error?: string; children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-0.5 flex items-center gap-1 text-xs text-destructive">
          <span className="inline-block h-1 w-1 rounded-full bg-destructive" />
          {error}
        </p>
      )}
    </div>
  )
}

function inputClass() {
  return "h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-all w-full"
}

export function EditLoanForm({ loan }: { loan: Loan }) {
  const router = useRouter()
  const db = usePowerSync()

  const [amount, setAmount] = useState(String(loan.amount / CENTS_PER_UNIT))
  const [durationMonths, setDurationMonths] = useState(String(loan.durationMonths))
  const [dueDate, setDueDate] = useState(loan.dueDate ? loan.dueDate.toISOString().split("T")[0] : "")
  const [notes, setNotes] = useState(loan.notes ?? "")

  const boundAction = updateLoanAction.bind(null, loan.id)
  const [state, formAction, isPending] = useActionState(boundAction, INITIAL_FORM_STATE)

  useEffect(() => {
    if (state.success) {
      toast.success("Loan updated successfully!")
      router.push(`/loans/${loan.id}`)
    }
    if (state.error) {
      toast.error(state.error)
    }
  }, [state, router, loan.id])

  const interestRate = Number(loan.interestRate || 0)
  const interestType = loan.interestType || "monthly"
  const amountVal = Number(amount)
  const isAmountValid = amountVal > 0

  const calculation = isAmountValid && durationMonths
    ? calculateLoan({
        principal: amountVal * CENTS_PER_UNIT,
        interestRate,
        interestType: interestType as "daily" | "monthly" | "annual",
        durationMonths: Number(durationMonths),
      })
    : null

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (isOffline()) {
      e.preventDefault()
      const amountCents = Math.round(amountVal * CENTS_PER_UNIT)
      offlineEditLoan(db, loan.id, {
        amount: amountCents,
        duration_months: Number(durationMonths),
        due_date: dueDate || null,
        notes: notes || null,
        interest_rate: String(interestRate),
        interest_type: interestType,
        expected_received: calculation?.totalExpectedReceived ?? 0,
        daily_payment: calculation?.dailyPayment ?? 0,
        monthly_payment: calculation?.monthlyPayment ?? 0,
        late_penalty_fee: calculation?.latePenaltyFee ?? 0,
      }).then(() => {
        toast.success("Loan updated offline — will sync when connected.")
        router.push(`/loans/${loan.id}`)
      }).catch(() => toast.error("Failed to save offline."))
    }
  }

  const fieldError = (field: string) => state.fieldErrors?.[field]?.[0]

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <SectionHeader
          title="Loan Information"
          description="Update the loan principal, duration, and repayment details."
        />
        <div className="mb-4 rounded-xl border border-border bg-muted/30 px-4 py-3">
          <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Member</p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">
            {loan.memberName}
            <span className="ml-2 font-mono text-xs text-muted-foreground">{loan.memberCode}</span>
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {loan.loanRef} · <span className="capitalize">{loan.status}</span>
          </p>
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
          <Field id="amount" label="Loan Amount (UGX)" required error={fieldError("amount")}>
            <Input
              id="amount" name="amount" type="number" placeholder="e.g. 500000"
              className={inputClass()} value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Field>
          <Field id="duration_months" label="Duration (Months)" required error={fieldError("duration_months")}>
            <Input
              id="duration_months" name="duration_months" type="number"
              min={1} max={MAX_DURATION_MONTHS}
              className={inputClass()}
              value={durationMonths} onChange={(e) => setDurationMonths(e.target.value)}
            />
          </Field>
          <Field id="due_date" label="Expected Due Date" required error={fieldError("due_date")}>
            <Input
              id="due_date" name="due_date" type="date"
              className={inputClass()}
              value={dueDate} onChange={(e) => setDueDate(e.target.value)}
            />
          </Field>
          <Field id="notes" label="Notes">
            <Input
              id="notes" name="notes" placeholder="Optional remarks"
              className={inputClass()} value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>
        </div>
      </div>

      {calculation && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <SectionHeader
            title="Calculation Summary"
            description={`Based on ${interestRate}% ${interestType} interest rate.`}
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard label="Principal" value={formatUGX(calculation.principal)} />
            <StatCard label="Total Interest" value={formatUGX(calculation.totalInterest)} accent="blue" />
            <StatCard label="Total to Repay" value={formatUGX(calculation.totalExpectedReceived)} accent="green" />
            <StatCard label="Monthly Payment" value={formatUGX(calculation.monthlyPayment)} />
            <StatCard label="Daily Payment" value={formatUGX(calculation.dailyPayment)} />
            <StatCard label="Late Penalty (5%)" value={formatUGX(calculation.latePenaltyFee)} accent="orange" />
          </div>
        </div>
      )}

      <input type="hidden" name="interest_rate" value={String(interestRate)} />
      <input type="hidden" name="interest_type" value={interestType} />
      {calculation && (
        <>
          <input type="hidden" name="expected_received" value={String(calculation.totalExpectedReceived)} />
          <input type="hidden" name="daily_payment" value={String(calculation.dailyPayment)} />
          <input type="hidden" name="monthly_payment" value={String(calculation.monthlyPayment)} />
          <input type="hidden" name="late_penalty_fee" value={String(calculation.latePenaltyFee)} />
        </>
      )}

      <div className="flex items-center justify-between pt-2 pb-8">
        <Link href={`/loans/${loan.id}`}>
          <button type="button" className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Cancel
          </button>
        </Link>
        <Button
          type="submit"
          disabled={isPending || !isAmountValid}
          className="h-10 rounded-xl px-6 text-sm font-medium tracking-wide shadow-sm transition-all"
        >
          {isPending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
          ) : (
            "Save Changes →"
          )}
        </Button>
      </div>
    </form>
  )
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: "green" | "blue" | "orange" | "default" }) {
  const colors: Record<string, string> = {
    green: "text-green-600 dark:text-green-400",
    blue: "text-blue-600 dark:text-blue-400",
    orange: "text-orange-500 dark:text-orange-400",
    default: "text-foreground",
  }
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border bg-background p-4">
      <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">{label}</p>
      <p className={`text-lg font-bold ${colors[accent ?? "default"]}`}>{value}</p>
    </div>
  )
}
