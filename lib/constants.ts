/**
 * constants.ts
 *
 * Application-wide constants for the SACCO application.
 * Import from here instead of scattering magic values across files.
 */

// ─── SACCO identity ───────────────────────────────────────────────────────────

/**
 * Default (fallback) SACCO UUID used when the request context does not
 * supply a real SACCO identifier (e.g. during seeding or local dev).
 */
export const DEFAULT_SACCO_ID = "00000000-0000-0000-0000-000000000001"

/** @deprecated Use DEFAULT_SACCO_ID. Left for backward compatibility. */
export const SACCO_ID = DEFAULT_SACCO_ID

/**
 * Display name of the SACCO, sourced from the environment or a sensible
 * default.  Used in SMS messages and page titles.
 */
export const SACCO_NAME = process.env.SACCO_NAME || "My SACCO"

// ─── Currency ─────────────────────────────────────────────────────────────────

/** ISO 4217 currency code used throughout the application. */
export const CURRENCY_CODE = "UGX"

/**
 * All monetary amounts are stored as integers in minor units (cents/agorot/fils).
 * Multiply by this factor when converting from major units entered by users.
 * Divide by this factor when displaying amounts.
 */
export const CENTS_PER_UNIT = 100

// ─── Pagination ───────────────────────────────────────────────────────────────

/** Default page size for list views that support pagination. */
export const DEFAULT_PAGE_SIZE = 50

/** Hard cap on query results before pagination is required. */
export const MAX_QUERY_LIMIT = 1000

// ─── File uploads ─────────────────────────────────────────────────────────────

/** Maximum allowed size for member photo uploads. */
export const PHOTO_MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

/** MIME types accepted for member photo uploads. */
export const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const

// ─── Roles ────────────────────────────────────────────────────────────────────

/** Roles that are permitted to approve / decline / disburse loans. */
export const LOAN_MANAGEMENT_ROLES = ["admin", "cashier"] as const

/** Roles that are permitted to create and edit members. */
export const MEMBER_MANAGEMENT_ROLES = ["admin", "cashier", "field_agent", "branch_admin"] as const

// ─── Appendix ─────────────────────────────────────────────────────────────────
//
// EXPORTED CONSTANTS:
//   DEFAULT_SACCO_ID         – fallback UUID for dev / seeding
//   SACCO_ID                 – deprecated alias for DEFAULT_SACCO_ID
//   SACCO_NAME               – display name from NEXT_PUBLIC_SACCO_NAME env var
//   CURRENCY_CODE            – "UGX"
//   CENTS_PER_UNIT           – 100  (minor-unit multiplier)
//   DEFAULT_PAGE_SIZE        – 50
//   MAX_QUERY_LIMIT          – 1000
//   PHOTO_MAX_SIZE_BYTES     – 5 242 880 (5 MB)
//   ALLOWED_PHOTO_TYPES      – ["image/jpeg", "image/png", "image/webp"]
//   LOAN_MANAGEMENT_ROLES    – ["admin", "cashier"]
//   MEMBER_MANAGEMENT_ROLES  – ["admin", "cashier", "field_agent", "branch_admin"]
//
// RELATED FILES:
//   lib/member-code.ts                  – uses SACCO_ID for seeding default
//   app/(dashboard)/loans/actions.ts    – uses CENTS_PER_UNIT, LOAN_MANAGEMENT_ROLES
//   app/(dashboard)/members/actions.ts  – uses CENTS_PER_UNIT, PHOTO_MAX_SIZE_BYTES
