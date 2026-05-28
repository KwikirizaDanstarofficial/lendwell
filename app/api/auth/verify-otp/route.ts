import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createHmac } from "crypto"
import { supabaseAdmin } from "@/lib/supabase/server"
import { sendSms } from "@/lib/sms"
import { generateEmail, generatePassword } from "@/lib/credentials"

const COOKIE_NAME = "sacco_signup_state"

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex")
}

export async function POST(req: Request) {
  try {
    const { otp } = await req.json()

    if (!otp?.trim())
      return NextResponse.json({ error: "Verification code is required." }, { status: 400 })

    const cookieStore = await cookies()
    const cookieValue = cookieStore.get(COOKIE_NAME)?.value

    if (!cookieValue)
      return NextResponse.json({ error: "Session expired. Please start over." }, { status: 400 })

    const dotIndex = cookieValue.lastIndexOf(".")
    if (dotIndex === -1)
      return NextResponse.json({ error: "Invalid session." }, { status: 400 })

    const encoded = cookieValue.slice(0, dotIndex)
    const receivedSig = cookieValue.slice(dotIndex + 1)
    const payload = Buffer.from(encoded, "base64").toString("utf8")

    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const expectedSig = sign(payload, secret)

    if (receivedSig !== expectedSig)
      return NextResponse.json({ error: "Invalid session." }, { status: 400 })

    const state = JSON.parse(payload) as {
      fullName: string
      phone: string
      otp: string
      expires: number
    }

    if (Date.now() > state.expires)
      return NextResponse.json({ error: "Code has expired. Please request a new one." }, { status: 400 })

    if (otp.trim() !== state.otp)
      return NextResponse.json({ error: "Incorrect code. Please try again." }, { status: 400 })

    const email = generateEmail(state.fullName)
    const tempPassword = generatePassword()

    const { error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: state.fullName,
        phone: state.phone,
        role: "admin",
        has_temp_password: true,
      },
    })

    if (createError) {
      console.error("[VERIFY-OTP] User creation failed:", createError)
      return NextResponse.json({ error: "Failed to create account. Please try again." }, { status: 500 })
    }

    // Clear the signup cookie before firing the SMS so response is fast
    cookieStore.set(COOKIE_NAME, "", { maxAge: 0, path: "/" })

    sendSms({
      to: state.phone,
      message: `Your SACCO account has been created.\nEmail: ${email}\nPassword: ${tempPassword}\nLogin at: ${process.env.NEXT_PUBLIC_APP_URL ?? "the app"}\nChange your password after signing in.`,
    }).catch((err) => console.error("[VERIFY-OTP] SMS error:", err))

    return NextResponse.json({ email, tempPassword })
  } catch (err) {
    console.error("[VERIFY-OTP]", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
