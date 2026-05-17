import {
  initiateFlutterwaveCharge,
  initiateFlutterwaveTransfer,
} from "./flutterwave"

export const PAYMENT_CHANNELS = {
  CASH: "cash",
  FLUTTERWAVE: "flutterwave",
  MOBILE_MONEY: "mobile_money",
} as const

export type PaymentChannel =
  (typeof PAYMENT_CHANNELS)[keyof typeof PAYMENT_CHANNELS]

export interface PaymentOptions {
  phone_number: string
  amount: number
  currency?: string
  email?: string
  fullname?: string
  tx_ref: string
  narration?: string
}

export interface PaymentResult {
  success: boolean
  error?: string
  data?: any
}

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
      phone_number: phone_number!,
      amount,
      currency: "UGX",
      email: email || "member@sacco.com",
      fullname: fullname || "SACCO Member",
      tx_ref,
      narration: narration || "",
    })

    return { success: true, data: result }
  } catch (error) {
    console.error("Payment charge error:", error)
    return { success: false, error: "Payment failed. Please try again." }
  }
}

export async function processWithdrawal({
  account_bank,
  account_number,
  amount,
  reference,
  beneficiary_name,
  narration,
}: {
  account_bank: string
  account_number: string
  amount: number
  reference: string
  beneficiary_name?: string
  narration?: string
}): Promise<PaymentResult> {
  try {
    const result = await initiateFlutterwaveTransfer({
      account_bank,
      account_number,
      amount,
      currency: "UGX",
      reference,
      beneficiary_name,
      narration: narration || "",
    })

    return { success: true, data: result }
  } catch (error) {
    console.error("Withdrawal error:", error)
    return { success: false, error: "Transfer failed. Please try again." }
  }
}

export function calculateFlutterwaveCharge(amount: number): number {
  return Math.ceil(amount * 0.014)
}

export function getPaymentMethodLabel(method: string): string {
  switch (method) {
    case "cash":
      return "Cash"
    case "flutterwave":
    case "mobile_money":
      return "Mobile Money (Flutterwave)"
    default:
      return method
  }
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\s+/g, "").replace(/^\+/, "").replace(/^0/, "256")
}

export function getMobileNetwork(phone: string): "MPS" | "ATL" {
  const normalized = normalizePhone(phone)
  return normalized.startsWith("25675") || normalized.startsWith("25670")
    ? "MPS"
    : "ATL"
}
