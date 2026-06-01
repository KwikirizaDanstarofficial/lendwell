import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password)
      return NextResponse.json({ error: "Email and password required." }, { status: 400 })

    // Collect cookies set by Supabase so we can attach them to the response we return.
    // Using cookies().set() + NextResponse.json() loses the session because they are
    // separate response objects. We buffer cookies here and set them on the final response.
    const pendingCookies: { name: string; value: string; options: Record<string, unknown> }[] = []

    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return req.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach((c) => pendingCookies.push(c))
          },
        },
      }
    )

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

    const hasSaccoId = Boolean(meta?.sacco_id)

    const response = NextResponse.json({
      success: true,
      role: meta?.role,
      fullName: meta?.full_name,
      branchCode: meta?.branch_code ?? null,
      hasSaccoId,
    })

    // Attach session cookies to the response
    pendingCookies.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options as any)
    })

    return response
  } catch (err) {
    console.error("[LOGIN]", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
