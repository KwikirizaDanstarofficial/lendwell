import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const { phone, otp } = await req.json()
    if (!phone || !otp) {
      return NextResponse.json(
        { error: "Phone and OTP required" },
        { status: 400 }
      )
    }

    // Verify the OTP via Supabase phone auth — this also sets the session cookies
    const supabase = await createSupabaseServerClient()
    const { data: otpData, error: otpError } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: "sms",
    })

    if (otpError || !otpData.user) {
      console.error("[LOGIN-OTP] OTP verification failed:", otpError?.message)
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 })
    }

    // Look up the staff profile using the admin client to bypass RLS
    const { data: userProfile, error: userError } = await supabaseAdmin
      .from("sacco_users")
      .select("id, full_name, role, is_active")
      .eq("phone", phone)
      .single()

    if (userError || !userProfile) {
      return NextResponse.json({ error: "Staff profile not found" }, { status: 404 })
    }

    if (!userProfile.is_active) {
      return NextResponse.json({ error: "Account is deactivated" }, { status: 403 })
    }

    await supabaseAdmin
      .from("sacco_users")
      .update({
        last_login_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", userProfile.id)

    return NextResponse.json({
      success: true,
      role: userProfile.role,
      fullName: userProfile.full_name,
    })
  } catch (err) {
    console.error("[LOGIN-OTP]", err)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
