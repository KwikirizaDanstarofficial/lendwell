export const revalidate = 0
import { requireAuth } from "@/lib/auth"
import { EditPageClient } from "./edit-page-loader"

export default async function EditMemberPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth()
  const { id } = await params
  return <EditPageClient id={id} />
}
