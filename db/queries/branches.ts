import { isOfflineError } from "@/lib/offline-safe"
import { supabaseAdmin } from "@/lib/supabase/server"

export type Branch = {
  id: string
  saccoId: string
  name: string
  code: string
  address: string | null
  phone: string | null
  email: string | null
  managerId: string | null
  managerName: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export async function getBranches(saccoId: string): Promise<Branch[]> {
  const { data, error } = await supabaseAdmin
    .from("branches")
    .select("*, manager:manager_id(full_name)")
    .eq("sacco_id", saccoId)
    .order("name", { ascending: true })

  if (error) { if (isOfflineError(error)) return []; throw new Error(error.message) }

  return (data ?? []).map((b: any) => ({
    id: b.id,
    saccoId: b.sacco_id,
    name: b.name,
    code: b.code,
    address: b.address,
    phone: b.phone,
    email: b.email,
    managerId: b.manager_id,
    managerName: b.manager?.full_name ?? null,
    isActive: b.is_active,
    createdAt: b.created_at,
    updatedAt: b.updated_at,
  }))
}

export async function getBranchById(id: string): Promise<Branch | null> {
  const { data, error } = await supabaseAdmin
    .from("branches")
    .select("*, manager:manager_id(full_name)")
    .eq("id", id)
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    saccoId: data.sacco_id,
    name: data.name,
    code: data.code,
    address: data.address,
    phone: data.phone,
    email: data.email,
    managerId: data.manager_id,
    managerName: (data as any).manager?.full_name ?? null,
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

export async function createBranch(payload: {
  saccoId: string
  name: string
  code: string
  address?: string
  phone?: string
  email?: string
  managerId?: string
}): Promise<Branch> {
  const { data, error } = await supabaseAdmin
    .from("branches")
    .insert({
      sacco_id: payload.saccoId,
      name: payload.name,
      code: payload.code.toUpperCase(),
      address: payload.address ?? null,
      phone: payload.phone ?? null,
      email: payload.email ?? null,
      manager_id: payload.managerId ?? null,
    })
    .select("*, manager:manager_id(full_name)")
    .single()

  if (error) throw new Error(error.message)

  return {
    id: data.id,
    saccoId: data.sacco_id,
    name: data.name,
    code: data.code,
    address: data.address,
    phone: data.phone,
    email: data.email,
    managerId: data.manager_id,
    managerName: (data as any).manager?.full_name ?? null,
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

export async function updateBranch(
  id: string,
  payload: {
    name?: string
    code?: string
    address?: string | null
    phone?: string | null
    email?: string | null
    managerId?: string | null
    isActive?: boolean
  }
): Promise<void> {
  const update: Record<string, unknown> = {}
  if (payload.name !== undefined) update.name = payload.name
  if (payload.code !== undefined) update.code = payload.code.toUpperCase()
  if (payload.address !== undefined) update.address = payload.address
  if (payload.phone !== undefined) update.phone = payload.phone
  if (payload.email !== undefined) update.email = payload.email
  if (payload.managerId !== undefined) update.manager_id = payload.managerId
  if (payload.isActive !== undefined) update.is_active = payload.isActive

  const { error } = await supabaseAdmin.from("branches").update(update).eq("id", id)
  if (error) throw new Error(error.message)
}

export async function deleteBranch(id: string): Promise<void> {
  // Clear branch_id references first so constraint doesn't block
  await supabaseAdmin.from("members").update({ branch_id: null }).eq("branch_id", id)
  await supabaseAdmin.from("sacco_users").update({ branch_id: null }).eq("branch_id", id)

  const { error } = await supabaseAdmin.from("branches").delete().eq("id", id)
  if (error) throw new Error(error.message)
}
