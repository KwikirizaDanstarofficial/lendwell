import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email?.trim())
      return NextResponse.json({ error: "Email address is required." }, { status: 400 })

    const supabase = await createSupabaseServerClient()

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      {
        redirectTo: `${process.env.APP_URL}/auth/update-password`,
      }
    )

    if (error) {
      console.error("[RESET-PASSWORD]", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Always return success — never reveal whether the email exists
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[RESET-PASSWORD]", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
