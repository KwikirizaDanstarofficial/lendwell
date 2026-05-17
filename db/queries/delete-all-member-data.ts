import { supabaseAdmin } from "@/lib/supabase/server"

export async function deleteMemberData() {
  // Delete in order to avoid foreign key constraints
  await supabaseAdmin.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabaseAdmin.from('fines').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabaseAdmin.from('loans').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabaseAdmin.from('savings_accounts').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  return { success: true }
}
