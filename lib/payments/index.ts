/**
 * payments/index.ts
 *
 * Payment-processing orchestration layer for the SACCO application.
 * Exposes high-level `processPayment` and `processWithdrawal` functions
 * that delegate to the Flutterwave module, plus utility helpers for
 * fee calculation, phone normalisation, and network detection.
 */

import {
  initiateFlutterwaveCharge,
  initiateFlutterwaveTransfer,
} from "./flutterwave"

// ─── Constants ────────────────────────────────────────────────────────────────

/** Flutterwave processing fee rate (1.4 % of the transaction amount). */
const FLUTTERWAVE_FEE_RATE = 0.014

/** Default currency for all Uganda payments. */
const DEFAULT_CURRENCY = "UGX"

/** Fallback email used when the member has no email on file. */
const DEFAULT_MEMBER_EMAIL = "member@sacco.com"

/** Fallback name used when the member's full name is not available. */
const DEFAULT_MEMBER_NAME = "SACCO Member"

/** Uganda country code used when normalising 0-prefixed phone numbers. */
const UGANDA_COUNTRY_CODE = "256"

/** MTN Uganda normalised phone prefixes (used for network detection). */
const MTN_PHONE_PREFIXES = ["25675", "25670"] as const

// ─── Payment channel constants ────────────────────────────────────────────────

export const PAYMENT_CHANNELS = {
  CASH:         "cash",
  FLUTTERWAVE:  "flutterwave",
  MOBILE_MONEY: "mobile_money",
} as const

export type PaymentChannel = (typeof PAYMENT_CHANNELS)[keyof typeof PAYMENT_CHANNELS]

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PaymentOptions {
  /** Recipient phone number (any format). */
  phone_number: string
  /** Amount in major currency units (UGX). */
  amount:       number
  /** ISO currency code (defaults to UGX). */
  currency?:    string
  /** Member email address. */
  email?:       string
  /** Member full name. */
  fullname?:    string
  /** Unique transaction reference. */
  tx_ref:       string
  /** Human-readable payment description. */
  narration?:   string
}

export interface PaymentResult {
  success: boolean
  error?:  string
  data?:   unknown
}

// ─── Orchestration functions ──────────────────────────────────────────────────

/**
 * Initiate a mobile-money charge (USSD push) via Flutterwave.
 *
 * @param options - Payment details including phone, amount, and tx_ref.
 * @returns `{ success, data }` on success or `{ success: false, error }` on failure.
 */
export async function processPayment({
  phone_number,
  amount,
  email,
  fullname,
  tx_ref,
  narration,
}: PaymentOptions): Promise<PaymentResult> {
  try {
    const result = await initiateFlutterwaveCharge({
      phone_number,
      amount,
      currency:  DEFAULT_CURRENCY,
      email:     email    || DEFAULT_MEMBER_EMAIL,
      fullname:  fullname || DEFAULT_MEMBER_NAME,
      tx_ref,
      narration: narration || "",
    })

    return { success: true, data: result }
  } catch (err) {
    console.error("[Payment] Charge error:", err)
    return { success: false, error: "Payment failed. Please try again." }
  }
}

/**
 * Initiate a bank or mobile-money transfer (payout) via Flutterwave.
 *
 * @param options - Transfer details including bank code, account, amount, and reference.
 * @returns `{ success, data }` on success or `{ success: false, error }` on failure.
 */
export async function processWithdrawal({
  account_bank,
  account_number,
  amount,
  reference,
  beneficiary_name,
  narration,
}: {
  account_bank:      string
  account_number:    string
  amount:            number
  reference:         string
  beneficiary_name?: string
  narration?:        string
}): Promise<PaymentResult> {
  try {
    const result = await initiateFlutterwaveTransfer({
      account_bank,
      account_number,
      amount,
      currency: DEFAULT_CURRENCY,
      reference,
      beneficiary_name,
      narration: narration || "",
    })

    return { success: true, data: result }
  } catch (err) {
    console.error("[Payment] Withdrawal error:", err)
    return { success: false, error: "Transfer failed. Please try again." }
  }
}

// ─── Utility helpers ──────────────────────────────────────────────────────────

/**
 * Calculate the Flutterwave processing fee for a given amount.
 * Fee = FLUTTERWAVE_FEE_RATE (1.4 %) of the amount, rounded up.
 *
 * @param amount - Transaction amount in UGX (or the base currency).
 * @returns Fee as an integer.
 */
export function calculateFlutterwaveCharge(amount: number): number {
  return Math.ceil(amount * FLUTTERWAVE_FEE_RATE)
}

/**
 * Return a human-readable label for a payment method code.
 *
 * @param method - Payment method string from the database.
 * @returns Display label, e.g. "Mobile Money (Flutterwave)".
 */
export function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    [PAYMENT_CHANNELS.CASH]:         "Cash",
    [PAYMENT_CHANNELS.FLUTTERWAVE]:  "Mobile Money (Flutterwave)",
    [PAYMENT_CHANNELS.MOBILE_MONEY]: "Mobile Money (Flutterwave)",
  }
  return labels[method] ?? method
}

/**
 * Normalise a phone number to international format (no leading `+`).
 * Strips whitespace, removes a leading `+`, and replaces a leading `0`
 * with the Uganda country code `256`.
 *
 * @param phone - Raw phone input (e.g. "+256 701 234 567" or "0701234567").
 * @returns Normalised string, e.g. "256701234567".
 */
export function normalizePhone(phone: string): string {
  return phone
    .replace(/\s+/g, "")
    .replace(/^\+/, "")
    .replace(/^0/, UGANDA_COUNTRY_CODE)
}

/**
 * Detect the Ugandan mobile-money network code for a phone number.
 * Returns `"MPS"` (MTN) for 25675/25670 prefixes, `"ATL"` (Airtel) otherwise.
 *
 * @param phone - Raw or normalised phone number.
 * @returns `"MPS"` for MTN or `"ATL"` for Airtel.
 */
export function getMobileNetwork(phone: string): "MPS" | "ATL" {
  const normalised = normalizePhone(phone)
  return MTN_PHONE_PREFIXES.some((prefix) => normalised.startsWith(prefix))
    ? "MPS"
    : "ATL"
}

// ─── Appendix ─────────────────────────────────────────────────────────────────
//
// EXPORTED FUNCTIONS:
//   processPayment(options)          – USSD push charge via Flutterwave
//   processWithdrawal(options)       – payout transfer via Flutterwave
//   calculateFlutterwaveCharge(amt)  – compute 1.4 % processing fee
//   getPaymentMethodLabel(method)    – human-readable label for a payment code
//   normalizePhone(phone)            – normalise to international format
//   getMobileNetwork(phone)          – "MPS" (MTN) | "ATL" (Airtel)
//
// EXPORTED CONSTANTS / TYPES:
//   PAYMENT_CHANNELS  – { CASH, FLUTTERWAVE, MOBILE_MONEY }
//   PaymentChannel    – union type of PAYMENT_CHANNELS values
//   PaymentOptions    – input shape for processPayment
//   PaymentResult     – output shape for processPayment / processWithdrawal
//
// KEY CONSTANTS:
//   FLUTTERWAVE_FEE_RATE   = 0.014  (1.4 %)
//   DEFAULT_CURRENCY       = "UGX"
//   UGANDA_COUNTRY_CODE    = "256"
//   MTN_PHONE_PREFIXES     = ["25675", "25670"]
//
// RELATED FILES:
//   lib/payments/flutterwave.ts         – raw Flutterwave API calls
//   app/(dashboard)/loans/actions.ts    – calls processPayment / processWithdrawal
