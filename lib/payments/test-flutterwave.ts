import { initiateFlutterwaveTransfer } from "@/lib/payments/flutterwave"

// Test function (for development only)
export async function testFlutterwaveTransfer() {
  try {
    const result = await initiateFlutterwaveTransfer({
      account_bank: "MPS", // MTN Uganda
      account_number: "256701234567", // Test phone
      amount: 1000, // UGX 10
      currency: "UGX",
      narration: "Test transfer",
      reference: "TEST-123",
      beneficiary_name: "Test User",
    })
    console.log("Flutterwave test result:", result)
    return result
  } catch (error) {
    console.error("Flutterwave test error:", error)
    return { error: error instanceof Error ? error.message : String(error) }
  }
}
