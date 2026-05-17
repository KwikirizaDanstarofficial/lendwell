import { supabaseAdmin } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"
import { KpiCards } from "./components/kpi-cards"
import { SavingsLoanChart } from "./components/savings-loan-chart"
import { LoanStatusChart } from "./components/loan-status-chart"
import { RecentTransactions } from "./components/recent-transactions"

export const revalidate = 60

export default async function DashboardPage() {
  const user = await requireAuth()
  const { saccoId } = user

  const supabase = supabaseAdmin

  // Run all queries in parallel
  const [
    memberCountResult,
    loanDataResult,
    savingsResult,
    finesCountResult,
    transactionsResult,
  ] = await Promise.all([
    // Total members count
    supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('sacco_id', saccoId),
    // All loans: amount + status (covers active count, pending count, disbursed amount, status breakdown)
    supabase
      .from('loans')
      .select('amount, status')
      .eq('sacco_id', saccoId),
    // Total savings balances
    supabase
      .from('savings_accounts')
      .select('balance')
      .eq('sacco_id', saccoId),
    // Pending fines count
    supabase
      .from('fines')
      .select('*', { count: 'exact', head: true })
      .eq('sacco_id', saccoId)
      .eq('status', 'pending'),
    // Recent 100 transactions (used for both recent list + chart)
    supabase
      .from('transactions')
      .select('id, type, amount, narration, created_at')
      .eq('sacco_id', saccoId)
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  // ── Process members ──
  const totalMembers = memberCountResult.count ?? 0

  // ── Process loans (single pass over all loans) ──
  let activeLoanCount = 0
  let pendingLoanCount = 0
  let totalDisbursed = 0
  const statusCounts: Record<string, number> = {}

  for (const loan of loanDataResult.data ?? []) {
    if (loan.status === 'active') {
      activeLoanCount++
      totalDisbursed += loan.amount
    } else if (loan.status === 'pending') {
      pendingLoanCount++
    }
    statusCounts[loan.status] = (statusCounts[loan.status] ?? 0) + 1
  }

  const processedLoanStatusData = Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
  }))

  // ── Process savings ──
  const totalSavings = savingsResult.data?.reduce(
    (sum, a) => sum + a.balance, 0
  ) ?? 0

  // ── Process fines ──
  const pendingFines = finesCountResult.count ?? 0

  // ── Process transactions (first 8 for recent, all 100 for chart) ──
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

    if (tx.type === 'savings_deposit') {
      chartDataMap[key].savings += tx.amount
    } else if (tx.type === 'loan_disbursement') {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back! Here&apos;s what&apos;s happening with your SACCO.
        </p>
      </div>

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
