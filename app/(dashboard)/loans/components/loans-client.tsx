// app/(dashboard)/loans/components/loans-client.tsx
// Top-level client shell for the Loans Management page.
// Manages search filtering and Excel export of the loans list.
"use client"

import { useState, useMemo } from "react"
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
  loans:         any[]
  members:       any[]
  stats: {
    totalDisbursed:    number
    totalLoans:        number
    activeLoans:       number
    pendingLoans:      number
    settledLoans:      number
    outstandingBalance: number
  }
  interestRates: any[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LoansClient({ loans, members, stats, interestRates }: LoansClientProps) {
  const [search, setSearch] = useState("")

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
