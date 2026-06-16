"use client"

import { useState, useMemo } from "react"
import { useQuery } from "@powersync/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Search, Plus, Download, Percent, Filter } from "lucide-react"
import { LoansTable } from "./loans-table"
import { LoanPdfReport } from "./loan-pdf-report"
import ExcelJS from "exceljs"
import { toast } from "sonner"
import Link from "next/link"
import { cn } from "@/lib/utils"

const CENTS_PER_UNIT = 100
const EXPORT_FILENAME = "sacco-loans.xlsx"
const XLSX_MIME_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

const EXPORT_COLUMNS = [
  { header: "Loan Ref",                key: "loan_ref",           width: 15 },
  { header: "Member",                  key: "member",             width: 25 },
  { header: "Member Code",             key: "member_code",        width: 15 },
  { header: "Amount (UGX)",            key: "amount",             width: 15 },
  { header: "Expected Received (UGX)", key: "expected_received",  width: 20 },
  { header: "Paid (UGX)",              key: "paid_amount",        width: 15 },
  { header: "Balance (UGX)",           key: "balance",            width: 15 },
  { header: "Interest Rate",           key: "interest_rate",      width: 15 },
  { header: "Interest Type",           key: "interest_type",      width: 15 },
  { header: "Duration (Months)",       key: "duration_months",    width: 18 },
  { header: "Daily Payment",           key: "daily_payment",      width: 15 },
  { header: "Monthly Payment",         key: "monthly_payment",    width: 17 },
  { header: "Late Penalty Fee",        key: "late_penalty_fee",   width: 18 },
  { header: "Status",                  key: "status",             width: 10 },
  { header: "Overdue",                 key: "overdue",            width: 10 },
  { header: "Missed Payments",         key: "missed_payments",    width: 16 },
  { header: "Due Date",                key: "due_date",           width: 15 },
  { header: "Created At",              key: "created_at",         width: 15 },
] as const

const DISBURSED_STATUSES = ["disbursed", "active", "settled"]
const OUTSTANDING_STATUSES = ["disbursed", "active"]

interface LoansClientProps {
  saccoId: string
}

export function LoansClient({ saccoId }: LoansClientProps) {
  const [activeTab, setActiveTab] = useState("all")
  const [search, setSearch] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [filterOverdue, setFilterOverdue] = useState(false)
  const [filterMissed, setFilterMissed] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const { data: rows = [], isLoading } = useQuery(
    `SELECT l.*, m.full_name AS member_name, m.member_code AS member_code_val,
            m.phone AS member_phone,
            m.national_id AS member_national_id,
            m.address AS member_address
     FROM loans l
     LEFT JOIN members m ON m.id = l.member_id
     WHERE l.sacco_id = ?
     ORDER BY l.created_at DESC`,
    [saccoId]
  )

  const { data: interestRateRows = [] } = useQuery(
    "SELECT * FROM interest_rates WHERE sacco_id = ? AND is_active = 1",
    [saccoId]
  )

  const { data: todayRepayments = [] } = useQuery(
    `SELECT reference_id, narration FROM transactions
     WHERE type = 'loan_repayment' AND date(created_at) = date('now')`,
    [saccoId]
  )

  const repaymentLoanRefs = useMemo(() => {
    const refs = new Set<string>()
    for (const tx of todayRepayments as any[]) {
      if (tx.reference_id) {
        const matched = (rows as any[]).find((r) => r.id === tx.reference_id)
        if (matched) refs.add(matched.loan_ref)
      } else if (tx.narration) {
        const match = tx.narration.match(/Loan repayment - (.+)$/)
        if (match) refs.add(match[1])
      }
    }
    return refs
  }, [rows, todayRepayments])

  const loans = useMemo(
    () => {
      const now = new Date()
      return (rows as any[]).map((r) => {
        const dueDate = r.due_date ? new Date(r.due_date) : null
        const isOverdue = !!(
          (r.status === "active" || r.status === "disbursed") &&
          dueDate &&
          dueDate < now &&
          r.balance > 0
        )
        const isActiveUnsettled = (r.status === "active" || r.status === "disbursed") && r.balance > 0
        const hasMissedPayment = isActiveUnsettled && !repaymentLoanRefs.has(r.loan_ref)
        const paidAmount = Math.max(0, (r.expected_received || 0) - (r.balance || 0))

        return {
          id:                r.id,
          saccoId:           r.sacco_id,
          memberId:          r.member_id,
          categoryId:        r.category_id,
          loanRef:           r.loan_ref,
          amount:            r.amount,
          balance:           r.balance,
          interestRate:      r.interest_rate,
          status:            r.status,
          dueDate:           r.due_date ? new Date(r.due_date) : null,
          disbursedAt:       r.disbursed_at ? new Date(r.disbursed_at) : null,
          settledAt:         r.settled_at ? new Date(r.settled_at) : null,
          declineReason:     r.decline_reason,
          notes:             r.notes,
          createdAt:         r.created_at ? new Date(r.created_at) : null,
          updatedAt:         r.updated_at ? new Date(r.updated_at) : null,
          expectedReceived:  r.expected_received,
          interestType:      r.interest_type,
          durationMonths:    r.duration_months,
          latePenaltyFee:    r.late_penalty_fee,
          dailyPayment:      r.daily_payment,
          monthlyPayment:    r.monthly_payment,
          memberName:        r.member_name ?? null,
          memberCode:        r.member_code_val ?? null,
          memberPhone:       r.member_phone ?? null,
          memberNationalId:  r.member_national_id ?? null,
          memberAddress:     r.member_address ?? null,
          paidAmount,
          isOverdue,
          hasMissedPayment,
          missedDays: hasMissedPayment ? 1 : 0,
        }
      })
    },
    [rows, repaymentLoanRefs]
  )

  const paidTodayLoans = useMemo(
    () => loans.filter((l) => repaymentLoanRefs.has(l.loanRef)),
    [loans, repaymentLoanRefs]
  )

  const missedPaymentLoans = useMemo(
    () => loans.filter((l) => l.hasMissedPayment),
    [loans]
  )

  const activeTabLoans = useMemo(() => {
    if (activeTab === "paid_today") return paidTodayLoans
    if (activeTab === "missed") return missedPaymentLoans
    return loans
  }, [activeTab, loans, paidTodayLoans, missedPaymentLoans])

  const stats = useMemo(() => {
    let totalDisbursed = 0
    let outstandingBalance = 0
    let activeLoans = 0
    let pendingLoans = 0
    let settledLoans = 0

    for (const loan of loans) {
      if (DISBURSED_STATUSES.includes(loan.status)) {
        totalDisbursed += loan.amount
      }
      if (OUTSTANDING_STATUSES.includes(loan.status)) {
        outstandingBalance += loan.balance
      }
      if (loan.status === "active") activeLoans++
      if (loan.status === "pending") pendingLoans++
      if (loan.status === "settled") settledLoans++
    }

    return {
      totalDisbursed,
      totalLoans: loans.length,
      activeLoans,
      pendingLoans,
      settledLoans,
      outstandingBalance,
    }
  }, [loans])

  const filteredLoans = useMemo(
    () =>
      activeTabLoans.filter((l) => {
        if (search) {
          const q = search.toLowerCase()
          if (
            !l.loanRef?.toLowerCase().includes(q) &&
            !l.memberName?.toLowerCase().includes(q) &&
            !l.memberCode?.toLowerCase().includes(q)
          ) return false
        }

        if (dateFrom) {
          const d = l.createdAt ? new Date(l.createdAt) : null
          if (d && d < new Date(dateFrom)) return false
        }
        if (dateTo) {
          const d = l.createdAt ? new Date(l.createdAt) : null
          if (d) {
            const end = new Date(dateTo)
            end.setHours(23, 59, 59, 999)
            if (d > end) return false
          }
        }

        if (filterOverdue && !l.isOverdue) return false
        if (filterMissed && !l.hasMissedPayment) return false

        return true
      }),
    [activeTabLoans, search, dateFrom, dateTo, filterOverdue, filterMissed]
  )

  const handleExport = async () => {
    const workbook  = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Loans")

    worksheet.columns = EXPORT_COLUMNS as any

    worksheet.addRows(
      filteredLoans.map((l) => ({
        loan_ref:          l.loanRef,
        member:            l.memberName,
        member_code:       l.memberCode,
        amount:            l.amount            / CENTS_PER_UNIT,
        expected_received: l.expectedReceived  / CENTS_PER_UNIT,
        paid_amount:       l.paidAmount        / CENTS_PER_UNIT,
        balance:           l.balance           / CENTS_PER_UNIT,
        interest_rate:     l.interestRate,
        interest_type:     l.interestType,
        duration_months:   l.durationMonths,
        daily_payment:     l.dailyPayment      / CENTS_PER_UNIT,
        monthly_payment:   l.monthlyPayment    / CENTS_PER_UNIT,
        late_penalty_fee:  l.latePenaltyFee    / CENTS_PER_UNIT,
        status:            l.status,
        overdue:           l.isOverdue ? "Yes" : "No",
        missed_payments:   l.hasMissedPayment ? `${l.missedDays} days` : "None",
        due_date:          l.dueDate ?? "",
        created_at:        l.createdAt
          ? new Date(l.createdAt).toLocaleDateString()
          : "",
      }))
    )

    const buffer = await workbook.xlsx.writeBuffer()
    const blob   = new Blob([buffer], { type: XLSX_MIME_TYPE })
    const url    = window.URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href     = url
    anchor.download = EXPORT_FILENAME
    anchor.click()
    window.URL.revokeObjectURL(url)

    toast.success("Loans exported to Excel")
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading loans...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Loans Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {stats.totalLoans} total loans · {interestRateRows.length} active interest rates
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/loans/interest-rates">
            <Button variant="outline" size="sm">
              <Percent className="mr-2 h-4 w-4" />
              Interest Rates
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <LoanPdfReport
            loans={filteredLoans}
            stats={stats}
            filteredCount={filteredLoans.length}
            totalCount={loans.length}
          />
          <Link href="/loans/new">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Loan
            </Button>
          </Link>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v)}>
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <TabsList>
            <TabsTrigger value="all">
              All Loans ({loans.length})
            </TabsTrigger>
            <TabsTrigger value="paid_today" className="text-green-600 data-[state=active]:bg-green-50 dark:data-[state=active]:bg-green-950/30">
              Paid Today ({paidTodayLoans.length})
            </TabsTrigger>
            <TabsTrigger value="missed" className="text-orange-600 data-[state=active]:bg-orange-50 dark:data-[state=active]:bg-orange-950/30">
              Missed Payment ({missedPaymentLoans.length})
            </TabsTrigger>
          </TabsList>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search ref, member..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(showFilters && "bg-accent")}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>
        </div>
      </Tabs>

      {showFilters && (
        <div className="flex flex-wrap items-end gap-4 rounded-lg border p-4">
          <div className="space-y-1">
            <Label className="text-xs">Date From</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 w-[150px]"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Date To</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9 w-[150px]"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filterOverdue}
              onChange={(e) => setFilterOverdue(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className="text-sm font-medium">Overdue</span>
          </label>
          <Button
            variant={filterMissed ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterMissed(!filterMissed)}
            className={filterMissed ? "bg-orange-600 hover:bg-orange-700" : ""}
          >
            Missed Today
          </Button>
          {(dateFrom || dateTo || filterOverdue || filterMissed) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDateFrom("")
                setDateTo("")
                setFilterOverdue(false)
                setFilterMissed(false)
              }}
            >
              Clear
            </Button>
          )}
        </div>
      )}

      <LoansTable loans={filteredLoans} />
    </div>
  )
}

