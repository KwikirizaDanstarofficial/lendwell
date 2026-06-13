// app/(dashboard)/loans/page.tsx
// Server page for /loans. Fetches all loans + active interest rates,
// computes summary stats, and renders the LoansClient shell.

// ─── Constants ────────────────────────────────────────────────────────────────

/** ISR revalidation interval for the loans page. */
const REVALIDATE_SECONDS = 60

/** Loan statuses that count toward the total disbursed amount. */
const DISBURSED_STATUSES = ["disbursed", "active", "settled"] as const

/** Loan statuses that count toward the outstanding balance. */
const OUTSTANDING_STATUSES = ["disbursed", "active"] as const

import { requireAuth } from "@/lib/auth"
import { getAllLoans } from "@/db/queries/loans"
import { getActiveInterestRates } from "@/db/queries/interest-rates"
import { LoansClient } from "./components/loans-client"

export const revalidate = 60

export default async function LoansPage() {
  const user = await requireAuth()
  const [loans, interestRates] = await Promise.all([
    getAllLoans(user.saccoId),
    getActiveInterestRates(user.saccoId),
  ])

  let totalDisbursed = 0
  let outstandingBalance = 0
  let activeLoans = 0
  let pendingLoans = 0
  let settledLoans = 0

  for (const loan of loans) {
    if ((DISBURSED_STATUSES as readonly string[]).includes(loan.status)) {
      totalDisbursed += loan.amount
    }
    if ((OUTSTANDING_STATUSES as readonly string[]).includes(loan.status)) {
      outstandingBalance += loan.balance
    }
    if (loan.status === "active") activeLoans++
    if (loan.status === "pending") pendingLoans++
    if (loan.status === "settled") settledLoans++
  }

  const stats = {
    totalDisbursed,
    totalLoans: loans.length,
    activeLoans,
    pendingLoans,
    settledLoans,
    outstandingBalance,
  }

  return (
    <div className="space-y-6">
      <LoansClient
        loans={loans}
        members={[]}
        stats={stats}
        interestRates={interestRates}
      />
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
