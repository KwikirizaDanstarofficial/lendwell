import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const { fullName, email, password } = await req.json()

    if (!fullName?.trim() || !email?.trim() || !password)
      return NextResponse.json({ error: "All fields are required." }, { status: 400 })

    if (password.length < 8)
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 })

    const supabase = await createSupabaseServerClient()

    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          role: "admin",
          has_temp_password: false,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })

    if (error) {
      console.error("[SIGNUP]", error)
      if (error.message.toLowerCase().includes("already registered")) {
        return NextResponse.json(
          { error: "This email is already registered. Please sign in instead." },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[SIGNUP]", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
