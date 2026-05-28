import { supabaseAdmin } from "@/lib/supabase/server"

export async function getAllFines(saccoId: string) {
  const { data, error } = await supabaseAdmin
    .from('fines')
    .select(`
      id,
      fine_ref,
      amount,
      reason,
      description,
      status,
      priority,
      due_date,
      paid_at,
      payment_method,
      payment_reference,
      waiver_reason,
      notes,
      created_at,
      updated_at,
      member_id,
      category_id,
      members:member_id (
        full_name,
        member_code,
        phone
      ),
      fine_categories:category_id (
        name
      )
    `)
    .eq('sacco_id', saccoId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch fines: ${error.message}`)
  }

  return (data as any[]).map(fine => ({
    id: fine.id,
    fine_ref: fine.fine_ref,
    amount: fine.amount,
    reason: fine.reason,
    description: fine.description,
    status: fine.status,
    priority: fine.priority,
    due_date: fine.due_date ? new Date(fine.due_date) : null,
    paid_at: fine.paid_at ? new Date(fine.paid_at) : null,
    payment_method: fine.payment_method,
    payment_reference: fine.payment_reference,
    waiver_reason: fine.waiver_reason,
    notes: fine.notes,
    created_at: new Date(fine.created_at),
    updated_at: new Date(fine.updated_at),
    member_id: fine.member_id,
    category_id: fine.category_id,
    member_name: fine.members?.full_name,
    member_code: fine.members?.member_code,
    member_phone: fine.members?.phone,
    category_name: fine.fine_categories?.name,
  }))
}

export async function getFinesStats(saccoId: string) {
  const { data: finesData, error: finesError } = await supabaseAdmin
    .from('fines')
    .select('amount, status')
    .eq('sacco_id', saccoId)

  if (finesError) {
    throw new Error(`Failed to fetch fines stats: ${finesError.message}`)
  }

  let totalAmount = 0
  let pendingAmount = 0
  let paidAmount = 0
  let pendingCount = 0
  let paidCount = 0
  let waivedCount = 0

  for (const fine of finesData ?? []) {
    totalAmount += fine.amount
    if (fine.status === 'pending') {
      pendingAmount += fine.amount
      pendingCount++
    } else if (fine.status === 'paid') {
      paidAmount += fine.amount
      paidCount++
    } else if (fine.status === 'waived') {
      waivedCount++
    }
  }

  return {
    totalAmount,
    totalCount: finesData?.length ?? 0,
    pendingAmount,
    pendingCount,
    paidAmount,
    paidCount,
    waivedCount,
  }
}
