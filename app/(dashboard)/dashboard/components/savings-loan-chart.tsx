"use client"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { TrendingUp, TrendingDown } from "lucide-react"

interface ChartData {
  month: string
  savings: number
  loans: number
}

const SAVINGS_COLOR = "rgb(16, 184, 129)" // emerald
const LOANS_COLOR = "rgb(99, 102, 241)" // indigo

const chartConfig = {
  savings: { label: "Savings", color: SAVINGS_COLOR },
  loans: { label: "Loans", color: LOANS_COLOR },
}

function formatM(value: number): string {
  return (value / 1_000_000).toFixed(1) + "M"
}

export function SavingsLoanChart(props: { data: ChartData[] }) {
  const { data } = props
  if (!data || data.length === 0) {
    return (
      <div className="overflow-hidden rounded border border-border bg-card shadow-sm">
        <div className="border-b border-border px-6 pt-5 pb-4">
          <p className="text-sm font-semibold tracking-widest text-foreground uppercase">
            Savings vs Loans
          </p>
        </div>
        <div className="flex h-[240px] items-center justify-center">
          <p className="text-sm text-muted-foreground">
            No chart data available
          </p>
        </div>
      </div>
    )
  }

  // Compute deltas
  const last = data[data.length - 1]
  const prev = data[data.length - 2]
  const sDelta = prev
    ? (((last.savings - prev.savings) / prev.savings) * 100).toFixed(1)
    : "0"
  const lDelta = prev
    ? (((last.loans - prev.loans) / prev.loans) * 100).toFixed(1)
    : "0"
  const sPct = Number(sDelta)
  const lPct = Number(lDelta)

  return (
    <div className="overflow-hidden rounded border border-border bg-card shadow-sm">
      {/* Header */}
      <div className="border-b border-border px-6 pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold tracking-widest text-foreground uppercase">
              Savings vs Loans
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Last 6 months overview · UGX
            </p>
          </div>

          {/* Summary chips */}
          <div className="flex items-center gap-2">
            {/* Savings chip */}
            <div
              className="flex items-center gap-1.5 rounded-full border px-2.5 py-1"
              style={{
                borderColor: `${SAVINGS_COLOR}30`,
                background: `${SAVINGS_COLOR}10`,
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: SAVINGS_COLOR }}
              />
              <span
                className="text-[11px] font-semibold"
                style={{ color: SAVINGS_COLOR }}
              >
                UGX {formatM(last.savings)}
              </span>
              {sPct >= 0 ? (
                <TrendingUp
                  className="h-3 w-3"
                  style={{ color: SAVINGS_COLOR }}
                />
              ) : (
                <TrendingDown
                  className="h-3 w-3"
                  style={{ color: SAVINGS_COLOR }}
                />
              )}
              <span
                className="text-[10px] font-medium"
                style={{ color: SAVINGS_COLOR }}
              >
                {sPct >= 0 ? "+" : ""}
                {sDelta}%
              </span>
            </div>

            {/* Loans chip */}
            <div
              className="flex items-center gap-1.5 rounded border px-2.5 py-1"
              style={{
                borderColor: `${LOANS_COLOR}30`,
                background: `${LOANS_COLOR}10`,
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: LOANS_COLOR }}
              />
              <span
                className="text-[11px] font-semibold"
                style={{ color: LOANS_COLOR }}
              >
                UGX {formatM(last.loans)}
              </span>
              {lPct >= 0 ? (
                <TrendingUp
                  className="h-3 w-3"
                  style={{ color: LOANS_COLOR }}
                />
              ) : (
                <TrendingDown
                  className="h-3 w-3"
                  style={{ color: LOANS_COLOR }}
                />
              )}
              <span
                className="text-[10px] font-medium"
                style={{ color: LOANS_COLOR }}
              >
                {lPct >= 0 ? "+" : ""}
                {lDelta}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="px-2 pt-3 pb-2">
        <ChartContainer config={chartConfig} className="h-[240px] w-full">
          <AreaChart
            data={data}
            margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              className="stroke-border"
              opacity={0.6}
            />

            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tick={{
                fontSize: 11,
                fill: "#ffffff",
                fontWeight: 500,
              }}
              dy={6}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "#ffffff" }}
              tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`}
              width={38}
            />
            <ChartTooltip
              cursor={{
                stroke: "hsl(var(--border))",
                strokeWidth: 1,
                strokeDasharray: "4 2",
              }}
              content={
                <ChartTooltipContent
                  formatter={(value) => `UGX ${Number(value).toLocaleString()}`}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />

            {/* Savings */}
            <Area
              type="monotone"
              dataKey="savings"
              stroke={SAVINGS_COLOR}
              strokeWidth={2.5}
              fill={`${SAVINGS_COLOR}20`}
              dot={{
                r: 3.5,
                fill: SAVINGS_COLOR,
                stroke: "hsl(var(--card))",
                strokeWidth: 2,
              }}
              activeDot={{
                r: 5.5,
                fill: SAVINGS_COLOR,
                stroke: "hsl(var(--card))",
                strokeWidth: 2,
                filter: "none",
              }}
            />

            {/* Loans */}
            <Area
              type="monotone"
              dataKey="loans"
              stroke={LOANS_COLOR}
              strokeWidth={2.5}
              fill={`${LOANS_COLOR}20`}
              dot={{
                r: 3.5,
                fill: LOANS_COLOR,
                stroke: "hsl(var(--card))",
                strokeWidth: 2,
              }}
              activeDot={{
                r: 5.5,
                fill: LOANS_COLOR,
                stroke: "hsl(var(--card))",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ChartContainer>
      </div>
    </div>
  )
}
