/**
 * sms.ts
 *
 * SMS delivery service for the SACCO application.
 *
 * Sends text messages via the EGO SMS gateway (Comms SDK REST API).
 * When COMMS_SDK_USERNAME / COMMS_SDK_API_KEY are not set (local dev),
 * the function returns a mock-success instead of hitting the network,
 * so the rest of the app can be developed and tested without a live
 * SMS account.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

/** EGO SMS Comms SDK endpoint. */
const EGO_SMS_API_URL = "https://comms.egosms.co/api/v1/json/"

/** Fallback sender ID when EGOSMS_SENDER_ID is not set in the environment. */
const DEFAULT_SENDER_ID = "SACCO"

/** Uganda country code used when normalising local 0-prefixed numbers. */
const UGANDA_COUNTRY_CODE = "256"

/**
 * Message priority sent to the EGO SMS gateway.
 * "0" = highest priority in the Comms SDK.
 */
const SMS_PRIORITY_HIGHEST = "0"

// ─── Types ────────────────────────────────────────────────────────────────────

/** Input for a single SMS send. */
export interface SmsPayload {
  /** Recipient phone number — E.164, local Uganda (07…), or plain digits. */
  to: string
  /** Full SMS body text (max 160 chars for a single-part message). */
  message: string
}

/** Result returned by sendSms. */
export interface SmsResponse {
  /** Whether the gateway accepted the message. */
  success: boolean
  /** Gateway message ID on success. Prefixed "mock-" in dev mode. */
  messageId?: string
  /** Human-readable error description on failure. */
  error?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Normalise a phone number to E.164 without the leading "+".
 *
 * Handles three common input formats:
 *   "+256712345678" → "256712345678"   (already E.164)
 *   "0712345678"    → "256712345678"   (local Uganda prefix)
 *   "256712345678"  → "256712345678"   (already normalised)
 */
function normaliseUgandaPhone(rawPhone: string): string {
  if (rawPhone.startsWith("+")) {
    return rawPhone.slice(1)
  }
  if (rawPhone.startsWith("0")) {
    return UGANDA_COUNTRY_CODE + rawPhone.slice(1)
  }
  return rawPhone
}

// ─── Delivery function ────────────────────────────────────────────────────────

/**
 * Send a single SMS message to one recipient.
 *
 * In development (no SDK credentials), returns a mock success so the rest
 * of the app works without a live gateway account.
 *
 * @param payload - Recipient phone and message body.
 * @returns SmsResponse with success flag and gateway message ID or error.
 */
export async function sendSms(payload: SmsPayload): Promise<SmsResponse> {
  const { to, message } = payload

  // Guard: both fields are required
  if (!to || !message) {
    return { success: false, error: "Phone number and message are required" }
  }

  const recipientNumber = normaliseUgandaPhone(to)

  try {
    const apiUsername = process.env.COMMS_SDK_USERNAME
    const apiKey      = process.env.COMMS_SDK_API_KEY

    // Dev-mode fallback: credentials not configured
    if (!apiUsername || !apiKey) {
      console.warn("[SMS] Comms SDK credentials not configured — skipping real send.")
      return { success: true, messageId: `mock-${Date.now()}` }
    }

    const senderId = process.env.EGOSMS_SENDER_ID || DEFAULT_SENDER_ID

    const requestBody = {
      method:   "SendSms",
      userdata: {
        username: apiUsername,
        password: apiKey,
      },
      msgdata: [
        {
          number:   recipientNumber,
          message,
          senderid: senderId,
          priority: SMS_PRIORITY_HIGHEST,
        },
      ],
    }

    const httpResponse = await fetch(EGO_SMS_API_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(requestBody),
    })

    const responseData = await httpResponse.json()

    if (httpResponse.ok && responseData.Status === "OK") {
      return {
        success:   true,
        messageId: responseData.MsgFollowUpUniqueCode ?? `ego-${Date.now()}`,
      }
    }

    console.error("[SMS] Gateway rejected the request:", responseData)
    return {
      success: false,
      error:   responseData.Message ?? "SMS delivery failed",
    }
  } catch (err) {
    console.error("[SMS] Network or parse error:", err)
    return {
      success: false,
      error:   err instanceof Error ? err.message : "Unknown error occurred",
    }
  }
}

/**
 * Send an SMS, automatically queuing it to disk if the network is unreachable.
 * The queue is processed next time the client reports coming online via
 * POST /api/sms/process-queue.
 *
 * Use this instead of sendSms() in server actions so notifications are never
 * silently dropped when the device is offline.
 */
export async function sendSmsOrQueue(
  payload: SmsPayload,
  context?: string
): Promise<SmsResponse> {
  const result = await sendSms(payload)

  if (!result.success) {
    const isNetworkError =
      !result.error ||
      result.error.toLowerCase().includes("fetch") ||
      result.error.toLowerCase().includes("network") ||
      result.error.toLowerCase().includes("econnrefused") ||
      result.error.toLowerCase().includes("failed to fetch") ||
      result.error.toLowerCase().includes("enotfound")

    if (isNetworkError) {
      try {
        const { enqueueSms } = await import("@/lib/sms-queue-store")
        enqueueSms({ to: payload.to, message: payload.message, context })
        console.log(`[SMS] Queued offline message to ${payload.to}`)
        return { success: true, messageId: "queued-offline" }
      } catch (qErr) {
        console.error("[SMS] Failed to queue message:", qErr)
      }
    }
  }

  return result
}

export { getSmsTemplates, englishTemplates as smsTemplates } from "@/lib/sms-templates"
export type { SmsLanguage } from "@/lib/sms-templates"

// ─── Appendix ─────────────────────────────────────────────────────────────────
//
// EXPORTED FUNCTIONS:
//   sendSms(payload)       – send one SMS; returns SmsResponse
//
// RE-EXPORTED FROM sms-templates:
//   getSmsTemplates(lang)  – returns the template set for "english"|"luganda"|"both"
//   smsTemplates           – alias for the English template set
//   SmsLanguage            – union type "english" | "luganda" | "both"
//
// KEY CONSTANTS:
//   EGO_SMS_API_URL        = "https://comms.egosms.co/api/v1/json/"
//   DEFAULT_SENDER_ID      = "SACCO"
//   UGANDA_COUNTRY_CODE    = "256"
//   SMS_PRIORITY_HIGHEST   = "0"
//
// ENVIRONMENT VARIABLES:
//   COMMS_SDK_USERNAME     – EGO SMS account username (required in production)
//   COMMS_SDK_API_KEY      – EGO SMS API key / password (required in production)
//   EGOSMS_SENDER_ID       – custom sender label shown on recipient's phone
//                            (defaults to "SACCO")
//
// PHONE NUMBER FORMATS ACCEPTED:
//   +256712345678   E.164 with plus
//   0712345678      Local Uganda prefix (0 → 256)
//   256712345678    Already normalised, no prefix
//
// RELATED FILES:
//   lib/sms-templates.ts        – message template factory (English / Luganda)
//   lib/notification-queue.ts   – async queue that calls sendSms() in bulk
//   lib/sms-luganda-reference.md – human-readable Luganda ↔ English reference
