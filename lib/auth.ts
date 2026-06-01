/**
 * auth.ts
 *
 * Authentication and authorisation utilities for the SACCO application.
 * Provides server-side helpers to retrieve the current user session,
 * enforce authentication and role-based access, and resolve UI permissions
 * for each role.  Built on top of Supabase Auth and React's `cache()` so
 * the session is fetched at most once per server-render pass.
 */

import { cache } from "react"
import type { User } from "@supabase/supabase-js"
import { createSupabaseServerClient } from "@/lib/supabase/server"

// ─── Constants ────────────────────────────────────────────────────────────────

/** All recognised user roles. Used to reject tokens with unknown role values. */
export const VALID_ROLES = [
  "admin", "cashier", "field_agent", "branch_admin", "member",
] as const

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole = (typeof VALID_ROLES)[number]

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

/**
 * Retrieve the currently logged-in user's session from Supabase Auth.
 * Uses `React.cache` so the result is shared across all components calling
 * this function during the same server-render.
 *
 * @returns The session data (`SessionData`) or `null` when the user is not
 *          authenticated, the token is stale, or the user metadata lacks a
 *          valid role.
 */
export const getCurrentUser = cache(async (): Promise<SessionData | null> => {
  try {
    const supabase = await createSupabaseServerClient()

    const { data: { user }, error } = await supabase.auth.getUser()

    if (!error) return buildSessionData(user)

    // error.status is set on HTTP-level auth failures (401/403/422).
    // No status means a network/fetch error (offline) — fall back to the
    // locally cached session so the app keeps working without connectivity.
    if (error.status) {
      if ((error as any).code === 'refresh_token_not_found' || error.message?.includes('Refresh Token')) {
        await supabase.auth.signOut().catch(() => {})
      }
      return null
    }

    // Offline fallback: parse the JWT from the cookie without a network call.
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return null
    // Reject genuinely expired tokens even while offline.
    if (session.expires_at && session.expires_at * 1000 < Date.now()) return null

    return buildSessionData(session.user)
  } catch {
    return null
  }
})

function buildSessionData(user: User | null): SessionData | null {
  if (!user) return null
  const meta = user.user_metadata
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
}

/**
 * Guard that redirects unauthenticated users to the login page.
 * Also redirects members away from admin routes (to `/portal`) and
 * forces users without a `saccoId` to the onboarding flow.
 *
 * @returns The validated `SessionData`.
 * @throws (via Next.js `redirect`) when the user is not logged in, is a
 *          member, or has not completed onboarding.
 */
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

/**
 * Guard that checks the current user's role against a list of permitted roles.
 * Calls `requireAuth` internally, so unauthenticated requests are redirected
 * to login first.
 *
 * @param roles - One or more `UserRole` values that are allowed access.
 * @returns The validated `SessionData`.
 * @throws Redirects to `/dashboard` when the user's role is not in the list.
 */
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

/**
 * Return the list of `Permission` values assigned to a given role.
 *
 * @param role - The role name (e.g. `"admin"`, `"cashier"`).
 * @returns An array of `Permission` strings.  Unknown roles get an empty list.
 */
export function getPermissionsForRole(role: string): Permission[] {
  return PERMISSIONS[role as UserRole] ?? []
}

// ─── Appendix ─────────────────────────────────────────────────────────────────
//
// EXPORTED FUNCTIONS:
//   getCurrentUser()                 – cached session fetch; returns SessionData | null
//   requireAuth()                    – redirects to /auth/login if not authenticated
//   requireMember()                  – redirects to /dashboard if not a member role
//   requireRole(...roles)            – redirects to /dashboard if role not permitted
//   getPermissionsForRole(role)      – returns Permission[] for a given role string
//   getPagePermissions()             – returns flat boolean permission flags + user
//
// EXPORTED TYPES / CONSTANTS:
//   UserRole        – "admin" | "cashier" | "field_agent" | "branch_admin" | "member"
//   VALID_ROLES     – readonly array of all valid role strings
//   SessionData     – shape of the currently authenticated user's session
//   Permission      – union of all permission strings
//   PERMISSIONS     – Record<UserRole, Permission[]> mapping
//
// RELATED FILES:
//   lib/supabase/server.ts              – provides createSupabaseServerClient
//   app/(dashboard)/loans/actions.ts    – calls getCurrentUser for auth checks
//   app/(dashboard)/members/actions.ts  – calls getCurrentUser and requireRole

/**
 * Convenience helper for page-level authorisation.  Fetches the current user
 * and resolves a flat set of boolean permission flags together with the user's
 * role and the full session object.
 *
 * @returns An object with `canView`, `canAdd`, `canEdit`, `canDelete`,
 *          `canManageUsers`, `canManageSettings`, `canCreateFieldAgents`,
 *          `canManageBranch`, `role`, and `user`.  When no user is logged in
 *          every flag is `false` and `role` is `null`.
 */
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
