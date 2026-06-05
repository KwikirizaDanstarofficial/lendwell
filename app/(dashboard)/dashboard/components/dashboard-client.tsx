"use client"

import Link from "next/link"
import { useQuery } from "@powersync/react"
import { useMemo } from "react"
import { KpiCards } from "./kpi-cards"
import { SavingsLoanChart } from "./savings-loan-chart"
import { LoanStatusChart } from "./loan-status-chart"
import { RecentTransactions } from "./recent-transactions"

interface Props {
  saccoId: string
  userName: string
}

export function DashboardClient({ saccoId, userName }: Props) {
  const { data: memberRows = [] } = useQuery(
    "SELECT COUNT(*) as count FROM members WHERE sacco_id = ?",
    [saccoId]
  )
  const { data: savingsRows = [] } = useQuery(
    "SELECT COALESCE(SUM(balance), 0) as total FROM savings_accounts WHERE sacco_id = ?",
    [saccoId]
  )
  const { data: fineRows = [] } = useQuery(
    "SELECT COUNT(*) as count FROM fines WHERE sacco_id = ? AND status = 'pending'",
    [saccoId]
  )
  const { data: txRows = [] } = useQuery(
    "SELECT id, type, amount, narration, created_at FROM transactions WHERE sacco_id = ? ORDER BY created_at DESC LIMIT 100",
    [saccoId]
  )
  const { data: loanRows = [] } = useQuery(
    "SELECT amount, balance, status FROM loans WHERE sacco_id = ?",
    [saccoId]
  )

  const totalMembers   = (memberRows[0] as any)?.count  ?? 0
  const totalSavings   = (savingsRows[0] as any)?.total ?? 0
  const pendingFines   = (fineRows[0] as any)?.count    ?? 0

  const { activeLoanCount, pendingLoanCount, totalDisbursed, loanStatusData } = useMemo(() => {
    let activeLoanCount  = 0
    let pendingLoanCount = 0
    let totalDisbursed   = 0
    const statusCounts: Record<string, number> = {}
    for (const loan of loanRows as any[]) {
      if (loan.status === "active")  { activeLoanCount++;  totalDisbursed += loan.amount }
      if (loan.status === "pending") { pendingLoanCount++ }
      statusCounts[loan.status] = (statusCounts[loan.status] ?? 0) + 1
    }
    const loanStatusData = Object.entries(statusCounts).map(([status, count]) => ({ status, count }))
    return { activeLoanCount, pendingLoanCount, totalDisbursed, loanStatusData }
  }, [loanRows])

  const { recentTransactions, chartData } = useMemo(() => {
    const recentTransactions = (txRows as any[]).slice(0, 8).map((tx: any) => ({
      id: tx.id, type: tx.type, amount: tx.amount, narration: tx.narration, created_at: tx.created_at,
    }))
    const chartDataMap: Record<string, { year: number; month: number; savings: number; loans: number }> = {}
    for (const tx of txRows as any[]) {
      const d = new Date(tx.created_at)
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`
      if (!chartDataMap[key]) chartDataMap[key] = { year: d.getFullYear(), month: d.getMonth() + 1, savings: 0, loans: 0 }
      if (tx.type === "savings_deposit")   chartDataMap[key].savings += tx.amount
      if (tx.type === "loan_disbursement") chartDataMap[key].loans   += tx.amount
    }
    const chartData = Object.values(chartDataMap)
      .sort((a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month)
      .slice(0, 6)
      .map((item) => ({
        month: new Date(item.year, item.month - 1).toLocaleString("en-US", { month: "short" }),
        savings: Number(item.savings),
        loans: Number(item.loans),
      }))
    return { recentTransactions, chartData }
  }, [txRows])

  const isEmpty = totalMembers === 0 && activeLoanCount === 0 && Number(totalSavings) === 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isEmpty
            ? `Welcome to Lendwell, ${userName}!`
            : "Welcome back! Here's what's happening with your SACCO."}
        </p>
      </div>

      {isEmpty && (
        <div className="rounded border border-border bg-card p-6">
          <h2 className="text-base font-semibold mb-1">Get started</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Your SACCO is set up. Complete these steps to start managing members and finances.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { href: "/members/add",   label: "Add first member",          desc: "Register your first SACCO member"        },
              { href: "/settings",      label: "Configure loan categories",  desc: "Set up loan products and interest rates"  },
              { href: "/savings/new",   label: "Open savings account",       desc: "Create a savings account for a member"   },
              { href: "/loans/new",     label: "Issue a loan",               desc: "Disburse a loan to a member"             },
              { href: "/settings",      label: "Invite staff",               desc: "Add cashiers or field agents"             },
              { href: "/notifications", label: "Send a notification",        desc: "Notify members via SMS"                  },
            ].map((item) => (
              <Link
                key={item.href + item.label}
                href={item.href}
                className="flex flex-col gap-1 rounded border border-border bg-muted/40 px-4 py-3 hover:border-primary/40 hover:bg-muted/70 transition-colors"
              >
                <span className="text-sm font-medium text-foreground">{item.label}</span>
                <span className="text-xs text-muted-foreground">{item.desc}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <KpiCards
        totalMembers={Number(totalMembers)}
        activeLoans={activeLoanCount}
        totalSavings={Number(totalSavings)}
        pendingFines={Number(pendingFines)}
        totalDisbursed={Number(totalDisbursed)}
        pendingLoans={pendingLoanCount}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SavingsLoanChart data={chartData} />
        </div>
        <div>
          <LoanStatusChart loanStatusData={loanStatusData} />
        </div>
      </div>

      <RecentTransactions transactions={recentTransactions} />
    </div>
  )
}
