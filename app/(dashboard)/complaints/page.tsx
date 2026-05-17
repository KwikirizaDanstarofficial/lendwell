import { requireAuth } from "@/lib/auth"
import { getAllComplaints } from "@/db/queries/complaints"
import { getMembersForSelect } from "@/db/queries/members"
import { supabaseAdmin } from "@/lib/supabase/server"
import { ComplaintsClient } from "./components/complaints-client"

type MemberSelect = {
  id: string
  full_name: string
  member_code: string
  phone: string | null
}

export const revalidate = 60

export default async function ComplaintsPage() {
  const user = await requireAuth()
  const [allComplaints, allMembers] = await Promise.all([
    getAllComplaints(user.saccoId),
    getMembersForSelect(user.saccoId),
  ])

  const supabase = supabaseAdmin

  const { data: stats } = await supabase
    .from('complaints')
    .select('status')
    .eq('sacco_id', user.saccoId)

  const openCount = stats?.filter(c => c.status === 'open').length ?? 0
  const inProgressCount = stats?.filter(c => c.status === 'in_progress').length ?? 0
  const resolvedCount = stats?.filter(c => c.status === 'resolved').length ?? 0

  return (
    <ComplaintsClient
      complaints={allComplaints}
      members={allMembers}
      stats={{
        total: allComplaints.length,
        open: openCount,
        inProgress: inProgressCount,
        resolved: resolvedCount,
      }}
    />
  )
}
