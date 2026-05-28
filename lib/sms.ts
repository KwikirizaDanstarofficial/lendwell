/**
 * SMS Service
 * Handles SMS sending functionality for the SACCO application
 * Uses direct HTTP requests to EGO SMS API
 */

interface SmsPayload {
  to: string
  message: string
}

interface SmsResponse {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Send an SMS message to a recipient
 */
export async function sendSms(payload: SmsPayload): Promise<SmsResponse> {
  const { to, message } = payload

  // Validate phone number
  if (!to || !message) {
    return {
      success: false,
      error: "Phone number and message are required",
    }
  }

  // Format phone number (ensure it starts with + or 0)
  const formattedPhone = to.startsWith("+") ? to : `+${to.startsWith("0") ? "256" + to.slice(1) : to}`

  try {
    // Check if SDK credentials are configured
    const apiUsername = process.env.COMMS_SDK_USERNAME
    const apiKey = process.env.COMMS_SDK_API_KEY

    if (!apiUsername || !apiKey) {
      console.warn("[SMS] Comms SDK not configured. SMS not sent.")
      return {
        success: true,
        messageId: `mock-${Date.now()}`,
      }
    }

    // Get sender ID from environment or use default
    const senderId = process.env.EGOSMS_SENDER_ID || "SACCO"
    
    const apiUrl = "https://comms.egosms.co/api/v1/json/"
    const requestBody = {
      method: "SendSms",
      userdata: {
        username: apiUsername,
        password: apiKey
      },
      msgdata: [
        {
          number: formattedPhone.replace("+", ""),
          message: message,
          senderid: senderId,
          priority: "0" // HIGHEST priority
        }
      ]
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    })

    const responseData = await response.json()

    if (response.ok && responseData.Status === "OK") {
      return {
        success: true,
        messageId: responseData.MsgFollowUpUniqueCode || `ego-${Date.now()}`,
      }
    } else {
      console.error("[SMS] SMS delivery failed - API response:", responseData)
      return {
        success: false,
        error: responseData.Message || "SMS delivery failed",
      }
    }
  } catch (error) {
    console.error("[SMS] SMS send error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

export { getSmsTemplates, englishTemplates as smsTemplates } from "@/lib/sms-templates"
export type { SmsLanguage } from "@/lib/sms-templates"
