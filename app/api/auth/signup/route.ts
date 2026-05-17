import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const { fullName, email, password } = await req.json()

    if (!fullName || !email || !password)
      return NextResponse.json({ error: "All fields are required." }, { status: 400 })

    if (password.length < 8)
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 })

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

    const supabase = await createSupabaseServerClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: `${appUrl}/auth/callback?next=/onboarding`,
        data: { full_name: fullName.trim(), role: "admin" },
      },
    })

    if (signUpError) {
      console.error("[SIGNUP]", signUpError)
      const msg = signUpError.message?.toLowerCase().includes("already registered")
        ? "An account with this email already exists."
        : "Sign up failed. Please try again."
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    const needsConfirmation = data.user && !data.session
    return NextResponse.json({ success: true, needsConfirmation })
  } catch (err) {
    console.error("[SIGNUP]", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
