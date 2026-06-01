export const revalidate = 0
import { redirect } from "next/navigation"
import { getPagePermissions } from "@/lib/auth"
import { UsersClient } from "./users-loader"

export const metadata = { title: "Users — Lendwell" }

export default async function UsersPage() {
  const { role, user, canManageUsers } = await getPagePermissions()
  if (role === "field_agent" || !user) redirect("/dashboard")
  const currentUser = {
    userId: user!.userId,
    role: user!.role,
    fullName: user!.fullName,
    saccoId: user!.saccoId,
    email: user!.email,
    isLoggedIn: true,
    branchId: user!.branchId ?? null,
  }
  return (
    <UsersClient
      saccoId={user!.saccoId}
      currentUser={currentUser}
      canManageUsers={!!canManageUsers}
      users={[]}
      branches={[]}
    />
  )
}
