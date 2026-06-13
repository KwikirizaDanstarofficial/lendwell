"use client"

import { useState, useMemo, useCallback } from "react"
import { useQuery, usePowerSync } from "@powersync/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Download, Percent, RefreshCw, CloudUpload, Loader2 } from "lucide-react"
import { LoansTable } from "./loans-table"
import { useSyncNow } from "@/lib/powersync/provider"
import ExcelJS from "exceljs"
import { toast } from "sonner"
import Link from "next/link"

const CENTS_PER_UNIT = 100
const EXPORT_FILENAME = "sacco-loans.xlsx"
const XLSX_MIME_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

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

const DISBURSED_STATUSES = ["disbursed", "active", "settled"]
const OUTSTANDING_STATUSES = ["disbursed", "active"]

interface LoansClientProps {
  saccoId: string
}

export function LoansClient({ saccoId }: LoansClientProps) {
  const db = usePowerSync()
  const { syncNow } = useSyncNow()
  const [syncing, setSyncing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState("")

  const handleFetch = useCallback(async () => {
    setSyncing(true)
    try {
      await syncNow()
      toast.success("Loan data synced from server")
    } catch {
      toast.error("Sync failed")
    }
    setSyncing(false)
  }, [syncNow])

  const handleUpload = useCallback(async () => {
    setUploading(true)
    let count = 0
    try {
      while (true) {
        const tx = await db.getNextCrudTransaction()
        if (!tx) break
        const ops = tx.crud.map(({ table, opData, op, id }) => ({
          op: op === "PUT" ? "PUT" as const : op === "PATCH" ? "PATCH" as const : "DELETE" as const,
          table, id, opData,
        }))
        const res = await fetch("/api/powersync/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ops }),
        })
        if (!res.ok) throw new Error((await res.json()).error ?? "Upload failed")
        await tx.complete()
        count += ops.length
      }
      toast.success(count > 0 ? `${count} changes uploaded` : "No pending changes")
    } catch (err: any) {
      toast.error(err?.message ?? "Upload failed")
    }
    setUploading(false)
  }, [db])

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

  const loans = useMemo(
    () => (rows as any[]).map((r) => ({
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
    })),
    [rows]
  )

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
      loans.filter(
        (l) =>
          l.loanRef?.toLowerCase().includes(search.toLowerCase()) ||
          l.memberName?.toLowerCase().includes(search.toLowerCase()) ||
          l.memberCode?.toLowerCase().includes(search.toLowerCase())
      ),
    [loans, search]
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
          <Button variant="outline" size="sm" onClick={handleFetch} disabled={syncing}>
            {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Fetch
          </Button>
          <Button variant="outline" size="sm" onClick={handleUpload} disabled={uploading}>
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CloudUpload className="mr-2 h-4 w-4" />}
            Upload
          </Button>
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

