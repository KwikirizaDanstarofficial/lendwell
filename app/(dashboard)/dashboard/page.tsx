import Link from "next/link"
import { supabaseAdmin } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { cached } from "@/lib/cache"
import { KpiCards } from "./components/kpi-cards"
import { SavingsLoanChart } from "./components/savings-loan-chart"
import { LoanStatusChart } from "./components/loan-status-chart"
import { RecentTransactions } from "./components/recent-transactions"

export const revalidate = 60

const CACHE_TTL_MS = 30_000

async function getDashboardData(saccoId: string) {
  const [
    memberCountResult,
    savingsAggResult,
    finesCountResult,
    transactionsResult,
  ] = await Promise.all([
    supabaseAdmin
      .from("members")
      .select("*", { count: "exact", head: true })
      .eq("sacco_id", saccoId),
    supabaseAdmin
      .from("savings_accounts")
      .select("balance")
      .eq("sacco_id", saccoId),
    supabaseAdmin
      .from("fines")
      .select("*", { count: "exact", head: true })
      .eq("sacco_id", saccoId)
      .eq("status", "pending"),
    supabaseAdmin
      .from("transactions")
      .select("id, type, amount, narration, created_at")
      .eq("sacco_id", saccoId)
      .order("created_at", { ascending: false })
      .limit(100),
  ])

  const totalMembers = memberCountResult.count ?? 0

  const totalSavings = savingsAggResult.data?.reduce(
    (sum, a) => sum + a.balance, 0
  ) ?? 0

  const pendingFines = finesCountResult.count ?? 0

  const allTransactions = transactionsResult.data ?? []
  const processedRecentTransactions = allTransactions.slice(0, 8).map(tx => ({
    id: tx.id,
    type: tx.type,
    amount: tx.amount,
    narration: tx.narration,
    created_at: tx.created_at,
  }))

  const chartDataMap: Record<string, { year: number; month: number; savings: number; loans: number }> = {}
  for (const tx of allTransactions) {
    const date = new Date(tx.created_at)
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`
    if (!chartDataMap[key]) {
      chartDataMap[key] = { year: date.getFullYear(), month: date.getMonth() + 1, savings: 0, loans: 0 }
    }
    if (tx.type === "savings_deposit") {
      chartDataMap[key].savings += tx.amount
    } else if (tx.type === "loan_disbursement") {
      chartDataMap[key].loans += tx.amount
    }
  }

  const processedSavingsLoanChartData = Object.values(chartDataMap)
    .sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year
      return b.month - a.month
    })
    .slice(0, 6)
    .map((item) => ({
      month: new Date(item.year, item.month - 1).toLocaleString("en-US", {
        month: "short",
      }),
      savings: Number(item.savings),
      loans: Number(item.loans),
    }))

  return {
    totalMembers,
    pendingFines,
    totalSavings,
    processedRecentTransactions,
    processedSavingsLoanChartData,
  }
}

async function getLoanData(saccoId: string) {
  const { data, error } = await supabaseAdmin
    .from("loans")
    .select("amount, status")
    .eq("sacco_id", saccoId)

  if (error) console.error("[DASHBOARD] loans error:", error)

  let activeLoanCount = 0
  let pendingLoanCount = 0
  let totalDisbursed = 0
  const statusCounts: Record<string, number> = {}

  for (const loan of data ?? []) {
    if (loan.status === "active") {
      activeLoanCount++
      totalDisbursed += loan.amount
    } else if (loan.status === "pending") {
      pendingLoanCount++
    }
    statusCounts[loan.status] = (statusCounts[loan.status] ?? 0) + 1
  }

  const processedLoanStatusData = Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
  }))

  return { activeLoanCount, pendingLoanCount, totalDisbursed, processedLoanStatusData }
}

export default async function DashboardPage() {
  const user = await requireAuth()
  const { saccoId } = user

  const [
    { totalMembers, pendingFines, totalSavings, processedRecentTransactions, processedSavingsLoanChartData },
    { activeLoanCount, pendingLoanCount, totalDisbursed, processedLoanStatusData },
  ] = await Promise.all([
    cached(`dashboard_main:${saccoId}`, CACHE_TTL_MS, () => getDashboardData(saccoId)),
    cached(`dashboard_loans:${saccoId}`, CACHE_TTL_MS, () => getLoanData(saccoId)),
  ])

  const isEmpty = totalMembers === 0 && activeLoanCount === 0 && Number(totalSavings) === 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isEmpty ? `Welcome to your SACCO, ${user.fullName.split(" ")[0]}!` : "Welcome back! Here's what's happening with your SACCO."}
        </p>
      </div>

      {isEmpty && (
        <div className="rounded border border-border bg-card p-6">
          <h2 className="text-base font-semibold mb-1">Get started</h2>
          <p className="text-sm text-muted-foreground mb-5">Your SACCO is set up. Complete these steps to start managing members and finances.</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { href: "/members/add",    label: "Add first member",         desc: "Register your first SACCO member"         },
              { href: "/settings",       label: "Configure loan categories", desc: "Set up loan products and interest rates"   },
              { href: "/savings/new",    label: "Open savings account",      desc: "Create a savings account for a member"    },
              { href: "/loans/new",      label: "Issue a loan",              desc: "Disburse a loan to a member"              },
              { href: "/settings",       label: "Invite staff",              desc: "Add cashiers or field agents"              },
              { href: "/notifications",  label: "Send a notification",       desc: "Notify members via SMS"                   },
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
        totalMembers={totalMembers}
        activeLoans={activeLoanCount}
        totalSavings={Number(totalSavings)}
        pendingFines={pendingFines}
        totalDisbursed={Number(totalDisbursed)}
        pendingLoans={pendingLoanCount}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SavingsLoanChart data={processedSavingsLoanChartData} />
        </div>
        <div>
          <LoanStatusChart loanStatusData={processedLoanStatusData} />
        </div>
      </div>

      <RecentTransactions transactions={processedRecentTransactions} />
    </div>
  )
}


