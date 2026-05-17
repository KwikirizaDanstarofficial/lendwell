import { requireAuth } from "@/lib/auth"
import { getAllFines, getFinesStats } from "@/db/queries/fines"
import { getMembersForSelect } from "@/db/queries/members"
import { getFineCategories } from "@/db/queries/settings"
import { FinesClient } from "./components/fines-client"

export const revalidate = 60

export default async function FinesPage() {
  const user = await requireAuth()
  const [allFines, stats, allMembers, categories] = await Promise.all([
    getAllFines(user.saccoId),
    getFinesStats(user.saccoId),
    getMembersForSelect(user.saccoId),
    getFineCategories(user.saccoId),
  ])

  return (
    <FinesClient
      fines={allFines}
      stats={stats}
      members={allMembers}
      categories={categories}
    />
  )
}
