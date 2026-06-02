import { requireAuth } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase/server"
import { NewSavingsClient } from "./new-savings-client"

export default async function NewSavingsPage() {
  const user = await requireAuth()

  // Pre-fetch when online; silently fall back when offline.
  // NewSavingsClient uses PowerSync useQuery as the live data source.
  let initialMembers: any[] = []
  let initialCategories: any[] = []
  try {
    const [{ data: memberRows }, { data: catRows }] = await Promise.all([
      supabaseAdmin
        .from("members")
        .select("id, full_name, member_code, phone, status")
        .eq("sacco_id", user.saccoId)
        .order("full_name"),
      supabaseAdmin
        .from("savings_categories")
        .select("id, name, description, interest_rate, is_fixed, is_active")
        .eq("sacco_id", user.saccoId)
        .eq("is_active", true),
    ])
    initialMembers = memberRows ?? []
    initialCategories = catRows ?? []
  } catch {
    // Offline — client will load from local PowerSync SQLite
  }

  return (
    <NewSavingsClient
      saccoId={user.saccoId}
      initialMembers={initialMembers}
      initialCategories={initialCategories}
    />
  )
}
