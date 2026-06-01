export const revalidate = 0
import { requireAuth } from "@/lib/auth"
import { MemberPageClient } from "./member-page-loader"

export default async function MemberPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth()
  const { id } = await params
  return <MemberPageClient id={id} />
}
