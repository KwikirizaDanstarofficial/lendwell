export const revalidate = 0
import { requireAuth } from "@/lib/auth"
import { LoanDetailPage } from "./loan-page-loader"

export default async function LoanPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth()
  const { id } = await params
  return <LoanDetailPage id={id} />
}
