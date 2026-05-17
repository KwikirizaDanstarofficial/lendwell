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
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  DollarSign,
  Plus,
  Search,
  SlidersHorizontal,
  Download,
} from "lucide-react"
import { formatUGX } from "@/lib/utils/format"
import { FinesTable } from "./fines-table"
import { AddFineDialog } from "./add-fine-dialog"
import { DonutChart } from "@/app/(dashboard)/components/donut-chart"
import ExcelJS from "exceljs"
import { toast } from "sonner"

interface FinesClientProps {
  fines: any[]
  stats: {
    totalAmount: number
    totalCount: number
    pendingAmount: number
    pendingCount: number
    paidAmount: number
    paidCount: number
    waivedCount: number
  }
  members: any[]
  categories: any[]
}

// Consistent color palette matching dashboard line graph
const CHART_COLOR = "#10b981" // emerald - matching savings color

const chartConfig: ChartConfig = {
  amount: { label: "Amount", color: CHART_COLOR },
}

export const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400",
  normal: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  urgent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
}

export const statusConfig: Record<string, { color: string; label: string }> = {
  pending: {
    color:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    label: "Pending",
  },
  paid: {
    color:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    label: "Paid",
  },
  waived: {
    color: "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400",
    label: "Waived",
  },
}

export function FinesClient({
  fines,
  stats,
  members,
  categories,
}: FinesClientProps) {
  const [addOpen, setAddOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")

  const filtered = useMemo(() => {
    return fines.filter((f) => {
      const matchSearch =
        f.member_name?.toLowerCase().includes(search.toLowerCase()) ||
        f.fineRef?.toLowerCase().includes(search.toLowerCase()) ||
        f.reason?.toLowerCase().includes(search.toLowerCase()) ||
        f.memberCode?.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === "all" || f.status === statusFilter
      const matchPriority =
        priorityFilter === "all" || f.priority === priorityFilter
      return matchSearch && matchStatus && matchPriority
    })
  }, [fines, search, statusFilter, priorityFilter])

  // Monthly fines chart
  const monthlyData = useMemo(() => {
    const months: Record<string, number> = {}
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now)
      d.setMonth(d.getMonth() - i)
      months[d.toLocaleString("default", { month: "short" })] = 0
    }
    fines.forEach((f) => {
      if (!f.createdAt) return
      const key = new Date(f.createdAt).toLocaleString("default", {
        month: "short",
      })
      if (months[key] !== undefined) months[key] += f.amount / 100
    })
    return Object.entries(months).map(([month, amount]) => ({ month, amount }))
  }, [fines])

  // Status pie
  const pieData = [
    { label: "Pending", value: stats.pendingCount, color: "#f59e0b" },
    { label: "Paid", value: stats.paidCount, color: "#10b981" },
    { label: "Waived", value: stats.waivedCount, color: "#6b7280" },
  ].filter((d) => d.value > 0)

  const handleExport = async () => {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Fines")

    worksheet.columns = [
      { header: "Fine Ref", key: "fine_ref", width: 15 },
      { header: "Member", key: "member", width: 25 },
      { header: "Member Code", key: "member_code", width: 15 },
      { header: "Category", key: "category", width: 15 },
      { header: "Amount (UGX)", key: "amount", width: 15 },
      { header: "Reason", key: "reason", width: 30 },
      { header: "Priority", key: "priority", width: 10 },
      { header: "Status", key: "status", width: 10 },
      { header: "Due Date", key: "due_date", width: 15 },
      { header: "Paid At", key: "paid_at", width: 15 },
      { header: "Payment Method", key: "payment_method", width: 15 },
      { header: "Date", key: "date", width: 15 },
    ]

    const data = filtered.map((f) => ({
      fine_ref: f.fineRef,
      member: f.member_name,
      member_code: f.memberCode,
      category: f.category_name ?? "",
      amount: f.amount / 100,
      reason: f.reason,
      priority: f.priority,
      status: f.status,
      due_date: f.dueDate ?? "",
      paid_at: f.paidAt ? new Date(f.paidAt).toLocaleDateString() : "",
      payment_method: f.paymentMethod ?? "",
      date: f.createdAt ? new Date(f.createdAt).toLocaleDateString() : "",
    }))

    worksheet.addRows(data)

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "sacco-fines.xlsx"
    a.click()
    window.URL.revokeObjectURL(url)

    toast.success("Fines exported to Excel")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fines</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {stats.totalCount} total fines issued
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
          <Button
            className="bg-red-600 text-white hover:bg-red-700"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Issue Fine
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            title: "Total Issued",
            value: formatUGX(stats.totalAmount),
            description: `${stats.totalCount} fines`,
            icon: DollarSign,
            accentColor: "#ef4444",
          },
          {
            title: "Pending",
            value: formatUGX(stats.pendingAmount),
            description: `${stats.pendingCount} unpaid`,
            icon: AlertCircle,
            accentColor: "#eab308",
          },
          {
            title: "Collected",
            value: formatUGX(stats.paidAmount),
            description: `${stats.paidCount} paid`,
            icon: CheckCircle,
            accentColor: "#10b981",
          },
          {
            title: "Waived",
            value: stats.waivedCount,
            description: "fines waived",
            icon: XCircle,
            accentColor: "#6b7280",
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
            <CardTitle className="text-base">Monthly Fines Issued</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
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
                  tickFormatter={(v) =>
                    v >= 1000000
                      ? `${(v / 1000000).toFixed(1)}M`
                      : `${(v / 1000).toFixed(0)}K`
                  }
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(v) => `UGX ${Number(v).toLocaleString()}`}
                    />
                  }
                />
                <Bar
                  dataKey="amount"
                  fill={CHART_COLOR}
                  radius={4}
                  name="Amount"
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <DonutChart
          data={pieData}
          totalLabel="Fines"
          title="Fines by Status"
          subtitle="Breakdown by status"
          icon={<AlertCircle className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col flex-wrap items-start gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-64 flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search member, ref, reason..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value || "all")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="waived">Waived</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={priorityFilter}
            onValueChange={(value) => setPriorityFilter(value || "all")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <FinesTable fines={filtered} />

      <AddFineDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        members={members}
        categories={categories}
      />
    </div>
  )
}
