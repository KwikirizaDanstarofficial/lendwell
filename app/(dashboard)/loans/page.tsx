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
    if (["disbursed", "active", "settled"].includes(loan.status)) {
      totalDisbursed += loan.amount
    }
    if (["disbursed", "active"].includes(loan.status)) {
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
