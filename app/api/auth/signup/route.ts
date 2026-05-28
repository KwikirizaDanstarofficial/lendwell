import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createHmac } from "crypto"
import { sendSms } from "@/lib/sms"
import { supabaseAdmin } from "@/lib/supabase/server"

const COOKIE_NAME = "sacco_signup_state"
const OTP_TTL_MS = 10 * 60 * 1000 // 10 minutes

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex")
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  if (digits.startsWith("0")) return "256" + digits.slice(1)
  if (digits.startsWith("256")) return digits
  return digits
}

export async function POST(req: Request) {
  try {
    const { fullName, phone } = await req.json()

    if (!fullName?.trim() || !phone?.trim())
      return NextResponse.json({ error: "Name and phone number are required." }, { status: 400 })

    const normalized = normalizePhone(phone.trim())

    // Check if this phone is already registered
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    })

    if (!listError && users.some((u) => u.user_metadata?.phone === normalized)) {
      return NextResponse.json(
        { error: "This phone number is already registered. Please sign in instead." },
        { status: 409 }
      )
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000))
    const expires = Date.now() + OTP_TTL_MS

    const payload = JSON.stringify({ fullName: fullName.trim(), phone: normalized, otp, expires })
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const sig = sign(payload, secret)
    const cookieValue = Buffer.from(payload).toString("base64") + "." + sig

    // Set cookie immediately before any slow I/O
    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAME, cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: OTP_TTL_MS / 1000,
    })

    // Fire SMS without blocking the response
    sendSms({
      to: normalized,
      message: `Your SACCO verification code is: ${otp}. It expires in 10 minutes.`,
    }).catch((err) => console.error("[SIGNUP] SMS error:", err))

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[SIGNUP]", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
