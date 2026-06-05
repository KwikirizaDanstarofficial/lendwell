import { isOfflineError } from "@/lib/offline-safe"
import { supabaseAdmin } from "@/lib/supabase/server"

export type NextOfKin = {
  id: string
  memberId: string
  saccoId: string
  fullName: string
  relationship: string | null
  phone: string | null
  email: string | null
  address: string | null
  isPrimary: boolean
  createdAt: string
}

export async function getNextOfKinByMember(memberId: string): Promise<NextOfKin[]> {
  const { data, error } = await supabaseAdmin
    .from("next_of_kin")
    .select("*")
    .eq("member_id", memberId)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: true })

  if (error) throw new Error(error.message)

  return (data ?? []).map((r) => ({
    id: r.id,
    memberId: r.member_id,
    saccoId: r.sacco_id,
    fullName: r.full_name,
    relationship: r.relationship,
    phone: r.phone,
    email: r.email,
    address: r.address,
    isPrimary: r.is_primary,
    createdAt: r.created_at,
  }))
}

export async function addNextOfKin(payload: {
  memberId: string
  saccoId: string
  fullName: string
  relationship?: string
  phone?: string
  email?: string
  address?: string
  isPrimary?: boolean
}): Promise<NextOfKin> {
  const { data, error } = await supabaseAdmin
    .from("next_of_kin")
    .insert({
      member_id: payload.memberId,
      sacco_id: payload.saccoId,
      full_name: payload.fullName,
      relationship: payload.relationship ?? null,
      phone: payload.phone ?? null,
      email: payload.email ?? null,
      address: payload.address ?? null,
      is_primary: payload.isPrimary ?? false,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  return {
    id: data.id,
    memberId: data.member_id,
    saccoId: data.sacco_id,
    fullName: data.full_name,
    relationship: data.relationship,
    phone: data.phone,
    email: data.email,
    address: data.address,
    isPrimary: data.is_primary,
    createdAt: data.created_at,
  }
}

export async function updateNextOfKin(
  id: string,
  payload: {
    fullName?: string
    relationship?: string | null
    phone?: string | null
    email?: string | null
    address?: string | null
    isPrimary?: boolean
  }
): Promise<void> {
  const update: Record<string, unknown> = {}
  if (payload.fullName !== undefined) update.full_name = payload.fullName
  if (payload.relationship !== undefined) update.relationship = payload.relationship
  if (payload.phone !== undefined) update.phone = payload.phone
  if (payload.email !== undefined) update.email = payload.email
  if (payload.address !== undefined) update.address = payload.address
  if (payload.isPrimary !== undefined) update.is_primary = payload.isPrimary

  const { error } = await supabaseAdmin.from("next_of_kin").update(update).eq("id", id)
  if (error) throw new Error(error.message)
}

export async function removeNextOfKin(id: string): Promise<void> {
  const { error } = await supabaseAdmin.from("next_of_kin").delete().eq("id", id)
  if (error) throw new Error(error.message)
}
