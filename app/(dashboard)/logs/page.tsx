export const revalidate = 0
import { requireAuth } from "@/lib/auth"
import { LogsClient } from "./logs-loader"

export default async function LogsPage() {
  const user = await requireAuth()
  return <LogsClient saccoId={user.saccoId} />
}
