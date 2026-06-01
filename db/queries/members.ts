import { isOfflineError } from "@/lib/offline-safe"
import { supabaseAdmin } from "@/lib/supabase/server"

export async function getAllMembers(saccoId: string) {
  const [membersRes, savingsRes, loansRes] = await Promise.all([
    supabaseAdmin
      .from('members')
      .select('*')
      .eq('sacco_id', saccoId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .limit(1000),
    supabaseAdmin
      .from('savings_accounts')
      .select('member_id, balance')
      .eq('sacco_id', saccoId),
    supabaseAdmin
      .from('loans')
      .select('member_id, balance')
      .eq('sacco_id', saccoId)
      .in('status', ['active', 'disbursed']),
  ])

  if (membersRes.error) { if (isOfflineError(membersRes.error)) return []; throw new Error(`Failed to fetch members: ${membersRes.error.message}`) }

  // Build per-member aggregates
  const savingsMap: Record<string, number> = {}
  for (const s of savingsRes.data ?? []) {
    savingsMap[s.member_id] = (savingsMap[s.member_id] ?? 0) + (s.balance ?? 0)
  }

  const loansMap: Record<string, number> = {}
  for (const l of loansRes.data ?? []) {
    loansMap[l.member_id] = (loansMap[l.member_id] ?? 0) + (l.balance ?? 0)
  }

  return membersRes.data.map(member => ({
    id: member.id,
    saccoId: member.sacco_id,
    memberCode: member.member_code,
    fullName: member.full_name,
    email: member.email,
    phone: member.phone,
    nationalId: member.national_id,
    photoUrl: member.photo_url,
    dateOfBirth: member.date_of_birth ? new Date(member.date_of_birth) : null,
    address: member.address,
    nextOfKin: member.next_of_kin,
    nextOfKinPhone: member.next_of_kin_phone,
    nextOfKinRelationship: member.next_of_kin_relationship,
    nextOfKinAddress: member.next_of_kin_address,
    status: member.status,
    joinedAt: new Date(member.joined_at),
    createdAt: new Date(member.created_at),
    updatedAt: new Date(member.updated_at),
    totalSavings: savingsMap[member.id] ?? 0,
    totalLoans: loansMap[member.id] ?? 0,
  }))
}

export async function getMembersForSelect(saccoId: string) {
  const { data, error } = await supabaseAdmin
    .from('members')
    .select('id, full_name, member_code, phone')
    .eq('sacco_id', saccoId)
    .order('full_name', { ascending: true })

  if (error) {
    if (isOfflineError(error)) return []; throw new Error(`Failed to fetch members for select: ${error.message}`)
  }

  return data
}
