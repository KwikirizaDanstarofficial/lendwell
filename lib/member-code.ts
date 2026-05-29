/**
 * member-code.ts
 *
 * Member-code generation for the SACCO application.
 *
 * Code format:  {PREFIX}-{YEAR}-{SACCO_SHORT_ID}-{SEQUENCE}
 * Example:      MBR-2026-SACC-00001
 *
 * Segment breakdown:
 *   MBR           – static member prefix
 *   2026          – current 4-digit calendar year
 *   SACC          – first 4 characters of the SACCO UUID, uppercased
 *   00001         – zero-padded sequence number, resets per prefix string
 *
 * ⚠️  Race-condition risk:
 * The next sequence number is derived by querying the highest existing code
 * with a LIKE pattern and adding 1.  Under concurrent inserts two callers
 * may obtain the same sequence.  For high-volume sign-ups, replace with a
 * PostgreSQL SERIAL column or a dedicated counter table with row-level locking.
 */

"use server"

import { supabaseAdmin } from "@/lib/supabase/server"

// ─── Constants ────────────────────────────────────────────────────────────────

/** Static prefix prepended to every member code. */
const MEMBER_CODE_PREFIX = "MBR"

/** Number of characters taken from the SACCO UUID for the short ID segment. */
const SACCO_SHORT_ID_LENGTH = 4

/** Total width of the zero-padded sequence number segment. */
const SEQUENCE_PAD_WIDTH = 5

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build the fixed prefix portion of a member code for the current year.
 * Example output: "MBR-2026-SACC-"
 */
function buildCodePrefix(saccoId: string): string {
  const year       = new Date().getFullYear()
  const saccoShort = saccoId.slice(0, SACCO_SHORT_ID_LENGTH).toUpperCase()
  return `${MEMBER_CODE_PREFIX}-${year}-${saccoShort}-`
}

/**
 * Query the database to find the next available sequence number for a given
 * code prefix.  Returns 1 if no codes exist yet for this prefix.
 */
async function getNextSequenceNumber(saccoId: string): Promise<number> {
  const prefix = buildCodePrefix(saccoId)

  const { data } = await supabaseAdmin
    .from("members")
    .select("member_code")
    .like("member_code", `${prefix}%`)
    .order("member_code", { ascending: false })
    .limit(1)

  if (!data || data.length === 0) return 1

  const lastSequence = parseInt(data[0].member_code.slice(prefix.length), 10) || 0
  return lastSequence + 1
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate a single unique member code for the given SACCO.
 *
 * @param saccoId - UUID of the SACCO the member belongs to.
 * @returns A code string such as `"MBR-2026-SACC-00001"`.
 */
export async function generateMemberCode(saccoId: string): Promise<string> {
  const prefix   = buildCodePrefix(saccoId)
  const sequence = await getNextSequenceNumber(saccoId)
  return `${prefix}${String(sequence).padStart(SEQUENCE_PAD_WIDTH, "0")}`
}

/**
 * Generate `count` consecutive member codes starting from the next available
 * sequence number.  Useful for bulk member imports.
 *
 * @param saccoId - UUID of the SACCO.
 * @param count   - Number of codes to generate.
 * @returns An ordered array of code strings.
 */
export async function generateMemberCodes(
  saccoId: string,
  count:   number
): Promise<string[]> {
  const prefix        = buildCodePrefix(saccoId)
  const startSequence = await getNextSequenceNumber(saccoId)

  return Array.from({ length: count }, (_, i) =>
    `${prefix}${String(startSequence + i).padStart(SEQUENCE_PAD_WIDTH, "0")}`
  )
}

// ─── Appendix ─────────────────────────────────────────────────────────────────
//
// EXPORTED FUNCTIONS:
//   generateMemberCode(saccoId)          – generate one code for the next member
//   generateMemberCodes(saccoId, count)  – generate a batch of consecutive codes
//
// KEY CONSTANTS:
//   MEMBER_CODE_PREFIX     = "MBR"
//   SACCO_SHORT_ID_LENGTH  = 4   (characters taken from saccoId)
//   SEQUENCE_PAD_WIDTH     = 5   (zero-padded sequence digits)
//
// CODE FORMAT:
//   MBR-{YYYY}-{SACCO[0..3].toUpperCase()}-{00001}
//   e.g. MBR-2026-SACC-00042
//
// ⚠️  RACE CONDITION:
//   Concurrent inserts can produce duplicate sequence numbers.
//   For high-volume environments, replace getNextSequenceNumber() with
//   a Postgres SERIAL column or a dedicated locked counter table.
//
// RELATED FILES:
//   app/(dashboard)/members/actions.ts  – calls generateMemberCode / generateMemberCodes
//   lib/supabase/server.ts              – provides supabaseAdmin
