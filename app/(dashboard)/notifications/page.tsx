import { requireAuth } from "@/lib/auth"
import { getAllNotifications } from "@/db/queries/notifications"
import { getMembersForSelect } from "@/db/queries/members"
import { NotificationsClient } from "./components/notifications-client"

export default async function NotificationsPage() {
  const user = await requireAuth()
  const [allNotifications, allMembers] = await Promise.all([
    getAllNotifications(user.saccoId).catch(() => []),
    getMembersForSelect(user.saccoId).catch(() => []),
  ])

  return (
    <NotificationsClient
      notifications={allNotifications ?? []}
      members={allMembers ?? []}
    />
  )
}
