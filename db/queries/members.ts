import { supabaseAdmin } from "@/lib/supabase/server"

export async function getAllMembers(saccoId: string) {
  const { data, error } = await supabaseAdmin
    .from('members')
    .select('*')
    .eq('sacco_id', saccoId)
    .order('created_at', { ascending: true })
    .limit(1000)

  if (error) {
    throw new Error(`Failed to fetch members: ${error.message}`)
  }

  return data.map(member => ({
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
  }))
}

export async function getMembersForSelect(saccoId: string) {
  const { data, error } = await supabaseAdmin
    .from('members')
    .select('id, full_name, member_code, phone')
    .eq('sacco_id', saccoId)
    .order('full_name', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch members for select: ${error.message}`)
  }

  return data
}
