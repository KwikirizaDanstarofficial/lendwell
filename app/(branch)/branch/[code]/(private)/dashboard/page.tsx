import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabase/server"
import { Users, PiggyBank, Banknote, AlertCircle } from "lucide-react"

function fmt(n: number) {
  return new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 }).format(n)
}

export default async function BranchDashboardPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const user = await getCurrentUser()
  if (!user) redirect("/auth/login")

  const { data: branch } = await supabaseAdmin
    .from("branches")
    .select("id, name")
    .eq("code", code)
    .eq("sacco_id", user.saccoId)
    .single()

  if (!branch) redirect("/dashboard")

  // Fetch members in this branch first
  const { data: branchMembers } = await supabaseAdmin
    .from("members")
    .select("id")
    .eq("branch_id", branch.id)
    .eq("sacco_id", user.saccoId)

  const memberIds = (branchMembers ?? []).map((m) => m.id)
  const memberCount = memberIds.length

  // Then fetch financial data scoped to those members
  const [savingsRes, loansRes, finesRes] = memberCount > 0
    ? await Promise.all([
        supabaseAdmin.from("savings_accounts").select("balance").eq("sacco_id", user.saccoId).in("member_id", memberIds),
        supabaseAdmin.from("loans").select("balance, status").eq("sacco_id", user.saccoId).in("member_id", memberIds),
        supabaseAdmin.from("fines").select("status").eq("sacco_id", user.saccoId).in("member_id", memberIds),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }]

  const totalSavings  = (savingsRes.data ?? []).reduce((s, a) => s + (a.balance ?? 0), 0)
  const activeLoans   = (loansRes.data ?? []).filter((l) => ["active", "disbursed", "approved", "pending"].includes(l.status))
  const pendingFines  = (finesRes.data ?? []).filter((f) => f.status === "pending")
  const loanPortfolio = activeLoans.reduce((s, l) => s + (l.balance ?? 0), 0)

  const kpis = [
    { label: "Members",        value: memberCount,         icon: Users,       color: "text-blue-500" },
    { label: "Total Savings",  value: fmt(totalSavings),   icon: PiggyBank,   color: "text-emerald-500" },
    { label: "Loan Portfolio", value: fmt(loanPortfolio),  icon: Banknote,    color: "text-violet-500" },
    { label: "Pending Fines",  value: pendingFines.length, icon: AlertCircle, color: "text-red-500" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">{branch.name}</h1>
        <p className="text-sm text-muted-foreground">Branch overview</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border bg-card p-4">
            <Icon className={`mb-2 h-5 w-5 ${color}`} />
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-0.5 text-lg font-bold">{value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
