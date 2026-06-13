import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { LoanDetailClient } from "./loan-detail-client"

interface LoanDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function LoanDetailPage({ params }: LoanDetailPageProps) {
  const user = await getCurrentUser()
  if (!user) redirect("/auth/login")

  const { id } = await params
  return <LoanDetailClient id={id} />
}
