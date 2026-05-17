"use server"

import { supabaseAdmin } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"

export async function clearAllMemberDataAction() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "admin") {
      return { success: false, error: "Not authorized." }
    }

    const saccoId = user.saccoId

    await supabaseAdmin.from("transactions").delete().eq("sacco_id", saccoId)
    await supabaseAdmin.from("fines").delete().eq("sacco_id", saccoId)
    await supabaseAdmin.from("loans").delete().eq("sacco_id", saccoId)
    await supabaseAdmin.from("savings_accounts").delete().eq("sacco_id", saccoId)

    return { success: true, message: "All member data cleared" }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Failed to clear data" }
  }
}
