export async function requestAirtelPayment({
  phone,
  amount,
  reference,
  narration,
}: {
  phone: string
  amount: number
  reference: string
  narration: string
}) {
  const baseUrl = process.env.AIRTEL_BASE_URL
  const clientId = process.env.AIRTEL_CLIENT_ID
  const clientSecret = process.env.AIRTEL_CLIENT_SECRET

  if (!baseUrl || !clientId || !clientSecret) {
    throw new Error("Airtel payment configuration missing")
  }

  const tokenRes = await fetch(`${baseUrl}/auth/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
  })

  if (!tokenRes.ok) throw new Error("Failed to get Airtel token")
  const { access_token } = await tokenRes.json()

  const formatted = phone.replace(/^0/, "256").replace(/^\+/, "")

  const res = await fetch(`${baseUrl}/merchant/v2/payments/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json",
      "X-Country": "UG",
      "X-Currency": "UGX",
    },
    body: JSON.stringify({
      reference,
      subscriber: { country: "UG", currency: "UGX", msisdn: formatted },
      transaction: {
        amount: String(amount / 100),
        country: "UG",
        currency: "UGX",
        id: reference,
      },
    }),
  })

  if (!res.ok) throw new Error("Airtel payment request failed")
  return { success: true, reference }
}
