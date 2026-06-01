import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard"

  if (code) {
    // Create the redirect response FIRST so cookies can be set on it.
    // If we used NextResponse.redirect() after exchangeCodeForSession(), the
    // session cookies would be written to a discarded response and lost.
    const redirectUrl = `${origin}${safeNext}`
    const response = NextResponse.redirect(redirectUrl)

    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value)
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) return response

    console.error("[AUTH CALLBACK]", error)
  }

  return NextResponse.redirect(`${origin}/auth/login?error=confirmation_failed`)
}
