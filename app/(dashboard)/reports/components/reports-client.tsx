"use client"

import { useState, useMemo } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts"
import {
  Users,
  Banknote,
  PiggyBank,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Download,
  Search,
  FileText,
  ArrowUpRight,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Bell,
  DollarSign,
  CreditCard,
  LayoutDashboard,
  HandCoins,
  Wallet,
  Flag,
  Receipt,
  LifeBuoy,
  Megaphone,
  Settings,
} from "lucide-react"
import { formatUGX, formatDate } from "@/lib/utils/format"
import { ReportPdfButton } from "./report-pdf"
import { DonutChart } from "@/app/(dashboard)/components/donut-chart"
import ExcelJS from "exceljs"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ReportsClientProps {
  stats: {
    totalLoansAmount: number
    totalExpectedAmount: number
    totalLoansCount: number
    activeLoansAmount: number
    activeLoansCount: number
    disbursedLoansAmount: number
    disbursedLoansCount: number
    approvedLoansCount: number
    pendingLoansCount: number
    settledLoansCount: number
    defaultedLoansCount: number
    totalSavings: number
    savingsCount: number
    fixedSavingsAmount: number
    fixedSavingsCount: number
    lockedSavingsCount: number
    totalMembers: number
    activeMembers: number
    suspendedMembers: number
    exitedMembers: number
    totalFines: number
    finesCount: number
    pendingFinesAmount: number
    pendingFinesCount: number
    paidFinesAmount: number
    paidFinesCount: number
    waivedFinesAmount: number
    waivedFinesCount: number
    totalDeposits: number
    totalWithdrawals: number
    totalRepayments: number
    totalComplaints: number
    openComplaints: number
    resolvedComplaints: number
    totalNotifications: number
    sentNotifications: number
    failedNotifications: number
  }
  sacco: any
  loans: any[]
  savings: any[]
  members: any[]
  fines: any[]
  transactions: any[]
  complaints: any[]
  notifications: any[]
  interestRates: any[]
  loanCategories: any[]
  savingsCategories: any[]
  fineCategories: any[]
}

const loanStatusColors: Record<string, string> = {
  pending: "#f59e0b",
  verified: "#06b6d4",
  approved: "#3b82f6",
  disbursed: "#8b5cf6",
  active: "#10b981",
  extended: "#f97316",
  settled: "#6b7280",
  declined: "#ef4444",
  defaulted: "#dc2626",
}

const fineStatusColors: Record<string, string> = {
  pending: "#f59e0b",
  paid: "#10b981",
  waived: "#6b7280",
}

const complaintStatusColors: Record<string, string> = {
  open: "#f59e0b",
  in_progress: "#3b82f6",
  resolved: "#10b981",
}

const notificationStatusColors: Record<string, string> = {
  pending: "#f59e0b",
  sent: "#10b981",
  failed: "#ef4444",
}

// Consistent color palette matching dashboard line graph
const CHART_COLORS = {
  amount: "#10b981", // emerald - matching savings color
  balance: "#6366f1", // indigo - matching loans color
  count: "#3b82f6", // blue - additional accent
}

const chartConfig: ChartConfig = {
  amount: { label: "Amount", color: CHART_COLORS.amount },
  balance: { label: "Balance", color: CHART_COLORS.balance },
  count: { label: "Count", color: CHART_COLORS.count },
}

// Tab configuration with icons
const tabs = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    color: "text-blue-500",
  },
  { id: "loans", label: "Loans", icon: HandCoins, color: "text-purple-500" },
  { id: "savings", label: "Savings", icon: PiggyBank, color: "text-green-500" },
  { id: "members", label: "Members", icon: Users, color: "text-cyan-500" },
  { id: "fines", label: "Fines", icon: AlertCircle, color: "text-red-500" },
  {
    id: "transactions",
    label: "Transactions",
    icon: Receipt,
    color: "text-orange-500",
  },
  {
    id: "complaints",
    label: "Complaints",
    icon: MessageSquare,
    color: "text-yellow-500",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    color: "text-indigo-500",
  },
  {
    id: "settings",
    label: "System Config",
    icon: Settings,
    color: "text-gray-500",
  },
]

export function ReportsClient({
  stats,
  sacco,
  loans,
  savings,
  members,
  fines,
  transactions,
  complaints,
  notifications,
}: ReportsClientProps) {
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState("overview")
  const [dateFrom, setDateFrom] = useState<Date>()
  const [dateTo, setDateTo] = useState<Date>()

  // Date filtering function
  const isInDateRange = (date: Date | string | null) => {
    if (!date) return true
    const itemDate = new Date(date)
    if (dateFrom && itemDate < dateFrom) return false
    if (dateTo) {
      const endOfDay = new Date(dateTo)
      endOfDay.setHours(23, 59, 59, 999)
      if (itemDate > endOfDay) return false
    }
    return true
  }

  // Filter data based on date range
  const filteredLoans = useMemo(() => {
    return loans.filter((loan) => isInDateRange(loan.createdAt))
  }, [loans, dateFrom, dateTo])

  const filteredSavings = useMemo(() => {
    return savings.filter((saving) => isInDateRange(saving.createdAt))
  }, [savings, dateFrom, dateTo])

  const filteredMembers = useMemo(() => {
    return members.filter((member) => isInDateRange(member.createdAt))
  }, [members, dateFrom, dateTo])

  const filteredFines = useMemo(() => {
    return fines.filter((fine) => isInDateRange(fine.createdAt))
  }, [fines, dateFrom, dateTo])

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) =>
      isInDateRange(transaction.createdAt)
    )
  }, [transactions, dateFrom, dateTo])

  const filteredComplaints = useMemo(() => {
    return complaints.filter((complaint) => isInDateRange(complaint.createdAt))
  }, [complaints, dateFrom, dateTo])

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) =>
      isInDateRange(notification.createdAt)
    )
  }, [notifications, dateFrom, dateTo])

  // Monthly loans chart data
  const monthlyLoansData = useMemo(() => {
    if (!filteredLoans) return []
    const months: Record<string, { amount: number; count: number }> = {}
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now)
      d.setMonth(d.getMonth() - i)
      const key = d.toLocaleString("default", { month: "short" })
      months[key] = { amount: 0, count: 0 }
    }
    filteredLoans.forEach((l) => {
      if (!l.createdAt) return
      const key = new Date(l.createdAt).toLocaleString("default", {
        month: "short",
      })
      if (months[key]) {
        months[key].amount += l.amount / 100
        months[key].count += 1
      }
    })
    return Object.entries(months || {}).map(([month, v]) => ({ month, ...v }))
  }, [filteredLoans])

  // Monthly savings chart data
  const monthlySavingsData = useMemo(() => {
    if (!filteredSavings) return []
    const months: Record<string, number> = {}
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now)
      d.setMonth(d.getMonth() - i)
      months[d.toLocaleString("default", { month: "short" })] = 0
    }
    filteredSavings.forEach((s) => {
      if (!s.createdAt) return
      const key = new Date(s.createdAt).toLocaleString("default", {
        month: "short",
      })
      if (months[key] !== undefined) months[key] += s.balance / 100
    })
    return Object.entries(months || {}).map(([month, balance]) => ({
      month,
      balance,
    }))
  }, [filteredSavings])

  // Members growth
  const memberGrowthData = useMemo(() => {
    if (!members) return []
    const months: Record<string, number> = {}
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now)
      d.setMonth(d.getMonth() - i)
      months[d.toLocaleString("default", { month: "short" })] = 0
    }
    members.forEach((m) => {
      if (!m.joinedAt) return
      const key = new Date(m.joinedAt).toLocaleString("default", {
        month: "short",
      })
      if (months[key] !== undefined) months[key] += 1
    })
    return Object.entries(months || {}).map(([month, count]) => ({
      month,
      count,
    }))
  }, [members])

  // Loan status pie
  const loanStatusData = useMemo(() => {
    if (!loans) return []
    const grouped: Record<string, number> = {}
    loans.forEach((l) => {
      grouped[l.status] = (grouped[l.status] || 0) + 1
    })
    return Object.entries(grouped).map(([status, count]) => ({
      label: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      color: loanStatusColors[status] ?? "#6b7280",
    }))
  }, [loans])

  // Top savers
  const topSavers = useMemo(() => {
    return [...filteredSavings]
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 10)
  }, [filteredSavings])

  const handleExcelExport = async (
    type: string,
    data: any[],
    columns: Record<string, string>
  ) => {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet(type)

    const columnHeaders = Object.values(columns)
    worksheet.columns = columnHeaders.map((header) => ({ header, width: 15 }))

    const formatted = data.map((item) => {
      const row: any[] = []
      Object.keys(columns).forEach((key) => {
        let value = item[key]
        if (
          key.includes("amount") ||
          key.includes("balance") ||
          key.includes("payment")
        ) {
          value = value ? formatUGX(value) : "—"
        } else if (key.includes("date") || key.includes("_at")) {
          value = value ? formatDate(value) : "—"
        }
        row.push(value ?? "—")
      })
      return row
    })

    worksheet.addRows(formatted)

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `sacco-${type}-report.xlsx`
    a.click()
    window.URL.revokeObjectURL(url)

    toast.success(`${type} report exported to Excel`)
  }

  const profitBalance = stats.totalRepayments

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Reports & Analytics
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Comprehensive financial and operational reports
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row">
          {/* Date Filters */}
          <div className="flex gap-2">
            <Input
              type="date"
              placeholder="From date"
              value={dateFrom ? dateFrom.toISOString().split("T")[0] : ""}
              onChange={(e) =>
                setDateFrom(
                  e.target.value ? new Date(e.target.value) : undefined
                )
              }
              className="w-[140px]"
            />
            <Input
              type="date"
              placeholder="To date"
              value={dateTo ? dateTo.toISOString().split("T")[0] : ""}
              onChange={(e) =>
                setDateTo(e.target.value ? new Date(e.target.value) : undefined)
              }
              className="w-[140px]"
            />
          </div>
          <ReportPdfButton
            type="overview"
            sacco={sacco}
            stats={stats}
            loans={filteredLoans}
            savings={filteredSavings}
            members={filteredMembers}
            fines={filteredFines}
            transactions={filteredTransactions}
            complaints={filteredComplaints}
            notifications={filteredNotifications}
            label="Export Full Report PDF"
          />
        </div>
        <ReportPdfButton
          type="overview"
          sacco={sacco}
          stats={stats}
          loans={loans}
          savings={savings}
          members={members}
          fines={fines}
          transactions={transactions}
          complaints={complaints}
          notifications={notifications}
          label="Export Full Report PDF"
        />
      </div>

      {/* Top KPI Strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        {[
          {
            title: "Total Savings",
            value: formatUGX(stats.totalSavings),
            description: `${stats.savingsCount} accounts`,
            icon: PiggyBank,
            accentColor: "#10b981",
          },
          {
            title: "Total Disbursed",
            value: formatUGX(stats.totalLoansAmount),
            description: `${stats.totalLoansCount} loans`,
            icon: Banknote,
            accentColor: "#3b82f6",
          },
          {
            title: "Outstanding",
            value: formatUGX(stats.activeLoansAmount),
            description: `${stats.activeLoansCount} active`,
            icon: TrendingUp,
            accentColor: "#a855f7",
          },
          {
            title: "Expected to Receive",
            value: formatUGX(stats.totalExpectedAmount),
            description: "Including interest",
            icon: ArrowUpRight,
            accentColor: "#f97316",
          },
          {
            title: "Pending Fines",
            value: formatUGX(stats.pendingFinesAmount),
            description: `${stats.pendingFinesCount} pending`,
            icon: AlertCircle,
            accentColor: "#ef4444",
          },
          {
            title: "Open Complaints",
            value: stats.openComplaints,
            description: "Awaiting resolution",
            icon: MessageSquare,
            accentColor: "#eab308",
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

      {/* Layout with Vertical Tabs */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Vertical Tabs Sidebar */}
        <div className="shrink-0 lg:w-64">
          <div className="sticky top-6">
            <div className="rounded-lg border bg-card p-2">
              <nav className="flex flex-col space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200",
                        "hover:bg-muted hover:text-foreground",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground"
                      )}
                    >
                      <Icon className={cn("h-4 w-4", tab.color)} />
                      <span>{tab.label}</span>
                      {tab.id === "loans" && stats.pendingLoansCount > 0 && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {stats.pendingLoansCount}
                        </Badge>
                      )}
                      {tab.id === "complaints" && stats.openComplaints > 0 && (
                        <Badge
                          variant="destructive"
                          className="ml-auto text-xs"
                        >
                          {stats.openComplaints}
                        </Badge>
                      )}
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          {/* ── OVERVIEW TAB ── */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Loan Disbursements
                    </CardTitle>
                    <CardDescription>Last 6 months</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={chartConfig}
                      className="h-[220px] w-full"
                    >
                      <AreaChart data={monthlyLoansData}>
                        <defs>
                          <linearGradient
                            id="loanGrad"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor={CHART_COLORS.amount}
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor={CHART_COLORS.amount}
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="stroke-muted"
                        />
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
                              formatter={(v) =>
                                `UGX ${Number(v).toLocaleString()}`
                              }
                            />
                          }
                        />
                        <Area
                          type="monotone"
                          dataKey="amount"
                          stroke={CHART_COLORS.amount}
                          fill="url(#loanGrad)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Savings Growth</CardTitle>
                    <CardDescription>Last 6 months</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={chartConfig}
                      className="h-[220px] w-full"
                    >
                      <AreaChart data={monthlySavingsData}>
                        <defs>
                          <linearGradient
                            id="savGrad"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor={CHART_COLORS.balance}
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor={CHART_COLORS.balance}
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="stroke-muted"
                        />
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
                              formatter={(v) =>
                                `UGX ${Number(v).toLocaleString()}`
                              }
                            />
                          }
                        />
                        <Area
                          type="monotone"
                          dataKey="balance"
                          stroke={CHART_COLORS.balance}
                          fill="url(#savGrad)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Member Growth</CardTitle>
                    <CardDescription>New members per month</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={chartConfig}
                      className="h-[220px] w-full"
                    >
                      <BarChart data={memberGrowthData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="stroke-muted"
                        />
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
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar
                          dataKey="count"
                          fill={CHART_COLORS.count}
                          radius={4}
                          name="Members"
                        />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Loan Status Distribution
                    </CardTitle>
                    <CardDescription>By current status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DonutChart
                      data={loanStatusData}
                      totalLabel="Loans"
                      title="Loan Status"
                      subtitle="By current status"
                      icon={
                        <HandCoins className="h-4 w-4 text-muted-foreground" />
                      }
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {[
                  {
                    label: "Total Members",
                    value: stats.totalMembers,
                    color: "text-blue-500",
                  },
                  {
                    label: "Active Members",
                    value: stats.activeMembers,
                    color: "text-green-500",
                  },
                  {
                    label: "Total Loans",
                    value: stats.totalLoansCount,
                    color: "text-purple-500",
                  },
                  {
                    label: "Active Loans",
                    value: stats.activeLoansCount,
                    color: "text-orange-500",
                  },
                  {
                    label: "Settled Loans",
                    value: stats.settledLoansCount,
                    color: "text-gray-500",
                  },
                  {
                    label: "Total Fines",
                    value: stats.finesCount,
                    color: "text-red-500",
                  },
                ].map((item) => (
                  <Card key={item.label}>
                    <CardContent className="pt-4 pb-3 text-center">
                      <p className={`text-2xl font-bold ${item.color}`}>
                        {item.value}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.label}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* ── LOANS TAB ── */}
          {activeTab === "loans" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative w-full">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search loans..."
                    className="h-9 pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      handleExcelExport(
                        "loans",
                        filteredLoans.map((l) => ({
                          loan_ref: l.loanRef,
                          member_name: l.member_name,
                          amount: l.amount,
                          balance: l.balance,
                          status: l.status,
                          due_date: l.dueDate,
                        })),
                        {
                          loan_ref: "Loan Ref",
                          member_name: "Member",
                          amount: "Amount",
                          balance: "Balance",
                          status: "Status",
                          due_date: "Due Date",
                        }
                      )
                    }
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Excel
                  </Button>
                  <ReportPdfButton
                    type="loans"
                    sacco={sacco}
                    stats={stats}
                    loans={filteredLoans}
                    label="PDF"
                  />
                </div>
              </div>
              <Card>
                <CardContent className="pt-4">
                  <ScrollArea className="h-[calc(100vh-400px)]">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Loan Ref</TableHead>
                          <TableHead>Member</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Balance</TableHead>
                          <TableHead>Monthly</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Due Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredLoans
                          .filter(
                            (l) =>
                              !search ||
                              l.loanRef
                                ?.toLowerCase()
                                .includes(search.toLowerCase()) ||
                              l.member_name
                                ?.toLowerCase()
                                .includes(search.toLowerCase())
                          )
                          .slice(0, 100)
                          .map((loan) => (
                            <TableRow
                              key={loan.id}
                              className="hover:bg-muted/30"
                            >
                              <TableCell className="font-mono text-sm">
                                {loan.loanRef}
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">
                                    {loan.member_name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {loan.memberCode}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>{formatUGX(loan.amount)}</TableCell>
                              <TableCell>{formatUGX(loan.balance)}</TableCell>
                              <TableCell>
                                {formatUGX(loan.monthlyPayment ?? 0)}
                              </TableCell>
                              <TableCell>
                                <span
                                  className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                                  style={{
                                    backgroundColor: `${loanStatusColors[loan.status]}20`,
                                    color: loanStatusColors[loan.status],
                                  }}
                                >
                                  {loan.status}
                                </span>
                              </TableCell>
                              <TableCell>{formatDate(loan.dueDate)}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── SAVINGS TAB ── */}
          {activeTab === "savings" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative w-full">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search savings..."
                    className="h-9 pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      handleExcelExport(
                        "savings",
                        filteredSavings.map((s) => ({
                          member_name: s.member_name,
                          account_number: s.accountNumber,
                          balance: s.balance,
                          account_type: s.accountType,
                          is_locked: s.isLocked,
                        })),
                        {
                          member_name: "Member",
                          account_number: "Account No",
                          balance: "Balance",
                          account_type: "Type",
                          is_locked: "Locked",
                        }
                      )
                    }
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Excel
                  </Button>
                  <ReportPdfButton
                    type="savings"
                    sacco={sacco}
                    stats={stats}
                    savings={filteredSavings}
                    label="PDF"
                  />
                </div>
              </div>
              <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-xs text-muted-foreground">
                      Total Savings
                    </p>
                    <p className="text-2xl font-bold text-green-500">
                      {formatUGX(stats.totalSavings)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-xs text-muted-foreground">Accounts</p>
                    <p className="text-2xl font-bold">{stats.savingsCount}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-xs text-muted-foreground">
                      Average Balance
                    </p>
                    <p className="text-2xl font-bold">
                      {formatUGX(
                        stats.savingsCount > 0
                          ? Math.floor(stats.totalSavings / stats.savingsCount)
                          : 0
                      )}
                    </p>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    Top Savers Leaderboard
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>#</TableHead>
                          <TableHead>Member</TableHead>
                          <TableHead>Account No</TableHead>
                          <TableHead>Balance</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Opened</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topSavers
                          .filter(
                            (s) =>
                              !search ||
                              s.member_name
                                ?.toLowerCase()
                                .includes(search.toLowerCase()) ||
                              s.accountNumber
                                ?.toLowerCase()
                                .includes(search.toLowerCase())
                          )
                          .map((s, i) => (
                            <TableRow key={s.id} className="hover:bg-muted/30">
                              <TableCell>
                                <span
                                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? "bg-yellow-100 text-yellow-700" : i === 1 ? "bg-gray-100 text-gray-600" : i === 2 ? "bg-orange-100 text-orange-700" : "bg-muted text-muted-foreground"}`}
                                >
                                  {i + 1}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{s.member_name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {s.memberCode}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {s.accountNumber}
                              </TableCell>
                              <TableCell className="font-semibold text-green-600">
                                {formatUGX(s.balance)}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    s.isLocked ? "destructive" : "default"
                                  }
                                >
                                  {s.isLocked ? "Locked" : "Active"}
                                </Badge>
                              </TableCell>
                              <TableCell>{formatDate(s.createdAt)}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Placeholder for other tabs - you can add similar content */}
          {activeTab !== "overview" &&
            activeTab !== "loans" &&
            activeTab !== "savings" && (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                      {(() => {
                        const activeTabData = tabs.find(
                          (t) => t.id === activeTab
                        )
                        if (activeTabData?.icon) {
                          const IconComponent = activeTabData.icon
                          return (
                            <IconComponent className="h-8 w-8 text-muted-foreground" />
                          )
                        }
                        return null
                      })()}
                    </div>
                    <h3 className="text-lg font-medium">Coming Soon</h3>
                    <p className="text-sm text-muted-foreground">
                      The {tabs.find((t) => t.id === activeTab)?.label} report
                      is currently under development.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
        </div>
      </div>
    </div>
  )
}
