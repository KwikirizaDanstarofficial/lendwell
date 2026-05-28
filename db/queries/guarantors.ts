import { supabaseAdmin } from "@/lib/supabase/server"

export async function getGuarantorsByLoan(loanId: string) {
  const { data, error } = await supabaseAdmin
    .from("loan_guarantors")
    .select(`
      id, loan_id, member_id, status, notes, created_at, updated_at,
      members!loan_guarantors_member_id_fkey (
        id, full_name, member_code, phone, photo_url
      )
    `)
    .eq("loan_id", loanId)
    .order("created_at", { ascending: true })

  if (error) throw new Error(`Failed to fetch guarantors: ${error.message}`)
  return data ?? []
}

export async function addGuarantor(payload: {
  loanId: string
  saccoId: string
  memberId: string
  notes?: string
}) {
  // Prevent duplicate
  const { data: existing } = await supabaseAdmin
    .from("loan_guarantors")
    .select("id")
    .eq("loan_id", payload.loanId)
    .eq("member_id", payload.memberId)
    .single()

  if (existing) throw new Error("This member is already a guarantor for this loan")

  const { data, error } = await supabaseAdmin
    .from("loan_guarantors")
    .insert({
      loan_id:   payload.loanId,
      sacco_id:  payload.saccoId,
      member_id: payload.memberId,
      notes:     payload.notes ?? null,
      status:    "pending",
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to add guarantor: ${error.message}`)
  return data
}

export async function removeGuarantor(guarantorId: string) {
  const { error } = await supabaseAdmin
    .from("loan_guarantors")
    .delete()
    .eq("id", guarantorId)

  if (error) throw new Error(`Failed to remove guarantor: ${error.message}`)
}

export async function updateGuarantorStatus(
  guarantorId: string,
  status: "pending" | "accepted" | "declined",
  notes?: string
) {
  const { error } = await supabaseAdmin
    .from("loan_guarantors")
    .update({ status, notes: notes ?? null })
    .eq("id", guarantorId)

  if (error) throw new Error(`Failed to update guarantor: ${error.message}`)
}
