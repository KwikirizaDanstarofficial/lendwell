import { NextResponse } from "next/server"
import { createSupabaseServerClient, supabaseAdmin } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const { currentPassword, newPassword } = await req.json()

    if (!currentPassword || !newPassword)
      return NextResponse.json({ error: "All fields are required." }, { status: 400 })

    if (newPassword.length < 8)
      return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 })

    if (currentPassword === newPassword)
      return NextResponse.json({ error: "New password must be different from your current password." }, { status: 400 })

    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: sessionError } = await supabase.auth.getUser()

    if (sessionError || !user)
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 })

    // Verify current password by re-authenticating
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    })

    if (signInError)
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 })

    // Update to new password
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })

    if (updateError) {
      console.error("[CHANGE-PASSWORD] update error:", updateError)
      return NextResponse.json({ error: "Failed to update password. Please try again." }, { status: 500 })
    }

    // Clear the temp password flag
    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        has_temp_password: false,
      },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[CHANGE-PASSWORD]", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
