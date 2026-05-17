import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user)
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 })

    if (user.user_metadata?.sacco_id)
      return NextResponse.json({ error: "SACCO already created." }, { status: 409 })

    const { saccoName, registrationNumber, country, contactEmail, contactPhone, address, website } = await req.json()
    if (!saccoName?.trim())
      return NextResponse.json({ error: "SACCO name is required." }, { status: 400 })

    const suffix = Date.now().toString(36).toUpperCase()
    const code = saccoName.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) + "-" + suffix
    const slug = saccoName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) + "-" + suffix.toLowerCase()

    const { data: saccoData, error: saccoError } = await supabaseAdmin
      .from("saccos")
      .insert({
        name: saccoName.trim(),
        code,
        slug,
        status: "trial",
        country: country?.trim() || "Uganda",
        registration_number: registrationNumber?.trim() || null,
        contact_email: contactEmail?.trim() || null,
        contact_phone: contactPhone?.trim() || null,
        address: address?.trim() || null,
        website: website?.trim() || null,
      })
      .select("id")
      .single()

    if (saccoError || !saccoData) {
      console.error("[ONBOARDING] sacco error:", saccoError)
      return NextResponse.json({ error: "Failed to create SACCO. Please try again." }, { status: 500 })
    }

    // Update user metadata with sacco_id
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        sacco_id: saccoData.id,
      },
    })

    if (updateError) {
      console.error("[ONBOARDING] metadata update error:", updateError)
      await supabaseAdmin.from("saccos").delete().eq("id", saccoData.id)
      return NextResponse.json({ error: "Failed to link SACCO to account." }, { status: 500 })
    }

    // Create sacco_users row so the admin appears in staff queries.
    // password_hash is NOT NULL in the schema but auth is handled by Supabase Auth,
    // so we store a placeholder that can never match a real bcrypt hash.
    const { error: staffError } = await supabaseAdmin.from("sacco_users").insert({
      sacco_id: saccoData.id,
      full_name: user.user_metadata?.full_name?.trim() || user.email,
      email: user.email,
      role: "admin",
      is_active: true,
      must_change_password: false,
      password_hash: "supabase_auth",
    })
    if (staffError) console.error("[ONBOARDING] sacco_users insert error:", staffError)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[ONBOARDING]", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
