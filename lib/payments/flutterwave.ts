export interface FlutterwaveTransferRequest {
  account_bank: string
  account_number: string
  amount: number
  currency?: string
  narration?: string
  reference: string
  beneficiary_name?: string
}

export interface FlutterwaveChargeRequest {
  phone_number: string
  amount: number
  currency: string
  email?: string
  fullname?: string
  tx_ref: string
  narration?: string
  authorization_mode?: string
}

export async function initiateFlutterwaveCharge({
  phone_number,
  amount,
  currency = "UGX",
  email,
  fullname,
  tx_ref,
  narration,
  authorization_mode = "ussd",
}: FlutterwaveChargeRequest) {
  const secretKey = process.env.FLW_SECRET_KEY
  const baseUrl =
    process.env.FLUTTERWAVE_BASE_URL || "https://api.flutterwave.com/v3"

  if (!secretKey) {
    throw new Error("Flutterwave secret key not configured")
  }

  const normalizedPhone = phone_number
    .replace(/\s+/g, "")
    .replace(/^\+/, "")
    .replace(/^0/, "256")

  const res = await fetch(`${baseUrl}/charges?type=mobile_money_uganda`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      phone_number: normalizedPhone,
      amount,
      currency,
      email: email || "member@sacco.com",
      fullname: fullname || "SACCO Member",
      tx_ref,
      narration,
      network:
        normalizedPhone.startsWith("25675") ||
        normalizedPhone.startsWith("25670")
          ? "MTN"
          : "AIRTEL",
      is_permanent: false,
      authorization_mode: authorization_mode,
    }),
  })

  const response = await res.json()
  console.log("Flutterwave charge response:", JSON.stringify(response, null, 2))

  if (!res.ok) {
    throw new Error(`Flutterwave charge failed: ${response.message}`)
  }

  if (response.data?.meta?.ussd_code) {
    console.log("USSD Code:", response.data.meta.ussd_code)
  }

  if (response.data?.meta?.note) {
    console.log("Note:", response.data.meta.note)
  }

  return { success: true, data: response }
}

export async function initiateFlutterwaveTransfer({
  account_bank,
  account_number,
  amount,
  narration,
  currency = "UGX",
  reference,
  beneficiary_name,
}: FlutterwaveTransferRequest) {
  const secretKey = process.env.FLW_SECRET_KEY
  const baseUrl =
    process.env.FLUTTERWAVE_BASE_URL || "https://api.flutterwave.com/v3"

  if (!secretKey) {
    throw new Error("Flutterwave secret key not configured")
  }

  const res = await fetch(`${baseUrl}/transfers`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
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

  if (!res.ok) {
    const error = await res.json()
    throw new Error(`Flutterwave transfer failed: ${error.message}`)
  }

  const data = await res.json()
  return { success: true, data }
}

export async function getTransferStatus(reference: string) {
  const secretKey = process.env.FLW_SECRET_KEY
  const baseUrl =
    process.env.FLUTTERWAVE_BASE_URL || "https://api.flutterwave.com/v3"

  if (!secretKey) {
    throw new Error("Flutterwave secret key not configured")
  }

  const res = await fetch(`${baseUrl}/transfers/${reference}`, {
    headers: {
      Authorization: `Bearer ${secretKey}`,
    },
  })

  if (!res.ok) {
    throw new Error("Failed to get transfer status")
  }

  const data = await res.json()
  return data
}
