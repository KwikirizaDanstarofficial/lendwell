import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function POST(req: NextRequest) {
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

  // Attempt Supabase signOut; swallow network errors when offline
  try {
    await supabase.auth.signOut()
  } catch {
    // Offline — continue to clear cookies
  }

  const response = NextResponse.json({ success: true })
  pendingCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options as any)
  })
  return response
}
