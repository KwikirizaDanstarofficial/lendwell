"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Download, Percent } from "lucide-react"
import { LoansTable } from "./loans-table"
import ExcelJS from "exceljs"
import { toast } from "sonner"
import Link from "next/link"

interface LoansClientProps {
  loans: any[]
  members: any[]
  stats: {
    totalDisbursed: number
    totalLoans: number
    activeLoans: number
    pendingLoans: number
    settledLoans: number
    outstandingBalance: number
  }
  interestRates: any[]
}

export function LoansClient({ loans, members, stats, interestRates }: LoansClientProps) {
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    return loans.filter((l) =>
      l.loanRef?.toLowerCase().includes(search.toLowerCase()) ||
      l.memberName?.toLowerCase().includes(search.toLowerCase()) ||
      l.memberCode?.toLowerCase().includes(search.toLowerCase())
    )
  }, [loans, search])

  const handleExport = async () => {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Loans")
    worksheet.columns = [
      { header: "Loan Ref", key: "loan_ref", width: 15 },
      { header: "Member", key: "member", width: 25 },
      { header: "Member Code", key: "member_code", width: 15 },
      { header: "Amount (UGX)", key: "amount", width: 15 },
      { header: "Expected Received (UGX)", key: "expected_received", width: 20 },
      { header: "Balance (UGX)", key: "balance", width: 15 },
      { header: "Interest Rate", key: "interest_rate", width: 15 },
      { header: "Interest Type", key: "interest_type", width: 15 },
      { header: "Duration (Months)", key: "duration_months", width: 18 },
      { header: "Daily Payment", key: "daily_payment", width: 15 },
      { header: "Monthly Payment", key: "monthly_payment", width: 17 },
      { header: "Late Penalty Fee", key: "late_penalty_fee", width: 18 },
      { header: "Status", key: "status", width: 10 },
      { header: "Due Date", key: "due_date", width: 15 },
      { header: "Created At", key: "created_at", width: 15 },
    ]
    worksheet.addRows(
      filtered.map((l) => ({
        loan_ref: l.loanRef,
        member: l.memberName,
        member_code: l.memberCode,
        amount: l.amount / 100,
        expected_received: l.expectedReceived / 100,
        balance: l.balance / 100,
        interest_rate: l.interestRate,
        interest_type: l.interestType,
        duration_months: l.durationMonths,
        daily_payment: l.dailyPayment / 100,
        monthly_payment: l.monthlyPayment / 100,
        late_penalty_fee: l.latePenaltyFee / 100,
        status: l.status,
        due_date: l.dueDate ?? "",
        created_at: l.createdAt ? new Date(l.createdAt).toLocaleDateString() : "",
      }))
    )
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "sacco-loans.xlsx"
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success("Loans exported to Excel")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Toolbar */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <p className="shrink-0 text-sm text-muted-foreground">
          {filtered.length} of {loans.length} loans
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

      <LoansTable loans={filtered} />
    </div>
  )
}
