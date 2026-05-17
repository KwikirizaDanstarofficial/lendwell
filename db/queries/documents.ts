import { supabaseAdmin } from "@/lib/supabase/server"

export async function getAllDocuments(saccoId: string) {
  const { data, error } = await supabaseAdmin
    .from('documents')
    .select(`
      id,
      sacco_id,
      type,
      file_name,
      blob_url,
      created_at,
      loan_id,
      member_id,
      members:member_id (
        full_name,
        member_code,
        phone
      )
    `)
    .eq('sacco_id', saccoId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch documents: ${error.message}`)
  }

  return (data as any[]).map(document => ({
    id: document.id,
    saccoId: document.sacco_id,
    type: document.type,
    fileName: document.file_name,
    blobUrl: document.blob_url,
    createdAt: document.created_at,
    loanId: document.loan_id,
    memberId: document.member_id,
    memberName: document.members?.full_name,
    memberCode: document.members?.member_code,
    memberPhone: document.members?.phone,
  }))
}

export async function getMembersForDocuments(saccoId: string) {
  const { data, error } = await supabaseAdmin
    .from('members')
    .select('id, full_name, member_code')
    .eq('sacco_id', saccoId)
    .order('full_name', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch members for documents: ${error.message}`)
  }

  return data.map(member => ({
    id: member.id,
    fullName: member.full_name,
    memberCode: member.member_code,
  }))
}
