import { supabaseAdmin } from "@/lib/supabase/server"

export interface ActivityLog {
  id: string
  saccoId: string
  actorId: string | null
  actorName: string | null
  actorRole: string | null
  action: string
  entity: string
  entityId: string | null
  entityRef: string | null
  description: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
}

export async function getActivityLogs(saccoId: string, limit = 200): Promise<ActivityLog[]> {
  const { data, error } = await supabaseAdmin
    .from("audit_logs")
    .select("id, sacco_id, actor_id, actor_name, actor_role, action, entity, entity_id, entity_ref, description, metadata, created_at")
    .eq("sacco_id", saccoId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) throw new Error(`Failed to fetch activity logs: ${error.message}`)

  return (data ?? []).map((r) => ({
    id:          r.id,
    saccoId:     r.sacco_id,
    actorId:     r.actor_id,
    actorName:   r.actor_name,
    actorRole:   r.actor_role,
    action:      r.action,
    entity:      r.entity,
    entityId:    r.entity_id,
    entityRef:   r.entity_ref,
    description: r.description,
    metadata:    r.metadata,
    createdAt:   r.created_at,
  }))
}
