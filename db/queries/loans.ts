/**
 * db/queries/loans.ts
 *
 * Loan query functions for the SACCO application.
 * All functions use the Supabase admin client (service-role key, RLS bypassed)
 * and map snake_case database columns to camelCase for the frontend.
 */

import { supabaseAdmin } from "@/lib/supabase/server"

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Maximum number of loans returned per query.
 * Pagination is needed once a SACCO's loan volume exceeds this limit.
 */
const QUERY_LIMIT = 1_000

/**
 * PostgREST error code returned when a `.single()` query finds no rows.
 * Treated as a null result rather than an exception.
 */
const POSTGREST_NO_ROWS_CODE = "PGRST116"

/** Columns selected for the loans list view (excludes heavy joined relations). */
const LOAN_LIST_COLUMNS = `
  id, sacco_id, member_id, category_id, loan_ref, amount, balance,
  interest_rate, status, due_date, disbursed_at, settled_at,
  decline_reason, notes, created_at, updated_at,
  interest_rate_id, expected_received, interest_type,
  duration_months, late_penalty_fee, daily_payment, monthly_payment,
  members:member_id ( full_name, member_code, phone, national_id, address )
`

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Map a raw loans row (snake_case) to a camelCase object for the frontend. */
function mapLoanRow(row: Record<string, any>) {
  return {
    id:               row.id,
    saccoId:          row.sacco_id,
    memberId:         row.member_id,
    categoryId:       row.category_id,
    loanRef:          row.loan_ref,
    amount:           row.amount,
    balance:          row.balance,
    interestRate:     row.interest_rate,
    status:           row.status,
    dueDate:          row.due_date       ? new Date(row.due_date)       : null,
    disbursedAt:      row.disbursed_at   ? new Date(row.disbursed_at)   : null,
    settledAt:        row.settled_at     ? new Date(row.settled_at)     : null,
    declineReason:    row.decline_reason,
    notes:            row.notes,
    createdAt:        new Date(row.created_at),
    updatedAt:        new Date(row.updated_at),
    interestRateId:   row.interest_rate_id,
    expectedReceived: row.expected_received,
    interestType:     row.interest_type,
    durationMonths:   row.duration_months,
    latePenaltyFee:   row.late_penalty_fee,
    dailyPayment:     row.daily_payment,
    monthlyPayment:   row.monthly_payment,
  }
}

// ─── Query functions ──────────────────────────────────────────────────────────

/**
 * Fetch all non-deleted loans for a SACCO, including related member info.
 * Results are ordered by creation date (most recent first) and capped at
 * QUERY_LIMIT rows — add pagination before reaching that volume.
 *
 * @param saccoId - UUID of the SACCO whose loans to retrieve.
 * @returns Array of camelCase loan objects with embedded member fields.
 * @throws If the database query fails.
 */
export async function getAllLoans(saccoId: string) {
  const { data, error } = await supabaseAdmin
    .from("loans")
    .select(LOAN_LIST_COLUMNS)
    .eq("sacco_id", saccoId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(QUERY_LIMIT)

  if (error) throw new Error(`Failed to fetch loans: ${error.message}`)

  return data.map((loan) => ({
    ...mapLoanRow(loan),
    // Flatten the joined member fields onto the loan object
    memberName:       (loan.members as any)?.full_name    ?? null,
    memberCode:       (loan.members as any)?.member_code  ?? null,
    memberPhone:      (loan.members as any)?.phone        ?? null,
    memberNationalId: (loan.members as any)?.national_id  ?? null,
    memberAddress:    (loan.members as any)?.address      ?? null,
  }))
}

/**
 * Fetch a single loan by its ID, scoped to the given SACCO.
 * Returns `null` when no matching loan is found.
 *
 * @param id      - Loan UUID.
 * @param saccoId - SACCO UUID the loan must belong to.
 * @returns Camelcase loan object or `null`.
 * @throws If the database query fails for a reason other than "not found".
 */
export async function getLoanById(id: string, saccoId: string) {
  const { data, error } = await supabaseAdmin
    .from("loans")
    .select("*")
    .eq("id", id)
    .eq("sacco_id", saccoId)
    .maybeSingle()

  if (error) {
    if (error.code === POSTGREST_NO_ROWS_CODE) return null
    throw new Error(`Failed to fetch loan: ${error.message}`)
  }

  if (!data) return null
  return mapLoanRow(data)
}

// ─── Appendix ─────────────────────────────────────────────────────────────────
//
// EXPORTED FUNCTIONS:
//   getAllLoans(saccoId)       – list all non-deleted loans for a SACCO
//   getLoanById(id, saccoId)  – fetch one loan by ID; returns null if not found
//
// KEY CONSTANTS:
//   QUERY_LIMIT              = 1 000  (hard cap — add pagination beyond this)
//   POSTGREST_NO_ROWS_CODE   = "PGRST116"
//
// RETURN SHAPE (camelCase):
//   id, saccoId, memberId, categoryId, loanRef, amount, balance, interestRate,
//   status, dueDate, disbursedAt, settledAt, declineReason, notes,
//   createdAt, updatedAt, interestRateId, expectedReceived, interestType,
//   durationMonths, latePenaltyFee, dailyPayment, monthlyPayment
//   (getAllLoans also includes: memberName, memberCode, memberPhone,
//    memberNationalId, memberAddress)
//
// RELATED FILES:
//   lib/supabase/server.ts              – provides supabaseAdmin
//   app/(dashboard)/loans/actions.ts    – uses these queries for loan management
