import { redirect } from "next/navigation"
import { getPagePermissions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase/server"
import { UsersClient } from "./components/users-client"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Users — SACCO Manager" }

export default async function UsersPage() {
  const { role, user, canManageUsers } = await getPagePermissions()

  if (role === "field_agent" || !user) redirect("/dashboard")

  const { data } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })

  const formattedUsers = (data?.users ?? [])
    .filter((u) => u.user_metadata?.sacco_id === user.saccoId)
    .map((u) => ({
      id: u.id,
      saccoId: u.user_metadata?.sacco_id ?? "",
      fullName: (u.user_metadata?.full_name ?? u.email ?? "") as string,
      email: u.email ?? "",
      phone: (u.user_metadata?.phone ?? null) as string | null,
      role: (u.user_metadata?.role ?? "cashier") as "admin" | "cashier" | "field_agent",
      isActive: !u.banned_until || new Date(u.banned_until) < new Date(),
      mustChangePassword: (u.user_metadata?.must_change_password ?? false) as boolean,
      lastLoginAt: u.last_sign_in_at ? new Date(u.last_sign_in_at) : null,
      notes: (u.user_metadata?.notes ?? null) as string | null,
      createdBy: (u.user_metadata?.created_by ?? null) as string | null,
      createdAt: new Date(u.created_at),
      updatedAt: new Date(u.updated_at ?? u.created_at),
    }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  return (
    <UsersClient
      users={formattedUsers}
      currentUser={user}
      canManageUsers={canManageUsers}
    />
  )
}
