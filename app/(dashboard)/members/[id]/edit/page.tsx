export const revalidate = 0
import { requireAuth } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase/server"
import { EditPageClient } from "./edit-page-loader"

export default async function EditMemberPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth()
  const { id } = await params

  // Attempt server-side pre-fetch; silently fall back when offline.
  // EditPageClient uses PowerSync useQuery as the live source.
  let initialMember: any = undefined
  try {
    const { data: member } = await supabaseAdmin
      .from("members")
      .select("*")
      .eq("id", id)
      .single()
    initialMember = member ?? undefined
  } catch {
    // Offline — client will load member from local PowerSync SQLite
  }

  return <EditPageClient id={id} initialMember={initialMember} />
}
