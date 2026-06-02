export const revalidate = 0
import { requireAuth } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase/server"
import { SavingsDetailPageClient } from "./savings-loader"

export default async function SavingsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth()
  const { id } = await params

  // Attempt server-side pre-fetch so the page is populated instantly when online.
  // When offline the fetches fail silently — the client component falls back to
  // PowerSync's local SQLite which already has the data.
  let initialAccount: any = undefined
  let initialTransactions: any[] = []
  try {
    const [{ data: account }, { data: txData }] = await Promise.all([
      supabaseAdmin
        .from("savings_accounts")
        .select("*, members(full_name, member_code, phone)")
        .eq("id", id)
        .single(),
      supabaseAdmin
        .from("transactions")
        .select("*")
        .eq("reference_id", id)
        .order("created_at", { ascending: false })
        .limit(100),
    ])
    initialAccount = account ? {
      ...account,
      member_name: (account as any).members?.full_name ?? "",
      member_code: (account as any).members?.member_code ?? "",
      member_phone: (account as any).members?.phone ?? null,
    } : undefined
    initialTransactions = txData ?? []
  } catch {
    // Offline — client will load from local PowerSync SQLite
  }

  return <SavingsDetailPageClient id={id} initialAccount={initialAccount} initialTransactions={initialTransactions} />
}
