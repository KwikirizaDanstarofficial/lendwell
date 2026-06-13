import { getCurrentUser } from "@/lib/auth"
import { getLoanById } from "@/db/queries/loans"
import { getActiveInterestRates } from "@/db/queries/interest-rates"
import { getMembersForSelect } from "@/db/queries/members"
import { notFound, redirect } from "next/navigation"
import { EditLoanForm } from "./edit-loan-form"

export default async function EditLoanPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect("/auth/login")

  const { id } = await params
  const loan = await getLoanById(id, user.saccoId)
  if (!loan) notFound()

  if (["declined", "settled", "defaulted"].includes(loan.status)) {
    redirect(`/loans/${id}`)
  }

  const members = await getMembersForSelect(user.saccoId)
  const member = members.find((m) => m.id === loan.memberId)

  const interestRates = await getActiveInterestRates(user.saccoId)

  const loanWithMember = {
    id: loan.id,
    loanRef: loan.loanRef,
    amount: loan.amount,
    balance: loan.balance,
    durationMonths: loan.durationMonths,
    dueDate: loan.dueDate instanceof Date ? loan.dueDate.toISOString().slice(0, 10) : null,
    notes: loan.notes,
    interestRate: loan.interestRate,
    interestType: loan.interestType,
    status: loan.status,
    memberName: member?.full_name ?? "Unknown",
    memberCode: member?.member_code ?? "N/A",
  }

  return (
    <div className="mx-auto max-w-2xl py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Edit Loan</h1>
        <p className="mt-2 text-muted-foreground">
          Update the loan details below. Changes will recalculate the repayment schedule.
        </p>
      </div>
      <EditLoanForm loan={loanWithMember} interestRates={interestRates} />
    </div>
  )
}
