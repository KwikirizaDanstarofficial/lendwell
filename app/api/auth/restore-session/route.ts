import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function POST(req: NextRequest) {
  try {
    const { accessToken, refreshToken } = await req.json()
    if (!accessToken) {
      return NextResponse.json({ error: "Access token required." }, { status: 400 })
    }

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

    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken ?? accessToken,
    })

    if (error || !data.user) {
      return NextResponse.json({ error: "Invalid session." }, { status: 401 })
    }

    const response = NextResponse.json({ success: true })

    pendingCookies.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options as any)
    })

    return response
  } catch (err) {
    console.error("[RESTORE-SESSION]", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
