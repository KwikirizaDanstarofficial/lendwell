import { supabaseAdmin } from "@/lib/supabase/server"

export async function getAllComplaints(saccoId: string) {
  const { data, error } = await supabaseAdmin
    .from('complaints')
    .select(`
      id,
      sacco_id,
      member_id,
      complaint_ref,
      subject,
      body,
      category,
      priority,
      status,
      assigned_to,
      resolution_notes,
      resolved_at,
      resolved_by,
      satisfaction_rating,
      feedback,
      notes,
      created_at,
      updated_at,
      members:member_id (
        full_name,
        member_code,
        phone
      )
    `)
    .eq('sacco_id', saccoId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch complaints: ${error.message}`)
  }

  return (data as any[]).map((complaint) => ({
    id: complaint.id,
    saccoId: complaint.sacco_id,
    memberId: complaint.member_id,
    complaintRef: complaint.complaint_ref,
    subject: complaint.subject,
    body: complaint.body,
    category: complaint.category,
    priority: complaint.priority,
    status: complaint.status,
    assignedTo: complaint.assigned_to,
    resolutionNotes: complaint.resolution_notes,
    resolvedAt: complaint.resolved_at ? new Date(complaint.resolved_at) : null,
    resolvedBy: complaint.resolved_by,
    satisfactionRating: complaint.satisfaction_rating,
    feedback: complaint.feedback,
    notes: complaint.notes,
    createdAt: new Date(complaint.created_at),
    updatedAt: new Date(complaint.updated_at),
    memberName: complaint.members?.full_name,
    memberCode: complaint.members?.member_code,
    memberPhone: complaint.members?.phone,
  }))
}
