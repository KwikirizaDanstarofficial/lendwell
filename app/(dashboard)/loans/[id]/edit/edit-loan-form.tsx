"use client"

import { useState, useEffect, useTransition, useRef } from "react"
import { useRouter } from "next/navigation"
import { usePowerSync } from "@powersync/react"
import { offlineEditLoan } from "@/lib/powersync/offline-mutations"
import { toast } from "sonner"
import { editLoanAction, LoanFormState } from "../../actions"
import { useSyncNow } from "@/lib/powersync/provider"
import { calculateLoan } from "@/lib/pdf/loan-calculator"
import { formatUGX } from "@/lib/utils/format"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { isOffline } from "@/lib/utils/is-offline"

const CENTS_PER_UNIT = 100
const MAX_DURATION_MONTHS = 60

const INITIAL_FORM_STATE: LoanFormState = {}

interface LoanData {
  id: string
  loanRef: string
  amount: number
  balance: number
  durationMonths: number
  dueDate: string | null
  notes: string | null
  interestRate: string
  interestType: string
  status: string
  memberName?: string
  memberCode?: string
}

interface EditLoanFormProps {
  loan: LoanData
  interestRates?: any[]
}

function SectionHeader({ step, title, description }: { step: number; title: string; description?: string }) {
  return (
    <div className="mb-6 flex items-start gap-4">
      <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold tracking-wide text-primary-foreground">
        {step}
      </div>
      <div>
        <h3 className="text-sm font-semibold tracking-widest text-foreground uppercase">
          {title}
        </h3>
        {description && (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  )
}

function Field({ id, label, required, error, hint, span, children }: {
  id: string; label: string; required?: boolean; error?: string; hint?: string; span?: boolean; children: React.ReactNode
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${span ? "sm:col-span-2" : ""}`}>
      <label htmlFor={id} className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p className="mt-0.5 flex items-center gap-1 text-xs text-destructive">
          <span className="inline-block h-1 w-1 rounded-full bg-destructive" />
          {error}
        </p>
      )}
    </div>
  )
}

function StatCard({ label, value, sub, accent }: {
  label: string; value: string; sub?: string; accent?: "green" | "blue" | "orange" | "default"
}) {
  const accentColorMap = {
    green: "text-green-600 dark:text-green-400",
    blue: "text-blue-600 dark:text-blue-400",
    orange: "text-orange-500 dark:text-orange-400",
    default: "text-foreground",
  }
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border bg-background p-4">
      <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">{label}</p>
      <p className={`text-lg font-bold ${accentColorMap[accent ?? "default"]}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

export function EditLoanForm({ loan, interestRates = [] }: EditLoanFormProps) {
  const db = usePowerSync()
  const router = useRouter()
  const { syncNow } = useSyncNow()
  const [state, setState] = useState<LoanFormState>(INITIAL_FORM_STATE)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  const initialAmount = loan.amount / CENTS_PER_UNIT
  const initialBalance = loan.balance / CENTS_PER_UNIT
  const [amount, setAmount] = useState(String(initialAmount))
  const [balance, setBalance] = useState(String(initialBalance))
  const [durationMonths, setDurationMonths] = useState(String(loan.durationMonths))
  const [dueDate, setDueDate] = useState(loan.dueDate ? loan.dueDate.slice(0, 10) : "")
  const [notes, setNotes] = useState(loan.notes ?? "")

  useEffect(() => {
    if (!state.success && !state.error) return
    if (state.success) {
      if (state.offlineSaved) {
        toast.success("Loan saved offline — will sync when you reconnect.")
      } else {
        toast.success("Loan updated successfully!")
      }
      router.push(`/loans/${loan.id}`)
      router.refresh()
    }
    if (state.error) toast.error(state.error)
  }, [state, router, loan.id])

  const getInterestInfo = () => {
    if (!amount || Number(amount) <= 0) return null
    const amountUGX = Number(amount)
    const matchingRate = interestRates.find(
      (rate) => amountUGX >= rate.minAmount && amountUGX <= rate.maxAmount
    )
    if (!matchingRate) return null
    return {
      rate: Number(matchingRate.rate),
      rateType: matchingRate.rateType,
      minAmount: matchingRate.minAmount,
      maxAmount: matchingRate.maxAmount,
    }
  }

  const interestInfo = getInterestInfo()
  const isAmountValid = interestInfo !== null && Number(amount) > 0

  const calculation = isAmountValid && durationMonths
    ? calculateLoan({
        principal: Number(amount) * CENTS_PER_UNIT,
        interestRate: interestInfo!.rate,
        interestType: interestInfo!.rateType as "daily" | "monthly" | "annual",
        durationMonths: Number(durationMonths),
      })
    : null

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const offlineData: Parameters<typeof offlineEditLoan>[2] = {
      amount: Number(formData.get("amount") || 0) * CENTS_PER_UNIT,
      duration_months: Number(formData.get("duration_months") || loan.durationMonths),
      due_date: (formData.get("due_date") as string) || null,
      notes: (formData.get("notes") as string) || null,
    }

    // Include recalculated interest fields if calculation is available
    if (calculation && interestInfo) {
      offlineData.interest_rate = String(interestInfo.rate)
      offlineData.interest_type = interestInfo.rateType
      offlineData.expected_received = calculation.totalExpectedReceived
      offlineData.daily_payment = calculation.dailyPayment
      offlineData.monthly_payment = calculation.monthlyPayment
      offlineData.late_penalty_fee = calculation.latePenaltyFee
    }

    startTransition(async () => {
      if (isOffline()) {
        try {
          await offlineEditLoan(db, loan.id, offlineData)
          setState({ success: true, offlineSaved: true })
        } catch {
          setState({ error: "Failed to save offline. Please try again." })
        }
        return
      }
      try {
        const result = await editLoanAction(state, formData)
        if (!result.offline && !result.error) {
          syncNow()
          setState(result)
          return
        }
      } catch {
        // Network error - fall through to offline fallback
      }
      try {
        await offlineEditLoan(db, loan.id, offlineData)
        setState({ success: true, offlineSaved: true })
      } catch {
        setState({ error: "Failed to save offline. Please try again." })
      }
    })
  }

  const fieldError = (field: string) => state.fieldErrors?.[field]?.[0]
  const INPUT_CLASS = "h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-all"

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="mx-auto max-w-2xl">
      <div className="mb-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <SectionHeader step={1} title="Loan Information" description="Review and update the loan details." />
        <div className="mb-4 rounded-xl border border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
                Loan Reference
              </p>
              <p className="font-mono text-lg font-bold text-foreground">{loan.loanRef}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
                Status
              </p>
              <p className="text-sm font-semibold capitalize text-foreground">{loan.status}</p>
            </div>
          </div>
          {loan.memberName && (
            <div className="mt-3 border-t border-border pt-3">
              <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Member</p>
              <p className="text-sm font-semibold text-foreground">{loan.memberName}</p>
              {loan.memberCode && (
                <p className="font-mono text-xs text-muted-foreground">{loan.memberCode}</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mb-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <SectionHeader step={2} title="Loan Details" description="Modify the principal amount, duration, and repayment date." />
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
          <Field
            id="amount" label="Loan Amount (UGX)" required
            error={!isAmountValid && amount ? "Amount must be within a valid interest rate range" : fieldError("amount")}
            hint={isAmountValid && interestInfo ? `Rate: ${interestInfo.rate}% ${interestInfo.rateType}` : undefined}
          >
            <Input id="amount" name="amount" type="number" placeholder="e.g. 500000"
              className={INPUT_CLASS} value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Field>

          <Field id="duration_months" label="Duration (Months)" required
            error={fieldError("duration_months")} hint="Repayment period in months"
          >
            <Input id="duration_months" name="duration_months" type="number"
              min={1} max={MAX_DURATION_MONTHS} className={INPUT_CLASS}
              value={durationMonths} onChange={(e) => setDurationMonths(e.target.value)}
            />
          </Field>

          <Field id="due_date" label="Expected Due Date" required error={fieldError("due_date")}>
            <Input id="due_date" name="due_date" type="date" className={INPUT_CLASS}
              value={dueDate} onChange={(e) => setDueDate(e.target.value)}
            />
          </Field>

          <Field id="notes" label="Notes" hint="Optional additional remarks">
            <Input id="notes" name="notes" placeholder="e.g. Business expansion"
              className={INPUT_CLASS} value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>

          <Field id="balance" label="Outstanding Balance (UGX)" required
            hint="Current amount remaining to be repaid"
          >
            <Input id="balance" name="balance" type="number" placeholder="0"
              className={INPUT_CLASS} value={balance}
              onChange={(e) => setBalance(e.target.value)}
            />
          </Field>
        </div>
      </div>

      {interestInfo && calculation && (
        <div className="mb-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <SectionHeader step={3} title="Calculation Summary"
            description={`Based on a ${interestInfo.rate}% ${interestInfo.rateType} interest rate for amounts between ${formatUGX(interestInfo.minAmount * 100)} – ${formatUGX(interestInfo.maxAmount * 100)}.`}
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard label="Principal" value={formatUGX(calculation.principal)} />
            <StatCard label="Total Interest" value={formatUGX(calculation.totalInterest)} accent="blue" />
            <StatCard label="Total to Repay" value={formatUGX(calculation.totalExpectedReceived)} accent="green" sub="Principal + interest" />
            <StatCard label="Monthly Payment" value={formatUGX(calculation.monthlyPayment)} />
            <StatCard label="Daily Payment" value={formatUGX(calculation.dailyPayment)} />
            <StatCard label="Late Penalty (5%)" value={formatUGX(calculation.latePenaltyFee)} accent="orange" sub="Applied on overdue payments" />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 pb-8">
        <Link href={`/loans/${loan.id}`}>
          <button type="button" className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Cancel
          </button>
        </Link>
        <Button type="submit" disabled={isPending || !isAmountValid}
          className="h-10 rounded-xl px-6 text-sm font-medium tracking-wide shadow-sm transition-all"
        >
          {isPending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
          ) : (
            "Save Changes →"
          )}
        </Button>
      </div>

      <input type="hidden" name="loan_id" value={loan.id} />
      <input type="hidden" name="amount" value={amount} />
      <input type="hidden" name="balance" value={balance} />
      <input type="hidden" name="duration_months" value={durationMonths} />
      <input type="hidden" name="due_date" value={dueDate} />
      <input type="hidden" name="notes" value={notes} />
    </form>
  )
}
