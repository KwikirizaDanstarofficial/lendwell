import { requireAuth } from "@/lib/auth"
import { getAllNotifications } from "@/db/queries/notifications"
import { getMembersForSelect } from "@/db/queries/members"
import { getSaccoSettings } from "@/db/queries/settings"
import { NotificationsClient } from "./components/notifications-client"

export default async function NotificationsPage() {
  const user = await requireAuth()
  const [allNotifications, allMembers, sacco] = await Promise.all([
    getAllNotifications(user.saccoId).catch(() => []),
    getMembersForSelect(user.saccoId).catch(() => []),
    getSaccoSettings(user.saccoId).catch(() => null),
  ])

  return (
    <NotificationsClient
      notifications={allNotifications ?? []}
      members={allMembers ?? []}
      saccoName={sacco?.name ?? "SACCO"}
      saccoColor={sacco?.primaryColor ?? "#16a34a"}
    />
  )
}
