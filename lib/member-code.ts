"use server"

import { supabaseAdmin } from "@/lib/supabase/server"

function buildPrefix(saccoId: string): string {
  const year = new Date().getFullYear()
  const shortId = saccoId.slice(0, 4).toUpperCase()
  return `MBR-${year}-${shortId}-`
}

async function getNextSequence(saccoId: string): Promise<number> {
  const prefix = buildPrefix(saccoId)

  const { data } = await supabaseAdmin
    .from('members')
    .select('member_code')
    .like('member_code', `${prefix}%`)
    .order('member_code', { ascending: false })
    .limit(1)

  if (!data || data.length === 0) return 1

  const lastSeq = parseInt(data[0].member_code.slice(prefix.length), 10) || 0
  return lastSeq + 1
}

export async function generateMemberCode(saccoId: string): Promise<string> {
  const prefix = buildPrefix(saccoId)
  const sequence = await getNextSequence(saccoId)
  return `${prefix}${String(sequence).padStart(5, "0")}`
}

export async function generateMemberCodes(
  saccoId: string,
  count: number
): Promise<string[]> {
  const prefix = buildPrefix(saccoId)
  const startSequence = await getNextSequence(saccoId)
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    codes.push(`${prefix}${String(startSequence + i).padStart(5, "0")}`)
  }
  return codes
}
