import { cache } from "react"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export type UserRole = "admin" | "cashier" | "field_agent" | "branch_admin" | "member"

export interface SessionData {
  userId: string
  saccoId: string
  role: UserRole
  branchId: string | null
  branchCode?: string | null
  fullName: string
  email: string
  isLoggedIn: boolean
  hasTempPassword: boolean
  memberCode?: string | null
}

export const getCurrentUser = cache(async (): Promise<SessionData | null> => {
  try {
    const supabase = await createSupabaseServerClient()

    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      if ((error as any).code === 'refresh_token_not_found' || error.message?.includes('Refresh Token')) {
        const { error: signOutError } = await supabase.auth.signOut()
        if (signOutError) console.error("[AUTH] signOut after stale token failed:", signOutError)
      }
      return null
    }

    if (!user) return null

    const meta = user.user_metadata
    const VALID_ROLES: UserRole[] = ["admin", "cashier", "field_agent", "branch_admin", "member"]
    if (!meta?.role || !VALID_ROLES.includes(meta.role)) return null

    return {
      userId: user.id,
      saccoId: meta.sacco_id ?? "",
      role: meta.role as UserRole,
      branchId: meta.branch_id ?? null,
      branchCode: meta.branch_code ?? null,
      fullName: meta.full_name ?? user.email ?? "",
      email: user.email ?? "",
      isLoggedIn: true,
      hasTempPassword: meta.has_temp_password === true,
      memberCode: meta.member_code ?? null,
    }
  } catch {
    return null
  }
})

export async function requireAuth(): Promise<SessionData> {
  const { redirect } = await import("next/navigation")
  const user = await getCurrentUser()
  if (!user) redirect("/auth/login")
  if (user!.role === "member") redirect("/portal")
  if (!(user as SessionData).saccoId) redirect("/onboarding")
  return user as SessionData
}

export async function requireMember(): Promise<SessionData> {
  const { redirect } = await import("next/navigation")
  const user = await getCurrentUser()
  if (!user) redirect("/auth/login")
  if (user!.role !== "member") redirect("/dashboard")
  return user as SessionData
}

export async function requireRole(...roles: UserRole[]): Promise<SessionData> {
  const user = await requireAuth()
  if (!roles.includes(user.role)) {
    const { redirect } = await import("next/navigation")
    redirect("/dashboard")
  }
  return user
}

export type Permission =
  | "view"
  | "add"
  | "edit"
  | "delete"
  | "manage_users"
  | "manage_settings"
  | "create_field_agents"
  | "manage_branch"

const PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    "view", "add", "edit", "delete",
    "manage_users", "manage_settings", "create_field_agents", "manage_branch",
  ],
  cashier: ["view", "add", "create_field_agents"],
  branch_admin: ["view", "add", "edit", "manage_branch", "create_field_agents"],
  field_agent: ["view", "add"],
  member: ["view"],
}

export function getPermissionsForRole(role: string): Permission[] {
  return PERMISSIONS[role as UserRole] ?? []
}

export async function getPagePermissions() {
  const user = await getCurrentUser()
  if (!user) {
    return {
      canView: false, canAdd: false, canEdit: false, canDelete: false,
      canManageUsers: false, canManageSettings: false, canCreateFieldAgents: false,
      canManageBranch: false, role: null as string | null, user: null,
    }
  }
  const perms = PERMISSIONS[user.role] ?? []
  return {
    canView: perms.includes("view"),
    canAdd: perms.includes("add"),
    canEdit: perms.includes("edit"),
    canDelete: perms.includes("delete"),
    canManageUsers: perms.includes("manage_users"),
    canManageSettings: perms.includes("manage_settings"),
    canCreateFieldAgents: perms.includes("create_field_agents"),
    canManageBranch: perms.includes("manage_branch"),
    role: user.role,
    user,
  }
}
