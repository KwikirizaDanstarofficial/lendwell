"use server"

import { z } from "zod"

const VerifySchema = z.object({
  txRef: z.string(),
})

export async function verifyPayment(txRef: string) {
  try {
    const secretKey = process.env.FLW_SECRET_KEY
    const publicKey = process.env.FLW_PUBLIC_KEY

    if (!secretKey || !publicKey) {
      throw new Error("Flutterwave keys not configured")
    }

    const response = await fetch(
      `https://api.flutterwave.com/v3/transactions/verify_by_reference/${txRef}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Verification failed")
    }

    if (data.data?.status === "successful") {
      return {
        verified: true,
        message: "Payment verified successfully",
        data: data.data,
      }
    }

    return {
      verified: false,
      message: data.data?.status || "Payment not completed",
      data: data.data,
    }
  } catch (error) {
    console.error("Payment verification error:", error)
    return {
      verified: false,
      error: error instanceof Error ? error.message : "Verification failed",
    }
  }
}
