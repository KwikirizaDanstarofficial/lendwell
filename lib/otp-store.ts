/**
 * otp-store.ts
 *
 * In-memory OTP (one-time password) store for phone-based authentication.
 *
 * ⚠️  NOT suitable for serverless or multi-instance deployments.
 * OTPs are held in a plain Map inside the Node.js process. If the server
 * restarts or multiple instances handle requests (Vercel, Lambda, Kubernetes),
 * OTPs will be lost or inconsistent between instances.
 *
 * Production recommendation: replace with Redis or a database table
 * with TTL cleanup so OTPs survive restarts and work across instances.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

/** How long an OTP remains valid after it is issued (5 minutes). */
const OTP_TTL_MS = 5 * 60 * 1_000

/** Maximum number of failed verification attempts before the OTP is locked. */
const MAX_VERIFY_ATTEMPTS = 5

// ─── Internal store ───────────────────────────────────────────────────────────

interface OtpEntry {
  /** The generated OTP code. */
  code: string
  /** Unix timestamp (ms) after which the OTP is considered expired. */
  expiresAt: number
  /** Number of failed verification attempts so far. */
  failedAttempts: number
}

/** Keyed by phone number. One active OTP per phone at a time. */
const otpStore = new Map<string, OtpEntry>()

// ─── Public API ───────────────────────────────────────────────────────────────

export const OtpStore = {
  /**
   * Store a new OTP for the given phone number.
   * Overwrites any previously issued OTP for that number.
   *
   * @param phone - Recipient phone number (used as the store key).
   * @param code  - The OTP code to store.
   */
  set(phone: string, code: string): void {
    otpStore.set(phone, {
      code,
      expiresAt:      Date.now() + OTP_TTL_MS,
      failedAttempts: 0,
    })
  },

  /**
   * Verify a submitted OTP code against the stored one for a phone number.
   *
   * @param phone - Phone number the OTP was issued to.
   * @param code  - Code submitted by the user.
   * @returns
   *   - `"ok"`        – Code matches; entry is deleted (single-use).
   *   - `"expired"`   – TTL elapsed; entry is deleted.
   *   - `"too_many"`  – Attempt limit exceeded; locked.
   *   - `"invalid"`   – Wrong code; attempt counter incremented.
   *   - `"not_found"` – No OTP on record for this phone.
   */
  verify(
    phone: string,
    code: string
  ): "ok" | "expired" | "invalid" | "not_found" | "too_many" {
    const entry = otpStore.get(phone)

    if (!entry) return "not_found"

    if (Date.now() > entry.expiresAt) {
      otpStore.delete(phone)
      return "expired"
    }

    entry.failedAttempts++

    if (entry.failedAttempts > MAX_VERIFY_ATTEMPTS) return "too_many"

    if (entry.code !== code) return "invalid"

    // Correct code — consume the OTP
    otpStore.delete(phone)
    return "ok"
  },

  /**
   * Remove any stored OTP for a phone number (e.g. after successful login
   * or when issuing a replacement OTP).
   *
   * @param phone - Phone number whose OTP should be removed.
   */
  delete(phone: string): void {
    otpStore.delete(phone)
  },
}

// ─── Appendix ─────────────────────────────────────────────────────────────────
//
// EXPORTED OBJECTS:
//   OtpStore.set(phone, code)      – store a new OTP (overwrites existing)
//   OtpStore.verify(phone, code)   – validate a submitted code
//   OtpStore.delete(phone)         – remove an OTP manually
//
// KEY CONSTANTS:
//   OTP_TTL_MS          = 5 minutes (300_000 ms)
//   MAX_VERIFY_ATTEMPTS = 5
//
// VERIFY RETURN VALUES:
//   "ok"        – success, OTP consumed
//   "expired"   – TTL elapsed
//   "too_many"  – attempt limit exceeded
//   "invalid"   – wrong code
//   "not_found" – no OTP for this phone
//
// ⚠️  PRODUCTION NOTE:
//   This store is process-local. For multi-instance or serverless deployments,
//   replace with a Redis-backed or database-backed implementation.
//
// RELATED FILES:
//   app/api/auth/login-otp   – issues OTPs via OtpStore.set()
//   app/api/auth/verify-otp  – verifies OTPs via OtpStore.verify()
