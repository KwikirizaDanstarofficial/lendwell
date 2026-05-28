import { supabaseAdmin } from "@/lib/supabase/server"

export type LogAction =
  | "create" | "update" | "delete" | "restore" | "approve" | "decline"
  | "disburse" | "repay" | "top_up" | "deposit" | "withdraw"
  | "pay_fine" | "waive_fine" | "send_sms" | "login" | "logout"
  | "add_guarantor" | "remove_guarantor"

export type LogEntity =
  | "member" | "loan" | "savings" | "fine" | "user"
  | "guarantor" | "next_of_kin" | "notification" | "complaint"

interface LogPayload {
  saccoId: string
  actorId: string
  actorName: string
  actorRole: string
  action: LogAction
  entity: LogEntity
  entityId?: string
  entityRef?: string
  description: string
  metadata?: Record<string, unknown>
}

export async function logActivity(payload: LogPayload) {
  try {
    await supabaseAdmin.from("audit_logs").insert({
      sacco_id:    payload.saccoId,
      actor_id:    payload.actorId,
      actor_name:  payload.actorName,
      actor_role:  payload.actorRole,
      action:      payload.action,
      entity:      payload.entity,
      entity_id:   payload.entityId ?? null,
      entity_ref:  payload.entityRef ?? null,
      description: payload.description,
      metadata:    payload.metadata ?? null,
    })
  } catch (err) {
    // Non-fatal — log failures must never break the main action
    console.error("[activity-log] failed to write:", err)
  }
}
