export const revalidate = 0

import { requireAuth } from "@/lib/auth"
import { SavingsClient } from "./savings-loader"

export default async function SavingsPage() {
  const user = await requireAuth()
  return <SavingsClient saccoId={user.saccoId} />
}

// ─── Appendix ─────────────────────────────────────────────────────────────────
//
// PAGE:  /savings  (revalidates every 60 s)
//
// DATA FETCHED (parallel):
//   getAllSavingsAccounts  – full account list
//   getSavingsStats        – aggregate totals
//   getMembersForSavings   – member list for the create-account form
//   getSavingsCategoriesForSelect – category options
//   loans (active only)    – used to compute loanable amounts on accounts
//
// CLIENT COMPONENT:  SavingsClient
