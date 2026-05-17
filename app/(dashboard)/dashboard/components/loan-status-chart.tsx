"use client"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Pie, PieChart, Cell } from "recharts"
import { HandCoins } from "lucide-react"

interface LoanStatusData {
  status: string
  count: number
}

// Vivid, distinct, finance-grade palette
const STATUS_META: Record<string, { color: string; label: string }> = {
  pending: { color: "#f59e0b", label: "Pending" },
  approved: { color: "#3b82f6", label: "Approved" },
  verified: { color: "#06b6d4", label: "Verified" },
  active: { color: "#10b981", label: "Active" },
  disbursed: { color: "#8b5cf6", label: "Disbursed" },
  extended: { color: "#f97316", label: "Extended" },
  settled: { color: "#6b7280", label: "Settled" },
  declined: { color: "#ef4444", label: "Declined" },
  defaulted: { color: "#dc2626", label: "Defaulted" },
}

const fallbackColors = ["#94a3b8", "#64748b", "#475569"]

export function LoanStatusChart({
  loanStatusData,
}: {
  loanStatusData: LoanStatusData[]
}) {
  if (!loanStatusData || loanStatusData.length === 0) {
    return (
      <div className="overflow-hidden rounded border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-6 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
              <HandCoins className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-widest text-foreground uppercase">
                Loan Status
              </p>
              <p className="text-xs text-muted-foreground">No data available</p>
            </div>
          </div>
        </div>
        <div className="flex h-[220px] items-center justify-center">
          <p className="text-sm text-muted-foreground">No loan data yet</p>
        </div>
      </div>
    )
  }
  const total = loanStatusData.reduce((s, d) => s + d.count, 0)

  const enriched = loanStatusData.map((item, i) => ({
    ...item,
    color:
      STATUS_META[item.status]?.color ??
      fallbackColors[i % fallbackColors.length],
    label: STATUS_META[item.status]?.label ?? item.status,
    pct: total > 0 ? Math.round((item.count / total) * 100) : 0,
  }))

  const chartConfig = enriched.reduce((acc, item) => {
    acc[item.status] = { label: item.label, color: item.color }
    return acc
  }, {} as ChartConfig)

  return (
    <div className="overflow-hidden rounded border border-border bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
            <HandCoins className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-widest text-foreground uppercase">
              Loan Status
            </p>
            <p className="text-xs text-muted-foreground">
              Breakdown by current status
            </p>
          </div>
        </div>
        <div className="rounded-full bg-muted px-3 py-1">
          <span className="text-xs font-semibold text-foreground tabular-nums">
            {total} total
          </span>
        </div>
      </div>

      {total === 0 ? (
        <div className="flex h-[220px] items-center justify-center">
          <p className="text-sm text-muted-foreground">No loan data yet</p>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-4 py-4">
          {/* Donut */}
          <div className="relative shrink-0">
            <ChartContainer
              config={chartConfig}
              className="h-[180px] w-[180px]"
            >
              <PieChart>
                <Pie
                  data={enriched}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={80}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {enriched.map((entry) => (
                    <Cell key={entry.status} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
            {/* Centre label */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl leading-none font-bold text-foreground">
                {total}
              </span>
              <span className="mt-0.5 text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                Loans
              </span>
            </div>
          </div>

          {/* Side legend table */}
          <div className="min-w-0 flex-1 space-y-1.5">
            {enriched.map((item) => (
              <div
                key={item.status}
                className="group flex items-center gap-2.5"
              >
                <div
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: item.color }}
                />
                <span className="flex-1 truncate text-xs text-muted-foreground capitalize transition-colors group-hover:text-foreground">
                  {item.label}
                </span>
                <span className="text-xs font-semibold text-foreground tabular-nums">
                  {item.count}
                </span>
                <div className="h-1.5 w-10 shrink-0 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${item.pct}%`, background: item.color }}
                  />
                </div>
                <span className="w-7 text-right text-[10px] text-muted-foreground tabular-nums">
                  {item.pct}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
