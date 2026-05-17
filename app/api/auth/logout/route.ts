import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function POST() {
  const supabase = await createSupabaseServerClient()

  // Sign out from Supabase Auth
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: "Failed to logout" },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
