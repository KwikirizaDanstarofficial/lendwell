import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { getActiveInterestRates } from "@/db/queries/interest-rates"
import { EditPageClient } from "./edit-page-loader"

export default async function EditLoanPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect("/auth/login")

  const { id } = await params
  const interestRates = await getActiveInterestRates(user.saccoId)
  return <EditPageClient id={id} interestRates={interestRates} />
}
