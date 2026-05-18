// app/(dashboard)/loans/components/loans-client.tsx
"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  Banknote,
  Clock,
  CheckCircle,
  TrendingUp,
  Search,
  SlidersHorizontal,
  Plus,
  Download,
  Percent,
  HandCoins,
} from "lucide-react"
import { formatUGX } from "@/lib/utils/format"
import { LoansTable } from "./loans-table"
import { DonutChart } from "@/app/(dashboard)/components/donut-chart"
import ExcelJS from "exceljs"
import { toast } from "sonner"
import Link from "next/link"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts"

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

const statusColors: Record<string, string> = {
  pending: "#f59e0b",
  approved: "#3b82f6",
  disbursed: "#8b5cf6",
  active: "#10b981",
  settled: "#6b7280",
  declined: "#ef4444",
  defaulted: "#dc2626",
  extended: "#f97316",
  verified: "#06b6d4",
}

// Consistent color palette matching dashboard line graph
const CHART_COLORS = {
  amount: "#6366f1", // indigo - matching loans color
  balance: "#10b981", // emerald - matching savings color
}

const chartConfig: ChartConfig = {
  amount: { label: "Amount", color: CHART_COLORS.amount },
  balance: { label: "Balance", color: CHART_COLORS.balance },
}

export function LoansClient({
  loans,
  members,
  stats,
  interestRates,
}: LoansClientProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filtered = useMemo(() => {
    return loans.filter((l) => {
      const matchSearch =
        l.loanRef?.toLowerCase().includes(search.toLowerCase()) ||
        l.memberName?.toLowerCase().includes(search.toLowerCase()) ||
        l.memberCode?.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === "all" || l.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [loans, search, statusFilter])

  // Chart data — loans by status
  const statusChartData = useMemo(() => {
    if (!loans) return []
    const grouped: Record<string, number> = {}
    loans.forEach((l) => {
      grouped[l.status] = (grouped[l.status] || 0) + 1
    })
    return Object.entries(grouped).map(([status, count]) => ({
      label: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      color: statusColors[status] ?? "#6b7280",
    }))
  }, [loans])

  // Chart data — monthly disbursements (last 6 months)
  const monthlyData = useMemo(() => {
    if (!loans) return []
    const months: Record<string, { amount: number; balance: number }> = {}
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now)
      d.setMonth(d.getMonth() - i)
      const key = d.toLocaleString("default", { month: "short" })
      months[key] = { amount: 0, balance: 0 }
    }
    loans.forEach((l) => {
      if (!l.createdAt) return
      const d = new Date(l.createdAt)
      const key = d.toLocaleString("default", { month: "short" })
      if (months[key]) {
        months[key].amount += l.amount / 100
        months[key].balance += l.balance / 100
      }
    })
    return Object.entries(months).map(([month, v]) => ({
      month,
      amount: v.amount,
      balance: v.balance,
    }))
  }, [loans])

  const handleExport = async () => {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Loans")

    worksheet.columns = [
      { header: "Loan Ref", key: "loan_ref", width: 15 },
      { header: "Member", key: "member", width: 25 },
      { header: "Member Code", key: "member_code", width: 15 },
      { header: "Amount (UGX)", key: "amount", width: 15 },
      {
        header: "Expected Received (UGX)",
        key: "expected_received",
        width: 20,
      },
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

    const data = filtered.map((l) => ({
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
      created_at: l.createdAt
        ? new Date(l.createdAt).toLocaleDateString()
        : "",
    }))

    worksheet.addRows(data)

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "sacco-loans.xlsx"
    a.click()
    window.URL.revokeObjectURL(url)

    toast.success("Loans exported to Excel")
  }

  return (
    <div className="min-w-0 space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Loans Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {stats.totalLoans} total loans · {interestRates.length} active
            interest rates
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/loans/interest-rates">
            <Button variant="outline" size="lg" className="whitespace-nowrap">
              <Percent className="mr-2 h-4 w-4" />
              Interest Rates
            </Button>
          </Link>
          <Button
            variant="outline"
            size="lg"
            onClick={handleExport}
            className="whitespace-nowrap"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Link href="/loans/new">
            <Button size="lg" className="whitespace-nowrap">
              <Plus className="mr-2 h-4 w-4" />
              New Loan
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            title: "Total Disbursed",
            value: formatUGX(stats.totalDisbursed),
            description: "Total loan amount",
            icon: Banknote,
            accentColor: "#10b981",
          },
          {
            title: "Outstanding",
            value: formatUGX(stats.outstandingBalance),
            description: "Remaining balance",
            icon: TrendingUp,
            accentColor: "#f97316",
          },
          {
            title: "Active Loans",
            value: stats.activeLoans,
            description: "Currently active",
            icon: CheckCircle,
            accentColor: "#3b82f6",
          },
          {
            title: "Pending",
            value: stats.pendingLoans,
            description: "Awaiting approval",
            icon: Clock,
            accentColor: "#eab308",
          },
          {
            title: "Settled",
            value: stats.settledLoans,
            description: "Fully paid",
            icon: CheckCircle,
            accentColor: "#6b7280",
          },
          {
            title: "Total Loans",
            value: stats.totalLoans,
            description: "All time loans",
            icon: Banknote,
            accentColor: "#a855f7",
          },
        ].map((card, i) => (
          <div
            key={card.title}
            className="group relative overflow-hidden rounded border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-md"
          >
            {/* Left accent bar */}

            {/* Subtle tinted background on hover */}
            <div
              className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{
                background: `radial-gradient(ellipse at top left, ${card.accentColor}08, transparent 70%)`,
              }}
            />

            <div className="relative px-5 pt-4 pb-4">
              {/* Top row: title + icon */}
              <div className="mb-3 flex items-start justify-between">
                <p className="text-xs leading-none font-semibold tracking-widest text-muted-foreground uppercase">
                  {card.title}
                </p>
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: `${card.accentColor}18` }}
                >
                  <card.icon
                    className="h-4 w-4"
                    style={{ color: card.accentColor }}
                  />
                </div>
              </div>

              {/* Value */}
              <p className="mb-3 text-[1.6rem] leading-none font-bold tracking-tight text-foreground tabular-nums">
                {card.value}
              </p>

              {/* Description */}
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </div>

            {/* Bottom accent line */}
            <div
              className="absolute right-3 bottom-0 left-3 h-px opacity-20"
              style={{
                background: `linear-gradient(to right, transparent, ${card.accentColor}, transparent)`,
              }}
            />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Monthly Disbursements</CardTitle>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <ChartContainer
              config={chartConfig}
              className="h-[220px] w-full min-w-0"
            >
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  className="text-xs"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  className="text-xs"
                  tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(v) => `UGX ${Number(v).toLocaleString()}`}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="amount"
                  fill={CHART_COLORS.amount}
                  radius={4}
                  name="Amount"
                />
                <Bar
                  dataKey="balance"
                  fill={CHART_COLORS.balance}
                  radius={4}
                  name="Balance"
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <DonutChart
          data={statusChartData}
          totalLabel="Loans"
          title="Loans by Status"
          subtitle="Breakdown by current status"
          icon={<HandCoins className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="relative w-full">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search ref, member..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value || "all")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="disbursed">Disbursed</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="settled">Settled</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
              <SelectItem value="defaulted">Defaulted</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <LoansTable loans={filtered} />
    </div>
  )
}
