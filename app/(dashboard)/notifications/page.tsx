export const revalidate = 0
import { requireAuth } from "@/lib/auth"
import { NotificationsClient } from "./notifications-loader"

export default async function NotificationsPage() {
  const user = await requireAuth()
  return <NotificationsClient saccoId={user.saccoId} saccoName="" saccoColor="#16a34a" />
}
