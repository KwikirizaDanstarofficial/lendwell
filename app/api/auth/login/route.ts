import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()
    if (!email || !password)
      return NextResponse.json({ error: "Email and password required." }, { status: 400 })

    const supabase = await createSupabaseServerClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    if (error || !data.user) {
      console.error("[LOGIN] Supabase error:", error?.message, error?.status)
      const msg = error?.message ?? ""
      if (msg.toLowerCase().includes("email not confirmed")) {
        return NextResponse.json(
          { error: "Please confirm your email address before logging in. Check your inbox." },
          { status: 401 }
        )
      }
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 })
    }

    const meta = data.user.user_metadata

    return NextResponse.json({
      success: true,
      role: meta?.role,
      fullName: meta?.full_name,
      branchCode: meta?.branch_code ?? null,
    })
  } catch (err) {
    console.error("[LOGIN]", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
