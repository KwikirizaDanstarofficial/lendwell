"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase/server"
import { logActivity } from "@/lib/activity-log"

type Table = "members" | "loans" | "fines"

export async function restoreRecordAction(table: Table, id: string, ref: string) {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: "Unauthorized" }

  const { error } = await supabaseAdmin
    .from(table)
    .update({ deleted_at: null })
    .eq("id", id)

  if (error) return { success: false, error: error.message }

  await logActivity({
    saccoId: user.saccoId, actorId: user.userId,
    actorName: user.fullName, actorRole: user.role,
    action: "restore", entity: table.replace("_accounts", "") as any,
    entityId: id, entityRef: ref,
    description: `Restored ${table.slice(0, -1)} ${ref} from recycle bin`,
  })

  revalidatePath("/recycle-bin")
  revalidatePath(`/${table}`)
  return { success: true }
}

export async function permanentDeleteAction(table: Table, id: string, ref: string) {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: "Unauthorized" }
  if (user.role !== "admin") return { success: false, error: "Only admins can permanently delete records" }

  const { error } = await supabaseAdmin
    .from(table)
    .delete()
    .eq("id", id)

  if (error) return { success: false, error: error.message }

  await logActivity({
    saccoId: user.saccoId, actorId: user.userId,
    actorName: user.fullName, actorRole: user.role,
    action: "delete", entity: table as any,
    entityId: id, entityRef: ref,
    description: `Permanently deleted ${table.slice(0, -1)} ${ref}`,
  })

  revalidatePath("/recycle-bin")
  return { success: true }
}
