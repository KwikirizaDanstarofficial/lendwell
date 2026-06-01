export const revalidate = 0
import { requireAuth } from "@/lib/auth"
import { RecycleBinClient } from "./recyclebin-loader"

export default async function RecycleBinPage() {
  const user = await requireAuth()
  return <RecycleBinClient saccoId={user.saccoId} isAdmin={user.role === "admin"} members={[]} loans={[]} fines={[]} />
}
