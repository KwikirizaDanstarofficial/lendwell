// app/(dashboard)/members/page.tsx
// Server page for /members. Fetches all active members and renders the MembersClient shell.

export const revalidate = 0

import { requireAuth } from "@/lib/auth"
import { MembersClient } from "./members-loader"

export default async function MembersPage() {
  const user = await requireAuth()
  return <MembersClient saccoId={user.saccoId} />
}

// ─── Appendix ─────────────────────────────────────────────────────────────────
//
// PAGE:  /members  (revalidates every 300 s)
// DATA:  getAllMembers(saccoId)
// CLIENT COMPONENT:  MembersClient
