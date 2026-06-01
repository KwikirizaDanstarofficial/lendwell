export const revalidate = 0
import { requireAuth } from "@/lib/auth"
import { SettingsClient } from "./settings-loader"

export default async function SettingsPage() {
  const user = await requireAuth()
  return <SettingsClient saccoId={user.saccoId} isFirstLogin={user.hasTempPassword} />
}
