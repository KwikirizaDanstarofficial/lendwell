import { requireAuth } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase/server"
import { RecycleBinClient } from "./recycle-bin-client"

export default async function RecycleBinPage() {
  const user = await requireAuth()

  const [membersRes, loansRes, finesRes] = await Promise.all([
    supabaseAdmin
      .from("members")
      .select("id, full_name, member_code, phone, status, deleted_at")
      .eq("sacco_id", user.saccoId)
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false }),
    supabaseAdmin
      .from("loans")
      .select("id, loan_ref, amount, balance, status, deleted_at, members:member_id(full_name, member_code)")
      .eq("sacco_id", user.saccoId)
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false }),
    supabaseAdmin
      .from("fines")
      .select("id, fine_ref, amount, reason, status, deleted_at, members:member_id(full_name, member_code)")
      .eq("sacco_id", user.saccoId)
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false }),
  ])

  return (
    <RecycleBinClient
      isAdmin={user.role === "admin"}
      members={(membersRes.data ?? []).map((m) => ({
        id: m.id,
        ref: m.member_code,
        name: m.full_name,
        sub: m.phone ?? m.status,
        deletedAt: m.deleted_at!,
        table: "members" as const,
      }))}
      loans={(loansRes.data ?? []).map((l: any) => ({
        id: l.id,
        ref: l.loan_ref,
        name: l.members?.full_name ?? "Unknown",
        sub: `${l.members?.member_code ?? ""} · UGX ${l.amount?.toLocaleString()}`,
        deletedAt: l.deleted_at!,
        table: "loans" as const,
      }))}
      fines={(finesRes.data ?? []).map((f: any) => ({
        id: f.id,
        ref: f.fine_ref ?? f.id,
        name: f.members?.full_name ?? "Unknown",
        sub: f.reason ?? "",
        deletedAt: f.deleted_at!,
        table: "fines" as const,
      }))}
    />
  )
}
