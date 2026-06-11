export const revalidate = 0
import { requireAuth } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase/server"
import { EditPageClient } from "./edit-page-loader"

export default async function EditLoanPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth()
  const { id } = await params

  let initialLoan: any = undefined
  try {
    const { data: loan } = await supabaseAdmin
      .from("loans")
      .select("*, members:member_id(full_name, member_code)")
      .eq("id", id)
      .single()
    initialLoan = loan ?? undefined
  } catch {
    // Offline — client will load loan from local PowerSync SQLite
  }

  return <EditPageClient id={id} initialLoan={initialLoan} />
}
