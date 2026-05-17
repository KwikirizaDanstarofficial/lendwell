"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server"

async function getMemberCount(saccoId: string): Promise<number> {
  const supabase = await createSupabaseServerClient()
  const { count } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true })
    .eq('sacco_id', saccoId)
  return count ?? 0
}

export async function generateMemberCode(saccoId: string): Promise<string> {
  const count = await getMemberCount(saccoId)
  const year = new Date().getFullYear()
  const sequence = String(count + 1).padStart(5, "0")
  const shortId = saccoId.slice(0, 4).toUpperCase()
  return `MBR-${year}-${shortId}-${sequence}`
}

export async function generateMemberCodes(
  saccoId: string,
  count: number
): Promise<string[]> {
  const existingCount = await getMemberCount(saccoId)
  const year = new Date().getFullYear()
  const shortId = saccoId.slice(0, 4).toUpperCase()
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    const sequence = String(existingCount + i + 1).padStart(5, "0")
    codes.push(`MBR-${year}-${shortId}-${sequence}`)
  }
  return codes
}
