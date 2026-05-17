// app/(dashboard)/loans/new/new-loan-form.tsx
"use client"

import { useActionState, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { addLoanAction, LoanFormState } from "../actions"
import { calculateLoan } from "@/lib/pdf/loan-calculator"
import { formatUGX } from "@/lib/utils/format"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Loader2,
  Calculator,
  ArrowLeft,
  CheckCircle,
  Search,
  TrendingUp,
  Banknote,
  Clock,
  AlertTriangle,
} from "lucide-react"
import Link from "next/link"

const initialState: LoanFormState = {}

interface NewLoanFormProps {
  members: {
    id: string
    full_name: string
    member_code: string
    phone: string | null
  }[]
  interestRates: any[]
}

// ── Reusable field components ────────────────────────────────────────────────

function SectionHeader({
  step,
  title,
  description,
}: {
  step: number
  title: string
  description?: string
}) {
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

function Field({
  id,
  label,
  required,
  error,
  hint,
  span,
  children,
}: {
  id: string
  label: string
  required?: boolean
  error?: string
  hint?: string
  span?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${span ? "sm:col-span-2" : ""}`}>
      <label
        htmlFor={id}
        className="text-xs font-medium tracking-widest text-muted-foreground uppercase"
      >
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && (
        <p className="mt-0.5 flex items-center gap-1 text-xs text-destructive">
          <span className="inline-block h-1 w-1 rounded-full bg-destructive" />
          {error}
        </p>
      )}
    </div>
  )
}

const inputClass =
  "h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-all"

// ── Summary Stat Card ────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string
  sub?: string
  accent?: "green" | "blue" | "orange" | "default"
}) {
  const valueColor =
    accent === "green"
      ? "text-green-600 dark:text-green-400"
      : accent === "blue"
        ? "text-blue-600 dark:text-blue-400"
        : accent === "orange"
          ? "text-orange-500 dark:text-orange-400"
          : "text-foreground"

  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border bg-background p-4">
      <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
        {label}
      </p>
      <p className={`text-lg font-bold ${valueColor}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────

export function NewLoanForm({ members, interestRates }: NewLoanFormProps) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(
    addLoanAction,
    initialState
  )

  const [amount, setAmount] = useState("")
  const [durationMonths, setDurationMonths] = useState("12")
  const [selectedMemberId, setSelectedMemberId] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [notes, setNotes] = useState("")
  const [confirmed, setConfirmed] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  useEffect(() => {
    if (state.success) {
      toast.success("Loan application submitted successfully!")
      router.push("/loans")
      router.refresh()
    }
    if (state.error) {
      toast.error(state.error)
    }
  }, [state, router])

  const filteredMembers = members.filter((member) => {
    const q = searchQuery.toLowerCase()
    return (
      member.full_name.toLowerCase().includes(q) ||
      member.member_code.toLowerCase().includes(q) ||
      (member.phone && member.phone.toLowerCase().includes(q))
    )
  })

  const getInterestInfo = () => {
    if (!amount || Number(amount) <= 0) return null
    const amountCents = Number(amount) * 100
    const applicable = interestRates.find(
      (rate) => amountCents >= rate.minAmount && amountCents <= rate.maxAmount
    )
    if (!applicable) return null
    return {
      rate: Number(applicable.rate),
      rateType: applicable.rateType,
      minAmount: applicable.minAmount / 100,
      maxAmount: applicable.maxAmount / 100,
    }
  }

  const interestInfo = getInterestInfo()
  const isAmountValid = interestInfo !== null && Number(amount) > 0

  const calculation =
    isAmountValid && durationMonths
      ? calculateLoan({
          principal: Number(amount) * 100,
          interestRate: interestInfo!.rate,
          interestType: interestInfo!.rateType as
            | "daily"
            | "monthly"
            | "annual",
          durationMonths: Number(durationMonths),
        })
      : null

  const fieldError = (field: string) => state.fieldErrors?.[field]?.[0]
  const isFormValid = selectedMemberId && isAmountValid && dueDate && confirmed
  const selectedMember = members.find((m) => m.id === selectedMemberId)

  return (
    <form action={formAction} className="mx-auto max-w-2xl">
      {/* ── Section 1: Member ── */}
      <div className="mb-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <SectionHeader
          step={1}
          title="Select Member"
          description="Choose the member this loan will be assigned to."
        />

        <Field
          id="member_id"
          label="Member"
          required
          error={fieldError("member_id")}
        >
          <Select
            value={selectedMemberId}
            onValueChange={(value) => {
              setSelectedMemberId(value ?? "")
              setIsSearchOpen(false)
              setSearchQuery("")
            }}
            open={isSearchOpen}
            onOpenChange={setIsSearchOpen}
          >
            <SelectTrigger id="member_id" className={`${inputClass} w-full`}>
              <SelectValue placeholder="Search and choose a member…">
                {selectedMember && (
                  <span className="flex flex-col items-start leading-tight">
                    <span className="font-medium text-foreground">
                      {selectedMember.full_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {selectedMember.member_code}
                      {selectedMember.phone && ` · ${selectedMember.phone}`}
                    </span>
                  </span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="p-0">
              <div className="flex items-center gap-2 border-b px-3 py-2">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Input
                  placeholder="Search by name, code, or phone…"
                  className="h-8 border-0 p-0 text-sm shadow-none focus-visible:ring-0"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="max-h-64 overflow-y-auto">
                {filteredMembers.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    No member found.
                  </div>
                ) : (
                  filteredMembers.map((member) => (
                    <SelectItem
                      key={member.id}
                      value={member.id}
                      className="cursor-pointer"
                    >
                      <span className="flex flex-col leading-tight">
                        <span className="font-medium">{member.full_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {member.member_code}
                          {member.phone && ` · ${member.phone}`}
                        </span>
                      </span>
                    </SelectItem>
                  ))
                )}
              </div>
            </SelectContent>
          </Select>
        </Field>
      </div>

      {/* ── Section 2: Loan Details ── */}
      <div className="mb-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <SectionHeader
          step={2}
          title="Loan Details"
          description="Set the principal amount, duration, and repayment date."
        />

        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
          <Field
            id="amount"
            label="Loan Amount (UGX)"
            required
            error={
              !isAmountValid && amount
                ? `Amount must be within a valid interest rate range`
                : fieldError("amount")
            }
            hint={
              isAmountValid && interestInfo
                ? `Rate: ${interestInfo.rate}% ${interestInfo.rateType}`
                : interestRates.length > 0
                  ? `Min: ${formatUGX(interestRates[0].min_amount / 100)}`
                  : undefined
            }
          >
            <Input
              id="amount"
              name="amount"
              type="number"
              placeholder="e.g. 500000"
              className={inputClass}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Field>

          <Field
            id="duration_months"
            label="Duration (Months)"
            required
            error={fieldError("duration_months")}
            hint="Repayment period in months"
          >
            <Input
              id="duration_months"
              name="duration_months"
              type="number"
              min={1}
              max={60}
              className={inputClass}
              value={durationMonths}
              onChange={(e) => setDurationMonths(e.target.value)}
            />
          </Field>

          <Field
            id="due_date"
            label="Expected Due Date"
            required
            error={fieldError("due_date")}
          >
            <Input
              id="due_date"
              name="due_date"
              type="date"
              className={inputClass}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </Field>

          <Field id="notes" label="Notes" hint="Optional additional remarks">
            <Input
              id="notes"
              name="notes"
              placeholder="e.g. Business expansion"
              className={inputClass}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>
        </div>
      </div>

      {/* ── Section 3: Calculation Summary ── */}
      {interestInfo && calculation && (
        <div className="mb-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <SectionHeader
            step={3}
            title="Calculation Summary"
            description={`Based on a ${interestInfo.rate}% ${interestInfo.rateType} interest rate for amounts between ${formatUGX(interestInfo.minAmount)} – ${formatUGX(interestInfo.maxAmount)}.`}
          />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard
              label="Principal"
              value={formatUGX(calculation.principal)}
            />
            <StatCard
              label="Total Interest"
              value={formatUGX(calculation.totalInterest)}
              accent="blue"
            />
            <StatCard
              label="Total to Repay"
              value={formatUGX(calculation.totalExpectedReceived)}
              accent="green"
              sub="Principal + interest"
            />
            <StatCard
              label="Monthly Payment"
              value={formatUGX(calculation.monthlyPayment)}
            />
            <StatCard
              label="Daily Payment"
              value={formatUGX(calculation.dailyPayment)}
            />
            <StatCard
              label="Late Penalty (5%)"
              value={formatUGX(calculation.latePenaltyFee)}
              accent="orange"
              sub="Applied on overdue payments"
            />
          </div>
        </div>
      )}

      {/* ── Section 4: Confirmation ── */}
      {calculation && (
        <div className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <SectionHeader
            step={4}
            title="Confirmation"
            description="Review and confirm the loan terms before submitting."
          />

          <label
            htmlFor="confirm"
            className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-all ${
              confirmed
                ? "border-primary/40 bg-primary/5"
                : "border-border hover:border-ring/40 hover:bg-accent/40"
            }`}
          >
            <input
              type="checkbox"
              id="confirm"
              className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            <p className="text-sm leading-relaxed text-muted-foreground">
              I confirm all information is correct. I understand the member is
              required to repay{" "}
              <span className="font-semibold text-foreground">
                {formatUGX(calculation.totalExpectedReceived)}
              </span>{" "}
              over{" "}
              <span className="font-semibold text-foreground">
                {durationMonths} months
              </span>{" "}
              with monthly instalments of{" "}
              <span className="font-semibold text-foreground">
                {formatUGX(calculation.monthlyPayment)}
              </span>
              . Late payments will incur a penalty of{" "}
              <span className="font-semibold text-orange-500">
                {formatUGX(calculation.latePenaltyFee)}
              </span>
              .
            </p>
          </label>
        </div>
      )}

      {/* ── Actions ── */}
      <div className="flex items-center justify-between pt-2 pb-8">
        <Link href="/loans">
          <button
            type="button"
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Cancel
          </button>
        </Link>

        <Button
          type="submit"
          disabled={isPending || !isFormValid}
          className="h-10 rounded-xl px-6 text-sm font-medium tracking-wide shadow-sm transition-all"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting…
            </>
          ) : (
            "Submit Application →"
          )}
        </Button>
      </div>

      {/* Hidden fields */}
      <input type="hidden" name="member_id" value={selectedMemberId} />
      <input type="hidden" name="amount" value={amount} />
      <input type="hidden" name="duration_months" value={durationMonths} />
      <input type="hidden" name="due_date" value={dueDate} />
      <input type="hidden" name="notes" value={notes} />
    </form>
  )
}
