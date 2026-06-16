"use client"

import { useState, useMemo, useCallback } from "react"
import { useQuery } from "@powersync/react"
import {
  CheckCircle2, XCircle, AlertTriangle, Ban, Clock,
  Search, Download, FileText, Loader2,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatUGX } from "@/lib/utils/format"
import ExcelJS from "exceljs"
import { pdf, Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer"
import { toast } from "sonner"
import { AnalysisTable } from "./analysis-table"

interface LoanItem {
  id: string; memberId: string; loanRef: string; amount: number; balance: number
  status: string; dueDate: Date | null; disbursedAt: Date | null
  dailyPayment: number; monthlyPayment: number; expectedReceived: number | null
  memberName: string | null; memberCode: string | null
}

interface RepaymentItem {
  id: string; memberId: string; amount: number; referenceId: string | null; createdAt: Date | null
  memberName: string | null; memberCode: string | null
}

const tabs = [
  { id: "paidToday", label: "Paid Today", icon: CheckCircle2, color: "text-emerald-600" },
  { id: "didNotPayToday", label: "Did Not Pay Today", icon: XCircle, color: "text-red-600" },
  { id: "atRisk", label: "At Risk", icon: AlertTriangle, color: "text-orange-600" },
  { id: "defaulted", label: "Defaulted", icon: Ban, color: "text-red-700" },
  { id: "notStarted", label: "Not Started", icon: Clock, color: "text-blue-600" },
]

function categorizeLoans(loans: LoanItem[], repayments: RepaymentItem[], dateStr: string) {
  const today = new Date(dateStr + "T00:00:00")
  const todayEnd = new Date(today)
  todayEnd.setHours(23, 59, 59, 999)

  const repaymentsOnDate = repayments.filter((r) => {
    if (!r.createdAt) return false
    return r.createdAt >= today && r.createdAt <= todayEnd
  })
  const memberIdsOnDate = new Set(repaymentsOnDate.map((r) => r.memberId))

  const lastRepaymentByLoan = new Map<string, Date>()
  for (const r of repayments) {
    if (!r.createdAt) continue
    const loanId = r.referenceId
    if (loanId) {
      if (!lastRepaymentByLoan.has(loanId) || r.createdAt > lastRepaymentByLoan.get(loanId)!) {
        lastRepaymentByLoan.set(loanId, r.createdAt)
      }
    }
  }

  const daysSince = (d: Date) => Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
  const isOverdue = (l: LoanItem) => l.dueDate && l.balance > 0 && new Date(l.dueDate) < today

  const paidToday = loans.filter((l) => memberIdsOnDate.has(l.memberId))
  const notStarted = loans.filter(
    (l) => (l.status === "disbursed" || l.status === "active") && l.balance === l.amount && l.amount > 0
  )
  const didNotPayToday = loans.filter(
    (l) => !memberIdsOnDate.has(l.memberId) && (l.status === "active" || l.status === "disbursed") && l.dailyPayment > 0
  )
  const atRisk = loans.filter((l) => {
    if (l.status !== "active" && l.status !== "disbursed" && l.status !== "extended") return false
    const lastPay = lastRepaymentByLoan.get(l.id)
    if (!lastPay && l.disbursedAt) {
      const d = daysSince(l.disbursedAt)
      return d >= 1 && d < 14
    }
    if (lastPay) {
      const d = daysSince(lastPay)
      return d >= 1 && d < 14
    }
    if (isOverdue(l)) {
      const d = daysSince(l.dueDate!)
      return d >= 1 && d < 14
    }
    if (l.dueDate) {
      const d = daysSince(l.dueDate)
      return d >= -7 && d < 0
    }
    return false
  })
  const defaulted = loans.filter((l) => {
    if (l.status === "defaulted") return true
    const lastPay = lastRepaymentByLoan.get(l.id)
    if (!lastPay && l.disbursedAt) {
      return daysSince(l.disbursedAt) >= 14
    }
    if (lastPay) {
      return daysSince(lastPay) >= 14
    }
    if (isOverdue(l)) {
      return daysSince(l.dueDate!) >= 14
    }
    return false
  })

  const uniq = (arr: LoanItem[]) => {
    const seen = new Set<string>()
    return arr.filter((item) => {
      if (seen.has(item.memberId)) return false
      seen.add(item.memberId)
      return true
    })
  }

  return {
    paidToday: uniq(paidToday),
    didNotPayToday: uniq(didNotPayToday),
    atRisk: uniq(atRisk),
    defaulted: uniq(defaulted),
    notStarted: uniq(notStarted),
    repaymentsOnDate,
  }
}

const pdfStyles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: "Helvetica" },
  header: { marginBottom: 20 },
  title: { fontSize: 18, fontWeight: "bold" },
  subtitle: { fontSize: 10, color: "#666", marginTop: 4 },
  tableHeader: { flexDirection: "row", borderBottom: "2px solid #333", paddingVertical: 6, marginTop: 8 },
  tableHeaderText: { flex: 1, fontWeight: "bold", fontSize: 8 },
  tableRow: { flexDirection: "row", borderBottom: "1px solid #eee", paddingVertical: 4 },
  tableRowAlt: { flexDirection: "row", borderBottom: "1px solid #eee", paddingVertical: 4, backgroundColor: "#f9f9f9" },
  tableCell: { flex: 1, fontSize: 8 },
  footer: { position: "absolute", bottom: 20, left: 30, right: 30, fontSize: 8, color: "#999", textAlign: "center" },
})

export function AnalysisClient({ saccoId }: { saccoId: string }) {
  const [activeTab, setActiveTab] = useState("paidToday")
  const [search, setSearch] = useState("")
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0])
  const [pdfLoading, setPdfLoading] = useState(false)

  const { data: loanRows = [] } = useQuery(
    `SELECT * FROM loans WHERE sacco_id = ? ORDER BY created_at DESC`,
    [saccoId]
  )

  const { data: repaymentRows = [] } = useQuery(
    `SELECT * FROM transactions WHERE sacco_id = ? AND type = 'loan_repayment' ORDER BY created_at DESC`,
    [saccoId]
  )

  const loans = useMemo(() => (loanRows as any[]).map((r) => ({
    id: r.id, memberId: r.member_id, loanRef: r.loan_ref ?? r.id.slice(0, 8),
    amount: Number(r.amount), balance: Number(r.balance ?? r.amount),
    status: r.status, dueDate: r.due_date ? new Date(r.due_date) : null,
    disbursedAt: r.disbursed_at ? new Date(r.disbursed_at) : null,
    dailyPayment: Number(r.daily_payment ?? 0),
    monthlyPayment: Number(r.monthly_payment ?? 0),
    expectedReceived: r.expected_received ? Number(r.expected_received) : null,
    memberName: r.member_name ?? null, memberCode: r.member_code ?? null,
  })), [loanRows])

  const allRepayments = useMemo(() => (repaymentRows as any[]).map((r) => ({
    id: r.id, memberId: r.member_id, amount: Number(r.amount),
    referenceId: r.reference_id ?? null,
    createdAt: r.created_at ? new Date(r.created_at) : null,
    memberName: r.member_name ?? null, memberCode: r.member_code ?? null,
  })), [repaymentRows])

  const categorized = useMemo(
    () => categorizeLoans(loans, allRepayments, dateFilter),
    [loans, allRepayments, dateFilter]
  )

  const activeData = useMemo(() => {
    const items = categorized[activeTab as keyof typeof categorized] ?? []
    if (Array.isArray(items) && !search) return items as LoanItem[]
    if (!Array.isArray(items)) return []
    if (!search) return items as LoanItem[]
    return (items as LoanItem[]).filter(
      (i) =>
        (i.memberName ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (i.memberCode ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (i.loanRef ?? "").toLowerCase().includes(search.toLowerCase())
    )
  }, [categorized, activeTab, search])

  const summaryCards = tabs.map((tab) => {
    const items = categorized[tab.id as keyof typeof categorized] as LoanItem[] | undefined
    const list = items ?? []
    const totalBalance = list.reduce((s: number, i: LoanItem) => s + i.balance, 0)
    return { ...tab, count: list.length, totalBalance }
  })

  const summaryTotal = summaryCards.reduce((sum, c) => sum + c.count, 0)
  const tabLabel = tabs.find((t) => t.id === activeTab)?.label ?? ""

  const handleExcelExport = async () => {
    const items = activeData
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet(tabLabel)
    sheet.columns = [
      { header: "Member", key: "member", width: 25 },
      { header: "Code", key: "code", width: 15 },
      { header: "Loan Ref", key: "ref", width: 15 },
      { header: "Amount", key: "amount", width: 18 },
      { header: "Balance", key: "balance", width: 18 },
      { header: "Status", key: "status", width: 15 },
      { header: "Due Date", key: "due", width: 15 },
    ]
    sheet.addRows(
      items.map((i) => ({
        member: i.memberName ?? "-",
        code: i.memberCode ?? "-",
        ref: i.loanRef,
        amount: formatUGX(i.amount),
        balance: formatUGX(i.balance),
        status: i.status,
        due: i.dueDate ? i.dueDate.toISOString().split("T")[0] : "-",
      }))
    )
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = `lendwell-analysis-${tabLabel.toLowerCase().replace(/\s+/g, "-")}-${dateFilter}.xlsx`
    a.click(); window.URL.revokeObjectURL(url)
    toast.success(`${tabLabel} exported to Excel`)
  }

  const handlePdfExport = useCallback(async () => {
    setPdfLoading(true)
    try {
      const items = activeData
      const totalBalance = items.reduce((s, i) => s + i.balance, 0)

      const blob = await pdf(
        <Document>
          <Page size="A4" style={pdfStyles.page}>
            <View style={pdfStyles.header}>
              <Text style={pdfStyles.title}>{tabLabel} — Loan Analysis</Text>
              <Text style={pdfStyles.subtitle}>
                {dateFilter} · {items.length} loans · Total Balance {formatUGX(totalBalance)}
              </Text>
            </View>

            <View style={pdfStyles.tableHeader}>
              <Text style={pdfStyles.tableHeaderText}>Member</Text>
              <Text style={pdfStyles.tableHeaderText}>Code</Text>
              <Text style={pdfStyles.tableHeaderText}>Ref</Text>
              <Text style={pdfStyles.tableHeaderText}>Amount</Text>
              <Text style={pdfStyles.tableHeaderText}>Balance</Text>
              <Text style={pdfStyles.tableHeaderText}>Status</Text>
              <Text style={pdfStyles.tableHeaderText}>Due</Text>
            </View>
            {items.map((i, idx) => (
              <View key={i.id} style={idx % 2 === 0 ? pdfStyles.tableRow : pdfStyles.tableRowAlt}>
                <Text style={pdfStyles.tableCell}>{i.memberName ?? "—"}</Text>
                <Text style={pdfStyles.tableCell}>{i.memberCode ?? "—"}</Text>
                <Text style={pdfStyles.tableCell}>{i.loanRef}</Text>
                <Text style={pdfStyles.tableCell}>{formatUGX(i.amount)}</Text>
                <Text style={pdfStyles.tableCell}>{formatUGX(i.balance)}</Text>
                <Text style={pdfStyles.tableCell}>{i.status}</Text>
                <Text style={pdfStyles.tableCell}>{i.dueDate ? i.dueDate.toISOString().split("T")[0] : "—"}</Text>
              </View>
            ))}

            <Text style={pdfStyles.footer}>Generated by Lendwell SACCO Management</Text>
          </Page>
        </Document>
      ).toBlob()

      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `lendwell-analysis-${tabLabel.toLowerCase().replace(/\s+/g, "-")}-${dateFilter}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`${tabLabel} exported to PDF`)
    } catch {
      toast.error("Failed to generate PDF")
    } finally {
      setPdfLoading(false)
    }
  }, [activeData, tabLabel, dateFilter])

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Loan Analysis</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Loan performance for <span className="font-medium">{dateFilter}</span> — {summaryTotal} total cases
          </p>
        </div>
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => { setDateFilter(e.target.value); setSearch("") }}
          className="w-44"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {summaryCards.map((card) => {
          const isActive = activeTab === card.id
          return (
            <button
              key={card.id}
              onClick={() => setActiveTab(card.id)}
              className={cn(
                "group relative overflow-hidden rounded-lg border bg-card p-4 text-left shadow-sm transition-all hover:shadow-md",
                isActive && "ring-2 ring-primary"
              )}
            >
              <div className="flex items-center justify-between">
                <card.icon className={cn("h-5 w-5", card.color)} />
                <span className="text-2xl font-bold tabular-nums">{card.count}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{card.label}</p>
              <p className="mt-0.5 text-xs font-semibold tabular-nums text-foreground">
                {formatUGX(card.totalBalance)}
              </p>
            </button>
          )
        })}
      </div>

      <div className="rounded-lg border">
        <div className="border-b">
          <nav className="-mb-px flex gap-0 overflow-x-auto">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id
              const count = (categorized[tab.id as keyof typeof categorized] as any[])?.length ?? 0
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors",
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                  )}
                >
                  <tab.icon className={cn("h-4 w-4", tab.color)} />
                  {tab.label}
                  <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums">{count}</span>
                </button>
              )
            })}
          </nav>
        </div>

        <div className="p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-72">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search member, code or loan ref..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <p className="shrink-0 text-sm text-muted-foreground">{activeData.length} results</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExcelExport}>
                <Download className="mr-2 h-4 w-4" /> Excel
              </Button>
              <Button variant="outline" size="sm" onClick={handlePdfExport} disabled={pdfLoading}>
                {pdfLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="mr-2 h-4 w-4" />
                )}
                PDF
              </Button>
            </div>
          </div>

          <AnalysisTable items={activeData} label={tabLabel} />
        </div>
      </div>
    </div>
  )
}
