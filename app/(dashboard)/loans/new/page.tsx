export const revalidate = 0
import { requireAuth } from "@/lib/auth"
import { NewLoanForm } from "./new-loan-loader"

export default async function NewLoanPage() {
  const user = await requireAuth()
  return (
    <div className="mx-auto max-w-2xl py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">New Loan Application</h1>
        <p className="mt-2 text-muted-foreground">Fill in the details below to submit a new loan application.</p>
      </div>
      <NewLoanForm saccoId={user.saccoId} members={[]} interestRates={[]} />
    </div>
  )
}
