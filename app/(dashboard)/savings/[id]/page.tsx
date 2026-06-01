export const revalidate = 0
import { requireAuth } from "@/lib/auth"
import { SavingsDetailPageClient } from "./savings-loader"

export default async function SavingsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth()
  const { id } = await params
  return <SavingsDetailPageClient id={id} />
}
