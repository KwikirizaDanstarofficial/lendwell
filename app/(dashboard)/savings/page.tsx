import { requireAuth } from "@/lib/auth"
import {
  getAllSavingsAccounts,
  getSavingsStats,
  getMembersForSavings,
  getSavingsCategoriesForSelect,
} from "@/db/queries/savings"
import { supabaseAdmin } from "@/lib/supabase/server"
import { SavingsClient } from "./components/savings-client"

export const revalidate = 60

export default async function SavingsPage() {
  const user = await requireAuth()
  const supabase = supabaseAdmin
  const [accounts, stats, membersForSelect, categories, activeLoans] =
    await Promise.all([
      getAllSavingsAccounts(user.saccoId).catch(() => []),
      getSavingsStats(user.saccoId).catch(() => ({
        totalBalance: 0,
        totalAccounts: 0,
        lockedAccounts: 0,
        regularAccounts: 0,
        fixedAccounts: 0,
        avgBalance: 0,
      })),
      getMembersForSavings(user.saccoId).catch(() => []),
      getSavingsCategoriesForSelect(user.saccoId).catch(() => []),
      supabase
        .from('loans')
        .select('id, loan_ref, balance, member_id')
        .eq('sacco_id', user.saccoId)
        .eq('status', 'active')
        .then(({ data }) => data ?? []),
    ])

  return (
    <SavingsClient
      accounts={accounts ?? []}
      stats={
        stats ?? {
          totalBalance: 0,
          totalAccounts: 0,
          lockedAccounts: 0,
          regularAccounts: 0,
          fixedAccounts: 0,
          avgBalance: 0,
        }
      }
      members={membersForSelect ?? []}
      categories={categories ?? []}
      activeLoans={activeLoans ?? []}
    />
  )
}
