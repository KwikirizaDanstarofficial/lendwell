import { isOfflineError } from "@/lib/offline-safe"
import { supabaseAdmin } from "@/lib/supabase/server"

export async function getAllNotifications(saccoId: string) {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .select(`
      id,
      title,
      body,
      type,
      status,
      priority,
      channel,
      recipient_phone,
      reference_type,
      retry_count,
      error_message,
      scheduled_at,
      sent_at,
      read_at,
      created_at,
      member_id,
      members:member_id (
        full_name,
        member_code,
        phone
      )
    `)
    .eq('sacco_id', saccoId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    if (isOfflineError(error)) return []; throw new Error(`Failed to fetch notifications: ${error.message}`)
  }

  return (data as any[]).map(notification => ({
    id: notification.id,
    title: notification.title,
    body: notification.body,
    type: notification.type,
    status: notification.status,
    priority: notification.priority,
    channel: notification.channel,
    recipientPhone: notification.recipient_phone,
    referenceType: notification.reference_type,
    retryCount: notification.retry_count,
    errorMessage: notification.error_message,
    scheduledAt: notification.scheduled_at ? new Date(notification.scheduled_at) : null,
    sentAt: notification.sent_at ? new Date(notification.sent_at) : null,
    readAt: notification.read_at ? new Date(notification.read_at) : null,
    createdAt: new Date(notification.created_at),
    memberId: notification.member_id,
    memberName: notification.members?.full_name,
    memberCode: notification.members?.member_code,
    memberPhone: notification.members?.phone,
  }))
}

export async function getUnreadNotificationsCount(saccoId: string) {
  const { count, error } = await supabaseAdmin
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('sacco_id', saccoId)

  if (error) {
    if (isOfflineError(error)) return 0; throw new Error(`Failed to count notifications: ${error.message}`)
  }

  return count ?? 0
}

export async function getLatestNotifications(saccoId: string, limit = 5) {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .select(`
      id,
      title,
      body,
      type,
      status,
      channel,
      sent_at,
      read_at,
      created_at,
      members:member_id (
        full_name
      )
    `)
    .eq('sacco_id', saccoId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    if (isOfflineError(error)) return []; throw new Error(`Failed to fetch latest notifications: ${error.message}`)
  }

  return (data as any[]).map(notification => ({
    id: notification.id,
    title: notification.title,
    body: notification.body,
    type: notification.type,
    status: notification.status,
    channel: notification.channel,
    sentAt: notification.sent_at ? new Date(notification.sent_at) : null,
    readAt: notification.read_at ? new Date(notification.read_at) : null,
    createdAt: new Date(notification.created_at),
    memberName: notification.members?.full_name,
  }))
}
