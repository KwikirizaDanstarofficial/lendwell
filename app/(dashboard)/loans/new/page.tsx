// app/(dashboard)/loans/new/page.tsx
import { getCurrentUser } from "@/lib/auth"
import { getMembersForSelect } from "@/db/queries/members"
import { getActiveInterestRates } from "@/db/queries/interest-rates"
import { NewLoanForm } from "./new-loan-form"

export default async function NewLoanPage() {
  const user = await getCurrentUser()
  if (!user) {
    const { redirect } = await import("next/navigation")
    redirect("/auth/login")
  }
  const saccoId = user!.saccoId
  const members = await getMembersForSelect(saccoId)
  const interestRates = await getActiveInterestRates(saccoId)

  return (
    <div className="mx-auto max-w-2xl py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          New Loan Application
        </h1>
        <p className="mt-2 text-muted-foreground">
          Fill in the details below to submit a new loan application. Interest
          rates will be automatically applied based on the loan amount.
        </p>
      </div>
      <NewLoanForm members={members} interestRates={interestRates} />
    </div>
  )
}
