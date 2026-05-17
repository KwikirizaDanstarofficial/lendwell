"use client"

import { Users, Banknote, PiggyBank, AlertCircle, TrendingUp, Clock, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react"
import { formatUGX } from "@/lib/utils/format"
import { useEffect, useRef } from "react"

interface KpiCardsProps {
  totalMembers: number
  activeLoans: number
  totalSavings: number
  pendingFines: number
  totalDisbursed: number
  pendingLoans: number
}

function AnimatedNumber({ value, prefix = "" }: { value: number; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const duration = 1200
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 4)
      el.textContent = prefix + Math.floor(value * eased).toLocaleString()
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [value, prefix])
  return <span ref={ref}>0</span>
}

// Tiny inline sparkline using SVG
function Sparkline({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const w = 80
  const h = 28
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w
      const y = h - ((v - min) / range) * h
      return `${x},${y}`
    })
    .join(" ")

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <polyline
        points={pts}
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.9"
      />
      {/* End dot */}
      <circle
        cx={(values.length - 1) / (values.length - 1) * w}
        cy={h - ((values[values.length - 1] - min) / range) * h}
        r="2.5"
        fill={color}
      />
    </svg>
  )
}

const CARDS = (p: KpiCardsProps) => [
  {
    title: "Total Members",
    value: p.totalMembers,
    display: <AnimatedNumber value={p.totalMembers} />,
    icon: Users,
    accentColor: "#3b82f6",      // blue-500
    trend: +4.2,
    description: "Registered members",
    spark: [82, 88, 91, 87, 94, 98, 103, p.totalMembers],
  },
  {
    title: "Active Loans",
    value: p.activeLoans,
    display: <AnimatedNumber value={p.activeLoans} />,
    icon: Banknote,
    accentColor: "#10b981",      // emerald-500
    trend: +11.5,
    description: `${p.pendingLoans} pending approval`,
    spark: [12, 14, 13, 16, 18, 17, 19, p.activeLoans],
  },
  {
    title: "Total Savings",
    value: p.totalSavings,
    display: <span>{formatUGX(p.totalSavings)}</span>,
    icon: PiggyBank,
    accentColor: "#a855f7",      // purple-500
    trend: +8.3,
    description: "Across all accounts",
    spark: [4.2, 5.8, 5.2, 7.1, 8.4, 9.2, 9.6, 9.9].map(v => v * 1_000_000),
  },
  {
    title: "Total Disbursed",
    value: p.totalDisbursed,
    display: <span>{formatUGX(p.totalDisbursed)}</span>,
    icon: TrendingUp,
    accentColor: "#f97316",      // orange-500
    trend: +6.1,
    description: "Active loan portfolio",
    spark: [1.8, 2.4, 3.1, 2.8, 3.6, 4.2, 4.0, 4.4].map(v => v * 1_000_000),
  },
  {
    title: "Pending Fines",
    value: p.pendingFines,
    display: <AnimatedNumber value={p.pendingFines} />,
    icon: AlertCircle,
    accentColor: "#ef4444",      // red-500
    trend: -2.4,
    description: "Awaiting payment",
    spark: [8, 7, 9, 11, 8, 7, 6, p.pendingFines],
  },
  {
    title: "Pending Loans",
    value: p.pendingLoans,
    display: <AnimatedNumber value={p.pendingLoans} />,
    icon: Clock,
    accentColor: "#eab308",      // yellow-500
    trend: +1.8,
    description: "Awaiting approval",
    spark: [3, 4, 3, 5, 4, 6, 5, p.pendingLoans],
  },
]

export function KpiCards(props: KpiCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {CARDS(props).map((card, i) => {
        const TrendIcon = card.trend >= 0 ? ArrowUpRight : ArrowDownRight
        const trendPositive = card.trend >= 0
        return (
          <div
            key={card.title}
            className="relative bg-card border border-border rounded overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            {/* Left accent bar */}

            {/* Subtle tinted background on hover */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
              style={{ background: `radial-gradient(ellipse at top left, ${card.accentColor}08, transparent 70%)` }}
            />

            <div className="relative px-5 pt-4 pb-4">
              {/* Top row: title + icon */}
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest leading-none">
                  {card.title}
                </p>
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${card.accentColor}18` }}
                >
                  <card.icon
                    className="h-4 w-4"
                    style={{ color: card.accentColor }}
                  />
                </div>
              </div>

              {/* Value */}
              <p className="text-[1.6rem] font-bold text-foreground tracking-tight leading-none mb-3 tabular-nums">
                {card.display}
              </p>

              {/* Bottom row: trend + sparkline */}
              <div className="flex items-end justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <TrendIcon
                      className="h-3.5 w-3.5"
                      style={{ color: trendPositive ? "#10b981" : "#ef4444" }}
                    />
                    <span
                      className="text-xs font-semibold tabular-nums"
                      style={{ color: trendPositive ? "#10b981" : "#ef4444" }}
                    >
                      {trendPositive ? "+" : ""}{card.trend}%
                    </span>
                    <span className="text-xs text-muted-foreground">vs last month</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{card.description}</p>
                </div>
                <div className="opacity-70 group-hover:opacity-100 transition-opacity">
                  <Sparkline values={card.spark} color={card.accentColor} />
                </div>
              </div>
            </div>

            {/* Bottom accent line */}
            <div
              className="absolute bottom-0 left-3 right-3 h-px opacity-20"
              style={{ background: `linear-gradient(to right, transparent, ${card.accentColor}, transparent)` }}
            />
          </div>
        )
      })}
    </div>
  )
}