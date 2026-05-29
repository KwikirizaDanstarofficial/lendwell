// app/(dashboard)/members/page.tsx
// Server page for /members. Fetches all active members and renders the MembersClient shell.

/** ISR revalidation interval — members change less often than transactions. */
export const revalidate = 300

import { requireAuth } from "@/lib/auth"
import { getAllMembers } from "@/db/queries/members"
import { MembersClient } from "./components/members-client"

export default async function MembersPage() {
  const user = await requireAuth()
  const members = await getAllMembers(user.saccoId)
  return <MembersClient members={members} />
}

// ─── Appendix ─────────────────────────────────────────────────────────────────
//
// PAGE:  /members  (revalidates every 300 s)
// DATA:  getAllMembers(saccoId)
// CLIENT COMPONENT:  MembersClient
