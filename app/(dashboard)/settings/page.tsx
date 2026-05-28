import { getSaccoSettings } from "@/db/queries/settings"
import { requireAuth } from "@/lib/auth"
import { getBranches } from "@/db/queries/branches"
import { supabaseAdmin } from "@/lib/supabase/server"
import { SettingsClient } from "./components/settings-client"

export default async function SettingsPage() {
  const user = await requireAuth()

  const [sacco, branches, staffRes] = await Promise.all([
    getSaccoSettings(user.saccoId),
    getBranches(user.saccoId),
    supabaseAdmin
      .from("sacco_users")
      .select("id, full_name, role")
      .eq("sacco_id", user.saccoId)
      .eq("is_active", true)
      .order("full_name"),
  ])

  const staff = (staffRes.data ?? []).map((s) => ({
    id: s.id,
    fullName: s.full_name,
    role: s.role,
  }))

  return (
    <SettingsClient
      sacco={sacco}
      branches={branches}
      staff={staff}
      isFirstLogin={user.hasTempPassword}
    />
  )
}
