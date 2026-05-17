export interface MomoPaymentRequest {
  amount: string
  currency: string
  externalId: string
  payer: { partyIdType: "MSISDN"; partyId: string }
  payerMessage: string
  payeeNote: string
}

export async function requestMtnPayment({
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
  const baseUrl = process.env.MTN_MOMO_BASE_URL
  const subscriptionKey = process.env.MTN_MOMO_SUBSCRIPTION_KEY
  const apiUser = process.env.MTN_MOMO_API_USER
  const apiKey = process.env.MTN_MOMO_API_KEY
  const environment = process.env.MTN_MOMO_ENVIRONMENT ?? "sandbox"

  if (!baseUrl || !subscriptionKey || !apiUser || !apiKey) {
    throw new Error("MTN payment configuration missing")
  }

  const token = Buffer.from(`${apiUser}:${apiKey}`).toString("base64")

  const tokenRes = await fetch(`${baseUrl}/collection/token/`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${token}`,
      "Ocp-Apim-Subscription-Key": subscriptionKey!,
      "X-Target-Environment": environment,
    },
  })

  if (!tokenRes.ok) throw new Error("Failed to get MTN token")
  const { access_token } = await tokenRes.json()

  const formatted = phone.replace(/^0/, "256").replace(/^\+/, "")

  const res = await fetch(`${baseUrl}/collection/v1_0/requesttopay`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access_token}`,
      "X-Reference-Id": reference,
      "X-Target-Environment": environment,
      "Ocp-Apim-Subscription-Key": subscriptionKey!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: String(amount / 100),
      currency: "UGX",
      externalId: reference,
      payer: { partyIdType: "MSISDN", partyId: formatted },
      payerMessage: narration,
      payeeNote: narration,
    }),
  })

  if (!res.ok) throw new Error("MTN payment request failed")
  return { success: true, reference }
}
