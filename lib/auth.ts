import { createSupabaseServerClient } from "@/lib/supabase/server"

export interface SessionData {
  userId: string
  saccoId: string
  role: "admin" | "cashier" | "field_agent"
  fullName: string
  email: string
  isLoggedIn: boolean
}

export async function getCurrentUser(): Promise<SessionData | null> {
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
    const VALID_ROLES = ["admin", "cashier", "field_agent"] as const
    if (!meta?.role || !VALID_ROLES.includes(meta.role)) return null

    return {
      userId: user.id,
      saccoId: meta.sacco_id ?? "",
      role: meta.role as "admin" | "cashier" | "field_agent",
      fullName: meta.full_name ?? user.email ?? "",
      email: user.email ?? "",
      isLoggedIn: true,
    }
  } catch {
    return null
  }
}

export async function requireAuth(): Promise<SessionData> {
  const { redirect } = await import("next/navigation")
  const user = await getCurrentUser()
  if (!user) redirect("/auth/login")
  if (!(user as SessionData).saccoId) redirect("/onboarding")
  return user as SessionData
}

export async function requireRole(
  ...roles: Array<"admin" | "cashier" | "field_agent">
): Promise<SessionData> {
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

const PERMISSIONS: Record<string, Permission[]> = {
  admin: [
    "view",
    "add",
    "edit",
    "delete",
    "manage_users",
    "manage_settings",
    "create_field_agents",
  ],
  cashier: ["view", "add", "create_field_agents"],
  field_agent: ["view", "add"],
}

export function getPermissionsForRole(role: string): Permission[] {
  return PERMISSIONS[role] ?? []
}

export async function getPagePermissions() {
  const user = await getCurrentUser()
  if (!user) {
    return {
      canView: false,
      canAdd: false,
      canEdit: false,
      canDelete: false,
      canManageUsers: false,
      canManageSettings: false,
      canCreateFieldAgents: false,
      role: null as string | null,
      user: null,
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
    role: user.role,
    user,
  }
}
