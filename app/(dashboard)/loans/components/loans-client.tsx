// app/(dashboard)/loans/components/loans-client.tsx
// Top-level client shell for the Loans Management page.
// Manages search filtering and Excel export of the loans list.
"use client"

import { useState, useMemo } from "react"
import { useQuery } from "@powersync/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Download, Percent } from "lucide-react"
import { LoansTable } from "./loans-table"
import ExcelJS from "exceljs"
import { toast } from "sonner"
import Link from "next/link"

// ─── Constants ────────────────────────────────────────────────────────────────

/** Divisor to convert stored cent amounts to UGX major units for the export. */
const CENTS_PER_UNIT = 100

/** Filename for the exported Excel file. */
const EXPORT_FILENAME = "sacco-loans.xlsx"

/** MIME type for .xlsx blobs. */
const XLSX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

/** Column definitions for the Excel export. */
const EXPORT_COLUMNS = [
  { header: "Loan Ref",                key: "loan_ref",           width: 15 },
  { header: "Member",                  key: "member",             width: 25 },
  { header: "Member Code",             key: "member_code",        width: 15 },
  { header: "Amount (UGX)",            key: "amount",             width: 15 },
  { header: "Expected Received (UGX)", key: "expected_received",  width: 20 },
  { header: "Balance (UGX)",           key: "balance",            width: 15 },
  { header: "Interest Rate",           key: "interest_rate",      width: 15 },
  { header: "Interest Type",           key: "interest_type",      width: 15 },
  { header: "Duration (Months)",       key: "duration_months",    width: 18 },
  { header: "Daily Payment",           key: "daily_payment",      width: 15 },
  { header: "Monthly Payment",         key: "monthly_payment",    width: 17 },
  { header: "Late Penalty Fee",        key: "late_penalty_fee",   width: 18 },
  { header: "Status",                  key: "status",             width: 10 },
  { header: "Due Date",                key: "due_date",           width: 15 },
  { header: "Created At",              key: "created_at",         width: 15 },
] as const

// ─── Types ────────────────────────────────────────────────────────────────────

interface LoansClientProps {
  saccoId: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LoansClient({ saccoId }: LoansClientProps) {
  const [search, setSearch] = useState("")

  const { data: rows = [] } = useQuery(
    `SELECT l.id, l.sacco_id, l.member_id, l.loan_ref, l.amount, l.balance,
            l.interest_rate, l.interest_type, l.duration_months,
            l.daily_payment, l.monthly_payment, l.late_penalty_fee,
            l.status, l.due_date, l.disbursed_at, l.settled_at, l.created_at,
            l.expected_received, l.notes, l.category_id,
            m.full_name AS member_name, m.member_code, m.phone AS member_phone
     FROM loans l
     LEFT JOIN members m ON m.id = l.member_id
     WHERE l.sacco_id = ?
     ORDER BY l.created_at DESC`,
    [saccoId]
  )

  const { data: rateRows = [] } = useQuery(
    "SELECT id, min_amount, max_amount, rate, rate_type FROM interest_rates WHERE sacco_id = ? AND is_active = 1 ORDER BY min_amount ASC",
    [saccoId]
  )

  const loans = useMemo(() => (rows as any[]).map((r) => ({
    id:               r.id,
    saccoId:          r.sacco_id,
    memberId:         r.member_id,
    loanRef:          r.loan_ref,
    amount:           Number(r.amount),
    balance:          Number(r.balance),
    interestRate:     r.interest_rate,
    interestType:     r.interest_type,
    durationMonths:   r.duration_months,
    dailyPayment:     Number(r.daily_payment ?? 0),
    monthlyPayment:   Number(r.monthly_payment ?? 0),
    latePenaltyFee:   Number(r.late_penalty_fee ?? 0),
    status:           r.status,
    dueDate:          r.due_date ? new Date(r.due_date) : null,
    disbursedAt:      r.disbursed_at ? new Date(r.disbursed_at) : null,
    settledAt:        r.settled_at ? new Date(r.settled_at) : null,
    createdAt:        r.created_at ? new Date(r.created_at) : null,
    expectedReceived: Number(r.expected_received ?? 0),
    notes:            r.notes ?? null,
    categoryId:       r.category_id ?? null,
    memberName:       r.member_name ?? "",
    memberCode:       r.member_code ?? "",
    memberPhone:      r.member_phone ?? null,
  })), [rows])

  const interestRates = useMemo(() => (rateRows as any[]).map((r) => ({
    id: r.id, minAmount: Number(r.min_amount), maxAmount: Number(r.max_amount),
    rate: r.rate, rateType: r.rate_type,
  })), [rateRows])

  const stats = useMemo(() => {
    let totalDisbursed = 0, outstandingBalance = 0, activeLoans = 0, pendingLoans = 0, settledLoans = 0
    for (const l of loans) {
      if (["disbursed","active","settled"].includes(l.status)) totalDisbursed += l.amount
      if (["disbursed","active"].includes(l.status))           outstandingBalance += l.balance
      if (l.status === "active")  activeLoans++
      if (l.status === "pending") pendingLoans++
      if (l.status === "settled") settledLoans++
    }
    return { totalDisbursed, totalLoans: loans.length, activeLoans, pendingLoans, settledLoans, outstandingBalance }
  }, [loans])

  // Filter loans by ref, member name, or member code
  const filteredLoans = useMemo(
    () =>
      loans.filter(
        (l) =>
          l.loanRef?.toLowerCase().includes(search.toLowerCase())    ||
          l.memberName?.toLowerCase().includes(search.toLowerCase()) ||
          l.memberCode?.toLowerCase().includes(search.toLowerCase())
      ),
    [loans, search]
  )

  /** Export the currently filtered loans to an Excel file. */
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
        balance:           l.balance           / CENTS_PER_UNIT,
        interest_rate:     l.interestRate,
        interest_type:     l.interestType,
        duration_months:   l.durationMonths,
        daily_payment:     l.dailyPayment      / CENTS_PER_UNIT,
        monthly_payment:   l.monthlyPayment    / CENTS_PER_UNIT,
        late_penalty_fee:  l.latePenaltyFee    / CENTS_PER_UNIT,
        status:            l.status,
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

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Loans Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {stats.totalLoans} total loans · {interestRates.length} active interest rates
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
            Export
          </Button>
          <Link href="/loans/new">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Loan
            </Button>
          </Link>
        </div>
      </div>

      {/* Toolbar: result count + search */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <p className="shrink-0 text-sm text-muted-foreground">
          {filteredLoans.length} of {loans.length} loans
        </p>
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
        </div>
      </div>

      <LoansTable loans={filteredLoans} />
    </div>
  )
}

// ─── Appendix ─────────────────────────────────────────────────────────────────
//
// EXPORTED COMPONENTS:
//   LoansClient({ loans, members, stats, interestRates })
//     – client shell for the /loans page
//     – handles search filtering and Excel export
//
// KEY CONSTANTS:
//   CENTS_PER_UNIT   = 100   (divide stored amounts before writing to Excel)
//   EXPORT_FILENAME  = "sacco-loans.xlsx"
//   EXPORT_COLUMNS   – column definitions for the Excel export
//
// RELATED COMPONENTS:
//   LoansTable  – renders the filtered loans list
