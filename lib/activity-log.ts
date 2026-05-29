/**
 * activity-log.ts
 *
 * Audit-logging service for the SACCO application.
 * Writes a row to the `audit_logs` table whenever a meaningful action occurs
 * (create, update, delete, approve, disburse, repay, etc.).
 *
 * Failures are silently caught — a logging error must never block the
 * main user action that triggered it.
 */

import { supabaseAdmin } from "@/lib/supabase/server"

// ─── Constants ────────────────────────────────────────────────────────────────

/** Database table that stores all audit events. */
const AUDIT_LOG_TABLE = "audit_logs"

// ─── Types ────────────────────────────────────────────────────────────────────

/** All verbs that can appear in an audit log entry. */
export type LogAction =
  | "create" | "update" | "delete" | "restore"
  | "approve" | "decline" | "disburse" | "repay"
  | "top_up" | "deposit" | "withdraw"
  | "pay_fine" | "waive_fine" | "send_sms"
  | "login" | "logout"
  | "add_guarantor" | "remove_guarantor"

/** All entity types that can be the subject of an audit log entry. */
export type LogEntity =
  | "member" | "loan" | "savings" | "fine" | "user"
  | "guarantor" | "next_of_kin" | "notification" | "complaint"

/** Full payload required to write one audit log row. */
interface LogPayload {
  /** SACCO the action occurred within. */
  saccoId: string
  /** User ID of the person who performed the action. */
  actorId: string
  /** Display name of the actor (for human-readable log views). */
  actorName: string
  /** Role of the actor at the time of the action. */
  actorRole: string
  /** What was done (verb). */
  action: LogAction
  /** What was acted upon (noun). */
  entity: LogEntity
  /** Primary key of the affected record (optional). */
  entityId?: string
  /** Human-readable reference of the affected record, e.g. loan_ref or member_code (optional). */
  entityRef?: string
  /** Human-readable summary of the event. */
  description: string
  /** Any additional structured data relevant to the event. */
  metadata?: Record<string, unknown>
}

// ─── Service function ─────────────────────────────────────────────────────────

/**
 * Write one audit-log entry to the `audit_logs` table.
 *
 * Errors are caught and printed to the console only — the caller is never
 * interrupted by a logging failure.
 *
 * @param payload - All fields describing who did what, to which record, and when.
 */
export async function logActivity(payload: LogPayload): Promise<void> {
  try {
    await supabaseAdmin.from(AUDIT_LOG_TABLE).insert({
      sacco_id:    payload.saccoId,
      actor_id:    payload.actorId,
      actor_name:  payload.actorName,
      actor_role:  payload.actorRole,
      action:      payload.action,
      entity:      payload.entity,
      entity_id:   payload.entityId  ?? null,
      entity_ref:  payload.entityRef ?? null,
      description: payload.description,
      metadata:    payload.metadata  ?? null,
    })
  } catch (err) {
    // Non-fatal — log failures must never block the main action
    console.error("[activity-log] Failed to write audit entry:", err)
  }
}

// ─── Appendix ─────────────────────────────────────────────────────────────────
//
// EXPORTED FUNCTIONS:
//   logActivity(payload)  – insert one audit row; never throws
//
// EXPORTED TYPES:
//   LogAction  – union of all valid action verbs
//   LogEntity  – union of all auditable entity types
//
// KEY CONSTANTS:
//   AUDIT_LOG_TABLE = "audit_logs"
//
// DATABASE TABLE:
//   audit_logs — columns: id, sacco_id, actor_id, actor_name, actor_role,
//                          action, entity, entity_id, entity_ref,
//                          description, metadata, created_at
//
// RELATED FILES:
//   lib/supabase/server.ts              – provides supabaseAdmin
//   app/(dashboard)/loans/actions.ts    – calls logActivity on loan delete
//   app/(dashboard)/members/actions.ts  – calls logActivity on member delete
