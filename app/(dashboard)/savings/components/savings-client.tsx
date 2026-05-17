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
import {
  PiggyBank,
  Lock,
  Unlock,
  TrendingUp,
  Users,
  Plus,
  Search,
  SlidersHorizontal,
  Download,
} from "lucide-react"
import { DonutChart } from "@/app/(dashboard)/components/donut-chart"
import { formatUGX } from "@/lib/utils/format"
import { SavingsTable } from "./savings-table"
import { CreateAccountDialog } from "./create-account-dialog"
import ExcelJS from "exceljs"
import { toast } from "sonner"

interface SavingsClientProps {
  accounts: any[]
  stats: {
    totalBalance: number
    totalAccounts: number
    lockedAccounts: number
    regularAccounts: number
    fixedAccounts: number
    avgBalance: number
  }
  members: any[]
  categories: any[]
  activeLoans: any[]
}

// Consistent color palette matching dashboard line graph
const CHART_COLOR = "#10b981" // emerald - matching savings color

const chartConfig: ChartConfig = {
  balance: { label: "Balance", color: CHART_COLOR },
}

export function SavingsClient({
  accounts,
  stats,
  members,
  categories,
  activeLoans,
}: SavingsClientProps) {
  const [createOpen, setCreateOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<string | null>("all")
  const [lockFilter, setLockFilter] = useState<string | null>("all")

  const filtered = useMemo(() => {
    if (!accounts || !Array.isArray(accounts)) return []
    return accounts.filter((a) => {
      const matchSearch =
        a?.memberName?.toLowerCase().includes(search.toLowerCase()) ||
        a?.accountNumber?.toLowerCase().includes(search.toLowerCase()) ||
        a?.memberCode?.toLowerCase().includes(search.toLowerCase())
      const matchType = typeFilter === "all" || a?.accountType === typeFilter
      const matchLock =
        lockFilter === "all" ||
        (lockFilter === "locked" ? a?.isLocked : !a?.isLocked)
      return matchSearch && matchType && matchLock
    })
  }, [accounts, search, typeFilter, lockFilter])

  // Top 8 savers for chart
  const topSaversData = useMemo(() => {
    if (!accounts || !Array.isArray(accounts)) return []
    return [...accounts]
      .sort((a, b) => (b?.balance ?? 0) - (a?.balance ?? 0))
      .slice(0, 8)
      .map((a) => ({
        name: a?.member_name?.split(" ")[0] ?? "—",
        balance: (a?.balance ?? 0) / 100,
      }))
  }, [accounts])

  // Account type pie
  const typeData = [
    { label: "Regular", value: stats?.regularAccounts ?? 0, color: "#3b82f6" },
    { label: "Fixed", value: stats?.fixedAccounts ?? 0, color: "#10b981" },
  ]

  const handleExport = async () => {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Savings")

    worksheet.columns = [
      { header: "Account No", key: "account_no", width: 15 },
      { header: "Member", key: "member", width: 25 },
      { header: "Member Code", key: "member_code", width: 15 },
      { header: "Balance (UGX)", key: "balance", width: 15 },
      { header: "Type", key: "type", width: 10 },
      { header: "Status", key: "status", width: 10 },
      { header: "Lock Until", key: "lock_until", width: 15 },
      { header: "Category", key: "category", width: 15 },
      { header: "Opened", key: "opened", width: 15 },
    ]

    const data = filtered.map((a) => ({
      account_no: a.accountNumber,
      member: a.member_name,
      member_code: a.memberCode,
      balance: a.balance / 100,
      type: a.accountType,
      status: a.isLocked ? "Locked" : "Active",
      lock_until: a.lockUntil ?? "",
      category: a.category_name ?? "",
      opened: a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "",
    }))

    worksheet.addRows(data)

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "sacco-savings.xlsx"
    a.click()
    window.URL.revokeObjectURL(url)

    toast.success("Savings exported to Excel")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Savings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {stats?.totalAccounts ?? 0} savings accounts
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Account
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {[
          {
            title: "Total Savings",
            value: formatUGX(stats?.totalBalance ?? 0),
            description: "All accounts",
            icon: PiggyBank,
            accentColor: "#10b981",
          },
          {
            title: "Total Accounts",
            value: stats?.totalAccounts ?? 0,
            description: "Savings accounts",
            icon: Users,
            accentColor: "#3b82f6",
          },
          {
            title: "Average Balance",
            value: formatUGX(stats?.avgBalance ?? 0),
            description: "Per account",
            icon: TrendingUp,
            accentColor: "#a855f7",
          },
          {
            title: "Locked",
            value: stats?.lockedAccounts ?? 0,
            description: "Locked accounts",
            icon: Lock,
            accentColor: "#f97316",
          },
          {
            title: "Regular",
            value: stats?.regularAccounts ?? 0,
            description: "Active accounts",
            icon: Unlock,
            accentColor: "#14b8a6",
          },
          {
            title: "Fixed",
            value: stats?.fixedAccounts ?? 0,
            description: "Fixed deposits",
            icon: PiggyBank,
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

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Top Savers</CardTitle>
          </CardHeader>
          <CardContent>
            {topSaversData.length === 0 ? (
              <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
                No data yet
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[220px] w-full">
                <BarChart data={topSaversData} layout="vertical">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    className="text-xs"
                    tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    className="text-xs"
                    width={60}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(v) => `UGX ${Number(v).toLocaleString()}`}
                      />
                    }
                  />
                  <Bar
                    dataKey="balance"
                    fill={CHART_COLOR}
                    radius={4}
                    name="Balance"
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <DonutChart
          data={typeData}
          totalLabel="Accounts"
          title="Account Types"
          subtitle="Breakdown by account type"
          icon={<PiggyBank className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col flex-wrap items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-64 flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search member, account number..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="regular">Regular</SelectItem>
              <SelectItem value="fixed">Fixed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={lockFilter} onValueChange={setLockFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="locked">Locked</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <SavingsTable accounts={filtered} activeLoans={activeLoans} />

      {/* Create Account Dialog */}
      <CreateAccountDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        members={members}
        categories={categories}
      />
    </div>
  )
}
