export const revalidate = 0
import { requireAuth } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase/server"
import { RecycleBinClient } from "./recyclebin-loader"

export default async function RecycleBinPage() {
  const user = await requireAuth()

  // Deleted records are not synced to local SQLite — they only exist in Supabase.
  // When offline, fetch fails silently and the client shows an empty state.
  let members: any[] = []
  let loans: any[] = []
  let fines: any[] = []
  try {
    const [{ data: deletedMembers }, { data: deletedLoans }, { data: deletedFines }] =
      await Promise.all([
        supabaseAdmin
          .from("members")
          .select("id, member_code, full_name, phone, status, deleted_at")
          .eq("sacco_id", user.saccoId)
          .not("deleted_at", "is", null)
          .order("deleted_at", { ascending: false }),
        supabaseAdmin
          .from("loans")
          .select("id, loan_ref, amount, status, deleted_at")
          .eq("sacco_id", user.saccoId)
          .not("deleted_at", "is", null)
          .order("deleted_at", { ascending: false }),
        supabaseAdmin
          .from("fines")
          .select("id, fine_ref, amount, reason, status, deleted_at")
          .eq("sacco_id", user.saccoId)
          .not("deleted_at", "is", null)
          .order("deleted_at", { ascending: false }),
      ])
    members = (deletedMembers ?? []).map((m: any) => ({
      id: m.id, ref: m.member_code, name: m.full_name,
      sub: m.phone ?? m.status, deletedAt: m.deleted_at, table: "members" as const,
    }))
    loans = (deletedLoans ?? []).map((l: any) => ({
      id: l.id, ref: l.loan_ref, name: `UGX ${(l.amount / 100).toLocaleString()}`,
      sub: l.status, deletedAt: l.deleted_at, table: "loans" as const,
    }))
    fines = (deletedFines ?? []).map((f: any) => ({
      id: f.id, ref: f.fine_ref, name: f.reason,
      sub: `UGX ${(f.amount / 100).toLocaleString()}`, deletedAt: f.deleted_at, table: "fines" as const,
    }))
  } catch {
    // Offline — client will render empty state
  }

  return (
    <RecycleBinClient
      saccoId={user.saccoId}
      isAdmin={user.role === "admin"}
      members={members}
      loans={loans}
      fines={fines}
    />
  )
}
