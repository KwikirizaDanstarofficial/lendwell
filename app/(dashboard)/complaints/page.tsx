export const revalidate = 0
import { requireAuth } from "@/lib/auth"
import { ComplaintsClient } from "./complaints-loader"

export default async function ComplaintsPage() {
  const user = await requireAuth()
  return <ComplaintsClient saccoId={user.saccoId} />
}
