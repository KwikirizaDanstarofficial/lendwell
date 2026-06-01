export const revalidate = 0

import { requireAuth } from "@/lib/auth"
import { DashboardClient } from "./dashboard-loader"

export default async function DashboardPage() {
  const user = await requireAuth()
  return <DashboardClient saccoId={user.saccoId} userName={user.fullName.split(" ")[0]} />
}
