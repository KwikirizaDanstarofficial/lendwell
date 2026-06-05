import { isOfflineError } from "@/lib/offline-safe"
/**
 * db/queries/guarantors.ts
 *
 * Guarantor management queries for the SACCO application.
 * All operations use the Supabase admin client (service-role key, RLS bypassed).
 * Guarantors are soft-deleted via `deleted_at` to preserve the audit trail.
 */

import { supabaseAdmin } from "@/lib/supabase/server"

// ─── Constants ────────────────────────────────────────────────────────────────

/** All valid values for the guarantor `status` column. */
export const GUARANTOR_STATUS = {
  PENDING:  "pending",
  ACCEPTED: "accepted",
  DECLINED: "declined",
} as const

export type GuarantorStatus = (typeof GUARANTOR_STATUS)[keyof typeof GUARANTOR_STATUS]

/** Columns selected when fetching guarantors for a loan. */
const GUARANTOR_SELECT_COLUMNS = `
  id, loan_id, member_id, status, notes, created_at, updated_at,
  members!loan_guarantors_member_id_fkey (
    id, full_name, member_code, phone, photo_url
  )
`

// ─── Query functions ──────────────────────────────────────────────────────────

/**
 * Fetch all active (non-deleted) guarantors for a given loan,
 * including their member profile details.
 * Results are ordered by creation time (oldest first).
 *
 * @param loanId - UUID of the loan whose guarantors to retrieve.
 * @returns Array of guarantor rows with embedded member data.
 * @throws If the database query fails.
 */
export async function getGuarantorsByLoan(loanId: string) {
  const { data, error } = await supabaseAdmin
    .from("loan_guarantors")
    .select(GUARANTOR_SELECT_COLUMNS)
    .eq("loan_id", loanId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })

  if (error) { if (isOfflineError(error)) return []; throw new Error(`Failed to fetch guarantors: ${error?.message}`) }
  return data ?? []
}

/**
 * Add a member as a guarantor on a loan.
 * Performs a duplicate check — a member cannot be listed twice on the same loan.
 *
 * @param payload - loanId, saccoId, memberId, and optional notes.
 * @returns The newly created guarantor row.
 * @throws If the member is already a guarantor or the insert fails.
 */
export async function addGuarantor(payload: {
  loanId:   string
  saccoId:  string
  memberId: string
  notes?:   string
}) {
  // Prevent duplicate guarantor entries for the same loan + member pair
  const { data: existingGuarantor } = await supabaseAdmin
    .from("loan_guarantors")
    .select("id")
    .eq("loan_id",   payload.loanId)
    .eq("member_id", payload.memberId)
    .is("deleted_at", null)
    .maybeSingle()

  if (existingGuarantor) {
    throw new Error("This member is already a guarantor for this loan")
  }

  const { data, error } = await supabaseAdmin
    .from("loan_guarantors")
    .insert({
      loan_id:   payload.loanId,
      sacco_id:  payload.saccoId,
      member_id: payload.memberId,
      notes:     payload.notes ?? null,
      status:    GUARANTOR_STATUS.PENDING,
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to add guarantor: ${error.message}`)
  return data
}

/**
 * Soft-delete a guarantor by setting `deleted_at` to now.
 * The row is preserved for audit history and can be restored if needed.
 *
 * @param guarantorId - UUID of the loan_guarantors row to remove.
 * @throws If the database update fails.
 */
export async function removeGuarantor(guarantorId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("loan_guarantors")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", guarantorId)

  if (error) throw new Error(`Failed to remove guarantor: ${error.message}`)
}

/**
 * Update the status of a guarantor (pending / accepted / declined).
 * Optionally records notes from the guarantor alongside the status change.
 *
 * @param guarantorId - UUID of the loan_guarantors row to update.
 * @param status      - New status value.
 * @param notes       - Optional notes from the guarantor.
 * @throws If the database update fails.
 */
export async function updateGuarantorStatus(
  guarantorId: string,
  status:      GuarantorStatus,
  notes?:      string
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("loan_guarantors")
    .update({ status, notes: notes ?? null })
    .eq("id", guarantorId)

  if (error) throw new Error(`Failed to update guarantor status: ${error.message}`)
}

// ─── Appendix ─────────────────────────────────────────────────────────────────
//
// EXPORTED FUNCTIONS:
//   getGuarantorsByLoan(loanId)                     – list guarantors for a loan
//   addGuarantor(payload)                           – add a member as guarantor
//   removeGuarantor(guarantorId)                    – soft-delete a guarantor
//   updateGuarantorStatus(id, status, notes?)       – change guarantor status
//
// EXPORTED CONSTANTS / TYPES:
//   GUARANTOR_STATUS   – { PENDING: "pending", ACCEPTED: "accepted", DECLINED: "declined" }
//   GuarantorStatus    – union type of GUARANTOR_STATUS values
//
// DATABASE TABLE:
//   loan_guarantors — columns: id, loan_id, sacco_id, member_id, status,
//                               notes, deleted_at, created_at, updated_at
//
// RELATED FILES:
//   lib/supabase/server.ts              – provides supabaseAdmin
//   app/(dashboard)/loans/actions.ts    – calls addGuarantor during loan creation
