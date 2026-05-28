import { requireAuth } from "@/lib/auth"
import { getActivityLogs } from "@/db/queries/activity-logs"
import { LogsClient } from "./logs-client"

export default async function LogsPage() {
  const user = await requireAuth()
  const logs = await getActivityLogs(user.saccoId, 500)
  return <LogsClient logs={logs} />
}
