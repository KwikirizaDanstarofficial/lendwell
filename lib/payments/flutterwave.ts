/**
 * flutterwave.ts
 *
 * Low-level Flutterwave API helpers for the SACCO application.
 * Provides functions to initiate mobile-money charges (USSD push),
 * bank/mobile-money transfers (payouts), and query transfer statuses.
 *
 * All functions read credentials and the base URL from environment variables.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

/** Flutterwave REST API base URL. Override via FLUTTERWAVE_BASE_URL for staging. */
const FLUTTERWAVE_BASE_URL =
  process.env.FLUTTERWAVE_BASE_URL || "https://api.flutterwave.com/v3"

/** Default currency for all Uganda transactions. */
const DEFAULT_CURRENCY = "UGX"

/** Fallback email used when the member has no email address on file. */
const DEFAULT_EMAIL = "member@sacco.com"

/** Fallback name used when the member's full name is not available. */
const DEFAULT_FULLNAME = "SACCO Member"

/** Default mobile-money charge mode — USSD push. */
const DEFAULT_AUTHORIZATION_MODE = "ussd"

/**
 * Phone prefixes that belong to the MTN Uganda network.
 * Numbers starting with 25675 or 25670 are routed to MTN (MPS).
 * All others are treated as Airtel (ATL).
 */
const MTN_PREFIXES = ["25675", "25670"] as const

/** Flutterwave network code for MTN Uganda. */
const NETWORK_MTN = "MTN"

/** Flutterwave network code for Airtel Uganda. */
const NETWORK_AIRTEL = "AIRTEL"

/** Flutterwave bank code for MTN Mobile Money (used in transfers). */
const BANK_CODE_MTN = "MPS"

/** Flutterwave bank code for Airtel Money (used in transfers). */
const BANK_CODE_AIRTEL = "ATL"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FlutterwaveTransferRequest {
  /** Flutterwave bank/network code (e.g. "MPS" for MTN, "ATL" for Airtel). */
  account_bank:      string
  /** Recipient phone number or account number (normalised, no leading +). */
  account_number:    string
  /** Amount to transfer in major currency units. */
  amount:            number
  /** ISO currency code (defaults to UGX). */
  currency?:         string
  /** Transaction description shown to the recipient. */
  narration?:        string
  /** Unique reference for idempotency and status lookups. */
  reference:         string
  /** Recipient name (used for display in Flutterwave dashboard). */
  beneficiary_name?: string
}

export interface FlutterwaveChargeRequest {
  /** Recipient phone number (any format — will be normalised internally). */
  phone_number:          string
  /** Amount to charge in major currency units. */
  amount:                number
  /** ISO currency code (defaults to UGX). */
  currency:              string
  /** Member email address (falls back to DEFAULT_EMAIL if absent). */
  email?:                string
  /** Member full name (falls back to DEFAULT_FULLNAME if absent). */
  fullname?:             string
  /** Unique transaction reference for idempotency. */
  tx_ref:                string
  /** Transaction description. */
  narration?:            string
  /** Charge mode — "ussd" (default) or "redirect". */
  authorization_mode?:   string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Normalise a phone number to international format without a leading "+".
 * Handles E.164 (+256…), local Uganda (0…), and already-normalised formats.
 */
function normalisePhone(raw: string): string {
  return raw.replace(/\s+/g, "").replace(/^\+/, "").replace(/^0/, "256")
}

/**
 * Detect the Ugandan mobile network from a normalised phone number.
 * Returns "MTN" for 25675/25670 prefixes, "AIRTEL" for everything else.
 */
function detectNetwork(normalisedPhone: string): typeof NETWORK_MTN | typeof NETWORK_AIRTEL {
  return MTN_PREFIXES.some((prefix) => normalisedPhone.startsWith(prefix))
    ? NETWORK_MTN
    : NETWORK_AIRTEL
}

/**
 * Detect the Flutterwave bank code (MPS / ATL) for a normalised phone number.
 * Used in transfer requests instead of charge requests.
 */
export function detectBankCode(normalisedPhone: string): typeof BANK_CODE_MTN | typeof BANK_CODE_AIRTEL {
  return MTN_PREFIXES.some((prefix) => normalisedPhone.startsWith(prefix))
    ? BANK_CODE_MTN
    : BANK_CODE_AIRTEL
}

/** Read and validate the Flutterwave secret key from the environment. */
function getSecretKey(): string {
  const secretKey = process.env.FLW_SECRET_KEY
  if (!secretKey) throw new Error("Flutterwave secret key not configured")
  return secretKey
}

// ─── API functions ────────────────────────────────────────────────────────────

/**
 * Initiate a mobile-money Uganda charge (USSD push) via Flutterwave.
 *
 * @param params - Charge request including phone, amount, and transaction ref.
 * @returns `{ success: true, data }` where `data` is the raw API response.
 *          `data.meta.ussd_code` contains the code to show to the member.
 * @throws If the secret key is missing or the API returns a non-2xx status.
 */
export async function initiateFlutterwaveCharge({
  phone_number,
  amount,
  currency           = DEFAULT_CURRENCY,
  email,
  fullname,
  tx_ref,
  narration,
  authorization_mode = DEFAULT_AUTHORIZATION_MODE,
}: FlutterwaveChargeRequest) {
  const secretKey       = getSecretKey()
  const normalisedPhone = normalisePhone(phone_number)
  const network         = detectNetwork(normalisedPhone)

  const httpResponse = await fetch(
    `${FLUTTERWAVE_BASE_URL}/charges?type=mobile_money_uganda`,
    {
      method:  "POST",
      headers: {
        Authorization:  `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone_number:       normalisedPhone,
        amount,
        currency,
        email:              email    || DEFAULT_EMAIL,
        fullname:           fullname || DEFAULT_FULLNAME,
        tx_ref,
        narration,
        network,
        is_permanent:       false,
        authorization_mode,
      }),
    }
  )

  const responseData = await httpResponse.json()
  console.log("[Flutterwave] Charge response:", JSON.stringify(responseData, null, 2))

  if (!httpResponse.ok) {
    throw new Error(`Flutterwave charge failed: ${responseData.message}`)
  }

  if (responseData.data?.meta?.ussd_code) {
    console.log("[Flutterwave] USSD code:", responseData.data.meta.ussd_code)
  }

  return { success: true, data: responseData }
}

/**
 * Initiate a bank or mobile-money transfer (payout) via Flutterwave.
 *
 * @param params - Transfer request including bank code, account, amount, and reference.
 * @returns `{ success: true, data }`.
 * @throws If the secret key is missing or the API returns a non-2xx status.
 */
export async function initiateFlutterwaveTransfer({
  account_bank,
  account_number,
  amount,
  narration,
  currency = DEFAULT_CURRENCY,
  reference,
  beneficiary_name,
}: FlutterwaveTransferRequest) {
  const secretKey = getSecretKey()

  const httpResponse = await fetch(`${FLUTTERWAVE_BASE_URL}/transfers`, {
    method:  "POST",
    headers: {
      Authorization:  `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      account_bank,
      account_number,
      amount,
      narration,
      currency,
      reference,
      beneficiary_name,
    }),
  })

  if (!httpResponse.ok) {
    const errorData = await httpResponse.json()
    throw new Error(`Flutterwave transfer failed: ${errorData.message}`)
  }

  const responseData = await httpResponse.json()
  return { success: true, data: responseData }
}

/**
 * Query the status of a previously initiated transfer by its reference.
 *
 * @param reference - The unique reference used when creating the transfer.
 * @returns The raw Flutterwave API response with status details.
 * @throws If the secret key is missing or the API returns a non-2xx status.
 */
export async function getTransferStatus(reference: string) {
  const secretKey = getSecretKey()

  const httpResponse = await fetch(`${FLUTTERWAVE_BASE_URL}/transfers/${reference}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  })

  if (!httpResponse.ok) {
    throw new Error(`Failed to fetch transfer status for ref: ${reference}`)
  }

  return httpResponse.json()
}

// ─── Appendix ─────────────────────────────────────────────────────────────────
//
// EXPORTED FUNCTIONS:
//   initiateFlutterwaveCharge(params)    – USSD push charge (collection)
//   initiateFlutterwaveTransfer(params)  – payout to mobile money / bank
//   getTransferStatus(reference)         – poll transfer status
//   detectBankCode(normalisedPhone)      – "MPS" (MTN) | "ATL" (Airtel)
//
// EXPORTED TYPES:
//   FlutterwaveChargeRequest
//   FlutterwaveTransferRequest
//
// KEY CONSTANTS:
//   FLUTTERWAVE_BASE_URL       – API root (env FLUTTERWAVE_BASE_URL or default)
//   DEFAULT_CURRENCY           – "UGX"
//   NETWORK_MTN / AIRTEL       – "MTN" | "AIRTEL"
//   BANK_CODE_MTN / AIRTEL     – "MPS" | "ATL"
//   MTN_PREFIXES               – ["25675", "25670"]
//
// ENVIRONMENT VARIABLES:
//   FLW_SECRET_KEY             – Flutterwave secret key (required in production)
//   FLUTTERWAVE_BASE_URL       – override for staging/sandbox
//
// RELATED FILES:
//   lib/payments/index.ts               – orchestration layer that calls these helpers
//   app/(dashboard)/loans/actions.ts    – calls initiateFlutterwaveTransfer for disbursal
