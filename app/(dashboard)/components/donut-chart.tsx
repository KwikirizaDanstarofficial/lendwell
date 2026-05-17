"use client"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Pie, PieChart, Cell } from "recharts"

interface DonutChartData {
  label: string
  value: number
  color: string
}

interface DonutChartProps {
  data: DonutChartData[]
  totalLabel?: string
  totalValue?: number
  title?: string
  subtitle?: string
  icon?: React.ReactNode
}

const fallbackColors = ["#94a3b8", "#64748b", "#475569"]

export function DonutChart({
  data,
  totalLabel = "Total",
  totalValue,
  title,
  subtitle,
  icon,
}: DonutChartProps) {
  // Handle null/undefined data
  if (!data || !Array.isArray(data)) {
    return (
      <div className="overflow-hidden rounded border border-border bg-card shadow-sm">
        <div className="flex h-[220px] items-center justify-center">
          <p className="text-sm text-muted-foreground">No data available</p>
        </div>
      </div>
    )
  }

  const total = totalValue ?? data.reduce((s, d) => s + (d.value ?? 0), 0)

  const enriched = data.map((item, i) => ({
    ...item,
    pct: total > 0 ? Math.round(((item.value ?? 0) / total) * 100) : 0,
  }))

  const chartConfig =
    enriched?.reduce((acc, item) => {
      if (item.label) {
        acc[item.label] = { label: item.label, color: item.color }
      }
      return acc
    }, {} as ChartConfig) ?? {}

  return (
    <div className="overflow-hidden rounded border border-border bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 pt-5 pb-4">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
              {icon}
            </div>
          )}
          <div>
            {title && (
              <p className="text-sm font-semibold tracking-widest text-foreground uppercase">
                {title}
              </p>
            )}
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="rounded-full bg-muted px-3 py-1">
          <span className="text-xs font-semibold text-foreground tabular-nums">
            {total} {totalLabel}
          </span>
        </div>
      </div>

      {total === 0 ? (
        <div className="flex h-[220px] items-center justify-center">
          <p className="text-sm text-muted-foreground">No data yet</p>
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
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={80}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {enriched.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={
                        entry.color || fallbackColors[i % fallbackColors.length]
                      }
                    />
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
                {totalLabel}
              </span>
            </div>
          </div>

          {/* Side legend table */}
          <div className="min-w-0 flex-1 space-y-1.5">
            {enriched.map((item) => (
              <div key={item.label} className="group flex items-center gap-2.5">
                <div
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: item.color }}
                />
                <span className="flex-1 truncate text-xs text-muted-foreground capitalize transition-colors group-hover:text-foreground">
                  {item.label}
                </span>
                <span className="text-xs font-semibold text-foreground tabular-nums">
                  {item.value}
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
