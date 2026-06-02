// app/(dashboard)/loans/new/new-loan-form.tsx
// Multi-step form for creating a new loan application.
// Handles member selection, loan detail entry, guarantor management,
// live repayment calculation, and confirmation before server submission.
"use client"
import { useQuery, usePowerSync } from "@powersync/react"

import { useActionState, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { addLoanAction, LoanFormState } from "../actions"
import { offlineAddLoan } from "@/lib/powersync/offline-mutations"
import { calculateLoan } from "@/lib/pdf/loan-calculator"
import { formatUGX } from "@/lib/utils/format"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, ArrowLeft, Search, Plus, X } from "lucide-react"
import Link from "next/link"

// ─── Constants ────────────────────────────────────────────────────────────────

/** Default loan duration shown when the form first renders. */
const DEFAULT_DURATION_MONTHS = "12"

/** Maximum number of months allowed for a loan duration. */
const MAX_DURATION_MONTHS = 60

/** Dropdown list max height before it scrolls. */
const DROPDOWN_MAX_HEIGHT = "max-h-64"

/** Multiplier to convert displayed UGX amounts to stored cents. */
const CENTS_PER_UNIT = 100

// ─── Initial state ────────────────────────────────────────────────────────────

const INITIAL_FORM_STATE: LoanFormState = {}

// ─── Types ────────────────────────────────────────────────────────────────────

interface MemberOption {
  id: string
  full_name: string
  member_code: string
  phone: string | null
}

interface NewLoanFormProps {
  saccoId: string
  members?: MemberOption[]
  interestRates?: any[]
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Numbered section header with optional description. */
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

/** Labelled form field wrapper with optional hint and error message. */
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

/** Single stat card shown in the calculation summary section. */
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
  const accentColorMap = {
    green:   "text-green-600 dark:text-green-400",
    blue:    "text-blue-600 dark:text-blue-400",
    orange:  "text-orange-500 dark:text-orange-400",
    default: "text-foreground",
  }
  const valueColor = accentColorMap[accent ?? "default"]

  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border bg-background p-4">
      <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">{label}</p>
      <p className={`text-lg font-bold ${valueColor}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function NewLoanForm({ saccoId, members: membersProp = [], interestRates: ratesProp = [] }: NewLoanFormProps) {
  const router = useRouter()
  const db = usePowerSync()
  const [state, formAction, isPending] = useActionState(addLoanAction, INITIAL_FORM_STATE)
  const [offlineSuccess, setOfflineSuccess] = useState(false)

  // Form field state
  const [amount,           setAmount]           = useState("")
  const [durationMonths,   setDurationMonths]   = useState(DEFAULT_DURATION_MONTHS)
  const { data: memberRows = [] } = useQuery("SELECT id, full_name, member_code, phone FROM members WHERE sacco_id = ? ORDER BY full_name ASC", [saccoId])
  const { data: rateRows = [] } = useQuery("SELECT id, min_amount, max_amount, rate, rate_type FROM interest_rates WHERE sacco_id = ? AND is_active = 1", [saccoId])
  const members = membersProp.length > 0 ? membersProp : (memberRows as any[]).map((r) => ({ id: r.id, full_name: r.full_name, member_code: r.member_code, phone: r.phone ?? null }))
  const interestRates = ratesProp.length > 0 ? ratesProp : (rateRows as any[]).map((r) => ({ id: r.id, minAmount: Number(r.min_amount), maxAmount: Number(r.max_amount), rate: r.rate, rateType: r.rate_type }))
  const [selectedMemberId, setSelectedMemberId] = useState("")
  const [dueDate,          setDueDate]          = useState("")
  const [notes,            setNotes]            = useState("")
  const [confirmed,        setConfirmed]        = useState(false)

  // Member search dropdown
  const [memberSearchQuery, setMemberSearchQuery] = useState("")
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false)

  // Guarantor state
  const [guarantors,           setGuarantors]           = useState<MemberOption[]>([])
  const [guarantorSearchQuery, setGuarantorSearchQuery] = useState("")
  const [isGuarantorDropdownOpen, setIsGuarantorDropdownOpen] = useState(false)
  const [pendingGuarantorId,   setPendingGuarantorId]   = useState("")

  useEffect(() => {
    if (offlineSuccess) { router.push("/loans"); return }
    if (state.success) { toast.success("Loan application submitted successfully!"); router.push("/loans"); router.refresh() }
    if (state.error) toast.error(state.error)
  }, [state, router, offlineSuccess])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!navigator.onLine) {
      e.preventDefault()
      const fd = new FormData(e.currentTarget)
      const member_id = fd.get("member_id") as string
      const amountVal = Number(fd.get("amount"))
      const interest_rate = fd.get("interest_rate") as string
      const interest_type = (fd.get("interest_type") as string) || "monthly"
      const duration_months = Number(fd.get("duration_months") || 1)
      if (!member_id || !amountVal || !interest_rate) { toast.error("Member, amount, and interest rate are required."); return }
      offlineAddLoan(db, saccoId, {
        member_id, amount: amountVal, interest_rate, interest_type, duration_months,
        due_date: (fd.get("due_date") as string) || null,
        notes: (fd.get("notes") as string) || null,
        expected_received: Number(fd.get("expected_received") || amountVal),
        daily_payment: Number(fd.get("daily_payment") || 0),
        monthly_payment: Number(fd.get("monthly_payment") || 0),
        late_penalty_fee: Number(fd.get("late_penalty_fee") || 0),
      }).then(() => { toast.success("Loan saved offline — will sync when connected."); setOfflineSuccess(true) })
        .catch(() => toast.error("Failed to save offline."))
    }
  }

  // Filter members for the primary member dropdown
  const filteredMembers = members.filter((member) => {
    const query = memberSearchQuery.toLowerCase()
    return (
      member.full_name.toLowerCase().includes(query)   ||
      member.member_code.toLowerCase().includes(query) ||
      (member.phone && member.phone.toLowerCase().includes(query))
    )
  })

  // Filter guarantor candidates — exclude the borrower and already-added guarantors
  const guarantorMemberIds    = new Set(guarantors.map((g) => g.id))
  const guarantorCandidates   = members.filter(
    (m) => m.id !== selectedMemberId && !guarantorMemberIds.has(m.id)
  )
  const filteredGuarantorCandidates = guarantorCandidates.filter((member) => {
    const query = guarantorSearchQuery.toLowerCase()
    return (
      member.full_name.toLowerCase().includes(query)   ||
      member.member_code.toLowerCase().includes(query) ||
      (member.phone && member.phone.toLowerCase().includes(query))
    )
  })

  // Look up the interest rate tier that covers the entered amount
  const getInterestInfo = () => {
    if (!amount || Number(amount) <= 0) return null
    const amountCents = Number(amount) * CENTS_PER_UNIT
    const matchingRate = interestRates.find(
      (rate) => amountCents >= rate.minAmount && amountCents <= rate.maxAmount
    )
    if (!matchingRate) return null
    return {
      rate:      Number(matchingRate.rate),
      rateType:  matchingRate.rateType,
      minAmount: matchingRate.minAmount / CENTS_PER_UNIT,
      maxAmount: matchingRate.maxAmount / CENTS_PER_UNIT,
    }
  }

  const interestInfo  = getInterestInfo()
  const isAmountValid = interestInfo !== null && Number(amount) > 0

  // Compute the full repayment schedule when amount + duration are valid
  const calculation = isAmountValid && durationMonths
    ? calculateLoan({
        principal:      Number(amount) * CENTS_PER_UNIT,
        interestRate:   interestInfo!.rate,
        interestType:   interestInfo!.rateType as "daily" | "monthly" | "annual",
        durationMonths: Number(durationMonths),
      })
    : null

  const fieldError    = (field: string) => state.fieldErrors?.[field]?.[0]
  const isFormValid   = selectedMemberId && isAmountValid && dueDate && confirmed
  const selectedMember = members.find((m) => m.id === selectedMemberId)

  return (
    <form action={formAction} onSubmit={handleSubmit} className="mx-auto max-w-2xl">

      {/* ── Step 1: Member selection ── */}
      <div className="mb-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <SectionHeader
          step={1}
          title="Select Member"
          description="Choose the member this loan will be assigned to."
        />
        <Field id="member_id" label="Member" required error={fieldError("member_id")}>
          <Select
            value={selectedMemberId}
            onValueChange={(value) => {
              setSelectedMemberId(value ?? "")
              setIsMemberDropdownOpen(false)
              setMemberSearchQuery("")
            }}
            open={isMemberDropdownOpen}
            onOpenChange={setIsMemberDropdownOpen}
          >
            <SelectTrigger id="member_id" className={`${"h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-all"} w-full`}>
              <SelectValue placeholder="Search and choose a member…">
                {selectedMember && (
                  <span className="flex flex-col items-start leading-tight">
                    <span className="font-medium text-foreground">{selectedMember.full_name}</span>
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
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className={`${DROPDOWN_MAX_HEIGHT} overflow-y-auto`}>
                {filteredMembers.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    No member found.
                  </div>
                ) : (
                  filteredMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id} className="cursor-pointer">
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

      {/* ── Step 2: Loan details ── */}
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
                ? "Amount must be within a valid interest rate range"
                : fieldError("amount")
            }
            hint={
              isAmountValid && interestInfo
                ? `Rate: ${interestInfo.rate}% ${interestInfo.rateType}`
                : interestRates.length > 0
                  ? `Min: ${formatUGX(interestRates[0].min_amount / CENTS_PER_UNIT)}`
                  : undefined
            }
          >
            <Input
              id="amount" name="amount" type="number" placeholder="e.g. 500000"
              className={"h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-all"} value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Field>

          <Field
            id="duration_months" label="Duration (Months)" required
            error={fieldError("duration_months")} hint="Repayment period in months"
          >
            <Input
              id="duration_months" name="duration_months" type="number"
              min={1} max={MAX_DURATION_MONTHS} className={"h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-all"}
              value={durationMonths} onChange={(e) => setDurationMonths(e.target.value)}
            />
          </Field>

          <Field id="due_date" label="Expected Due Date" required error={fieldError("due_date")}>
            <Input
              id="due_date" name="due_date" type="date" className={"h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-all"}
              value={dueDate} onChange={(e) => setDueDate(e.target.value)}
            />
          </Field>

          <Field id="notes" label="Notes" hint="Optional additional remarks">
            <Input
              id="notes" name="notes" placeholder="e.g. Business expansion"
              className={"h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-all"} value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>
        </div>
      </div>

      {/* ── Step 3: Guarantors ── */}
      <div className="mb-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <SectionHeader
          step={3}
          title={`Guarantors (${guarantors.length})`}
          description="Select members who will guarantee this loan."
        />
        <div className="flex items-start gap-2">
          <div className="relative flex-1">
            <Select
              value={pendingGuarantorId}
              onValueChange={(value) => {
                setPendingGuarantorId(value ?? "")
                setIsGuarantorDropdownOpen(false)
                setGuarantorSearchQuery("")
              }}
              open={isGuarantorDropdownOpen}
              onOpenChange={setIsGuarantorDropdownOpen}
            >
              <SelectTrigger className={`${"h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-all"} w-full`}>
                <SelectValue placeholder="Search and add a guarantor…" />
              </SelectTrigger>
              <SelectContent className="p-0">
                <div className="flex items-center gap-2 border-b px-3 py-2">
                  <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, code, or phone…"
                    className="h-8 border-0 p-0 text-sm shadow-none focus-visible:ring-0"
                    value={guarantorSearchQuery}
                    onChange={(e) => setGuarantorSearchQuery(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className={`${DROPDOWN_MAX_HEIGHT} overflow-y-auto`}>
                  {filteredGuarantorCandidates.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      No members available.
                    </div>
                  ) : (
                    filteredGuarantorCandidates.map((m) => (
                      <SelectItem key={m.id} value={m.id} className="cursor-pointer">
                        <span className="flex flex-col leading-tight">
                          <span className="font-medium">{m.full_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {m.member_code}{m.phone && ` · ${m.phone}`}
                          </span>
                        </span>
                      </SelectItem>
                    ))
                  )}
                </div>
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button" variant="outline" size="icon"
            className="h-10 w-10 shrink-0 rounded-lg"
            disabled={!pendingGuarantorId}
            onClick={() => {
              const member = members.find((m) => m.id === pendingGuarantorId)
              if (member && !guarantors.some((g) => g.id === member.id)) {
                setGuarantors((prev) => [...prev, member])
              }
              setPendingGuarantorId("")
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {guarantors.length > 0 && (
          <div className="mt-4 space-y-2">
            {guarantors.map((guarantor) => (
              <div
                key={guarantor.id}
                className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                      {guarantor.full_name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold">{guarantor.full_name}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {guarantor.member_code}
                      {guarantor.phone && ` · ${guarantor.phone}`}
                    </p>
                  </div>
                </div>
                <Button
                  type="button" variant="ghost" size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => setGuarantors((prev) => prev.filter((x) => x.id !== guarantor.id))}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Step 4: Calculation summary (visible once amount + duration are valid) ── */}
      {interestInfo && calculation && (
        <div className="mb-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <SectionHeader
            step={4}
            title="Calculation Summary"
            description={`Based on a ${interestInfo.rate}% ${interestInfo.rateType} interest rate for amounts between ${formatUGX(interestInfo.minAmount)} – ${formatUGX(interestInfo.maxAmount)}.`}
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard label="Principal"      value={formatUGX(calculation.principal)} />
            <StatCard label="Total Interest" value={formatUGX(calculation.totalInterest)} accent="blue" />
            <StatCard label="Total to Repay" value={formatUGX(calculation.totalExpectedReceived)} accent="green" sub="Principal + interest" />
            <StatCard label="Monthly Payment" value={formatUGX(calculation.monthlyPayment)} />
            <StatCard label="Daily Payment"   value={formatUGX(calculation.dailyPayment)} />
            <StatCard label="Late Penalty (5%)" value={formatUGX(calculation.latePenaltyFee)} accent="orange" sub="Applied on overdue payments" />
          </div>
        </div>
      )}

      {/* ── Step 5: Confirmation checkbox ── */}
      {calculation && (
        <div className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <SectionHeader
            step={5}
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
              type="checkbox" id="confirm"
              className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            <p className="text-sm leading-relaxed text-muted-foreground">
              I confirm all information is correct. I understand the member is required to repay{" "}
              <span className="font-semibold text-foreground">
                {formatUGX(calculation.totalExpectedReceived)}
              </span>{" "}
              over{" "}
              <span className="font-semibold text-foreground">{durationMonths} months</span>{" "}
              with monthly instalments of{" "}
              <span className="font-semibold text-foreground">
                {formatUGX(calculation.monthlyPayment)}
              </span>
              . Late payments will incur a penalty of{" "}
              <span className="font-semibold text-orange-500">
                {formatUGX(calculation.latePenaltyFee)}
              </span>.
            </p>
          </label>
        </div>
      )}

      {/* ── Form actions ── */}
      <div className="flex items-center justify-between pt-2 pb-8">
        <Link href="/loans">
          <button type="button" className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
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
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting…</>
          ) : (
            "Submit Application →"
          )}
        </Button>
      </div>

      {/* Hidden fields carry form state to the server action */}
      <input type="hidden" name="member_id"       value={selectedMemberId} />
      <input type="hidden" name="amount"           value={amount} />
      <input type="hidden" name="duration_months"  value={durationMonths} />
      <input type="hidden" name="due_date"         value={dueDate} />
      <input type="hidden" name="notes"            value={notes} />
      <input type="hidden" name="guarantor_ids"    value={JSON.stringify(guarantors.map((g) => g.id))} />
    </form>
  )
}

// ─── Appendix ─────────────────────────────────────────────────────────────────
//
// EXPORTED COMPONENTS:
//   NewLoanForm({ members, interestRates })
//     – 5-step loan application form
//     – Steps: member select → loan details → guarantors → calc summary → confirm
//
// KEY CONSTANTS:
//   DEFAULT_DURATION_MONTHS  = "12"
//   MAX_DURATION_MONTHS      = 60
//   CENTS_PER_UNIT           = 100
//   "h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-all"              – shared Tailwind class for all inputs
//   DROPDOWN_MAX_HEIGHT      – max-h-64
//
// SUB-COMPONENTS (file-local):
//   SectionHeader  – numbered step header
//   Field          – labelled input wrapper with hint/error
//   StatCard       – single stat tile in the calculation summary
//
// RELATED FILES:
//   ../actions.ts                      – addLoanAction server action
//   lib/pdf/loan-calculator.ts         – calculateLoan(), getInterestRateForAmount()
//   lib/utils/format.ts                – formatUGX()
