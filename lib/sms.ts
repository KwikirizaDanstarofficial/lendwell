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

/**
 * SMS Templates for various notifications
 */
export const smsTemplates = {
  /**
   * Welcome message for new members
   */
  welcome: (fullName: string, memberCode: string): string => {
    return `Welcome to our SACCO, ${fullName}! Your member code is ${memberCode}. Save this code for all your transactions. Thank you for joining us!`
  },

  /**
   * Loan approval notification
   */
  loanApproved: (fullName: string, amount: number, memberCode: string): string => {
    return `Dear ${fullName}, your loan application of ${amount.toLocaleString()} has been approved. Member code: ${memberCode}. Thank you!`
  },

  /**
   * Loan rejection notification
   */
  loanRejected: (fullName: string, memberCode: string): string => {
    return `Dear ${fullName}, your loan application has been declined. Contact us for more information. Member code: ${memberCode}.`
  },

  /**
   * Savings confirmation
   */
  savingsDeposit: (fullName: string, amount: number, balance: number, memberCode: string): string => {
    return `Dear ${fullName}, we have received your savings of ${amount.toLocaleString()}. New balance: ${balance.toLocaleString()}. Member code: ${memberCode}.`
  },

  /**
   * Meeting reminder
   */
  meetingReminder: (fullName: string, date: string, time: string, venue: string): string => {
    return `Dear ${fullName}, reminder: General meeting on ${date} at ${time}. Venue: ${venue}. Your attendance is valuable!`
  },

  /**
   * Password reset notification
   */
  passwordReset: (fullName: string, expiresIn: number = 15): string => {
    return `Dear ${fullName}, you requested a password reset. This link expires in ${expiresIn} minutes. If you didn't request this, please ignore.`
  },

  /**
   * Fine issued notification
   */
  fineIssued: (fullName: string, amount: string, reason: string | null): string => {
    const reasonText = reason ? ` Reason: ${reason}` : ""
    return `Dear ${fullName}, a fine of ${amount} has been issued to your account.${reasonText} Please settle this promptly.`
  },

  /**
   * Loan declined notification
   */
  loanDeclined: (fullName: string, reason: string): string => {
    const reasonText = reason ? ` Reason: ${reason}` : ""
    return `Dear ${fullName}, your loan application has been declined.${reasonText} Contact us for more information.`
  },

  /**
   * Loan disbursed notification
   */
  loanDisbursed: (fullName: string, amount: string, loanRef: string): string => {
    return `Dear ${fullName}, your loan of ${amount} has been disbursed. Reference: ${loanRef}. Thank you for banking with us!`
  },

  /**
   * Loan repayment notification
   */
  loanRepayment: (fullName: string, amount: string, balance: string): string => {
    return `Dear ${fullName}, we have received your loan repayment of ${amount}. Remaining balance: ${balance}. Thank you!`
  },

  /**
   * Loan reminder — 3 days before due date
   */
  loanReminder3Days: (fullName: string, loanRef: string, balance: string, dueDate: string): string => {
    return `Dear ${fullName}, your loan (Ref: ${loanRef}) of ${balance} is due on ${dueDate} — 3 days from now. Please arrange payment to avoid penalties.`
  },

  /**
   * Loan reminder — 1 day before due date
   */
  loanReminder1Day: (fullName: string, loanRef: string, balance: string, dueDate: string): string => {
    return `Dear ${fullName}, REMINDER: Your loan (Ref: ${loanRef}) balance of ${balance} is due TOMORROW (${dueDate}). Please make payment today to avoid late fees.`
  },

  /**
   * Loan reminder — due today
   */
  loanReminderToday: (fullName: string, loanRef: string, balance: string): string => {
    return `Dear ${fullName}, your loan (Ref: ${loanRef}) balance of ${balance} is DUE TODAY. Please make payment immediately to avoid penalties.`
  },

  /**
   * Loan overdue reminder — sent daily for overdue loans
   */
  loanOverdue: (fullName: string, loanRef: string, balance: string, daysOverdue: number): string => {
    return `Dear ${fullName}, your loan (Ref: ${loanRef}) is OVERDUE by ${daysOverdue} day${daysOverdue === 1 ? "" : "s"}. Outstanding balance: ${balance}. Please pay immediately or contact us to avoid further action.`
  },
}
