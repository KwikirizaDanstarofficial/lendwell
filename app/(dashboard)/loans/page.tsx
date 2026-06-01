export const revalidate = 0

import { requireAuth } from "@/lib/auth"
import { LoansClient } from "./loans-loader"

export default async function LoansPage() {
  const user = await requireAuth()
  return (
    <div className="space-y-6">
      <LoansClient saccoId={user.saccoId} />
    </div>
  )
}

// ─── Appendix ─────────────────────────────────────────────────────────────────
//
// PAGE:  /loans
//
// DATA FETCHED (parallel):
//   getAllLoans(saccoId)            – full loan list with member info
//   getActiveInterestRates(saccoId) – active rate tiers for the new-loan form
//
// STATS COMPUTED:
//   totalDisbursed    – sum of amounts for disbursed/active/settled loans
//   outstandingBalance – sum of balances for disbursed/active loans
//   activeLoans, pendingLoans, settledLoans – status counts
//
// CLIENT COMPONENT:  LoansClient
