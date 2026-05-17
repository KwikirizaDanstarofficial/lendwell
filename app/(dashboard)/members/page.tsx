import { requireAuth } from "@/lib/auth"
import { getAllMembers } from "@/db/queries/members"
import { MembersClient } from "./components/members-client"

export const revalidate = 300

export default async function MembersPage() {
  const user = await requireAuth()
  const members = await getAllMembers(user.saccoId)
  return <MembersClient members={members} />
}
