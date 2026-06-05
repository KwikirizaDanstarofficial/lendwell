"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { addNextOfKin, updateNextOfKin, removeNextOfKin } from "@/db/queries/next-of-kin"
import { logActivity } from "@/lib/activity-log"

export async function addNextOfKinAction(
  memberId: string,
  memberCode: string,
  payload: {
    fullName: string
    relationship?: string
    phone?: string
    email?: string
    address?: string
    isPrimary?: boolean
  }
) {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: "Unauthorized" }

  try {
    const nok = await addNextOfKin({ memberId, saccoId: user.saccoId, ...payload })

    await logActivity({
      saccoId: user.saccoId, actorId: user.userId,
      actorName: user.fullName, actorRole: user.role,
      action: "create", entity: "member",
      entityId: memberId, entityRef: memberCode,
      description: `Added next of kin "${payload.fullName}" for member ${memberCode}`,
    })

    revalidatePath(`/members/${memberId}`)
    return { success: true, id: nok.id }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function updateNextOfKinAction(
  id: string,
  memberId: string,
  memberCode: string,
  payload: {
    fullName?: string
    relationship?: string | null
    phone?: string | null
    email?: string | null
    address?: string | null
    isPrimary?: boolean
  }
) {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: "Unauthorized" }

  try {
    await updateNextOfKin(id, payload)

    await logActivity({
      saccoId: user.saccoId, actorId: user.userId,
      actorName: user.fullName, actorRole: user.role,
      action: "update", entity: "member",
      entityId: memberId, entityRef: memberCode,
      description: `Updated next of kin entry for member ${memberCode}`,
    })

    revalidatePath(`/members/${memberId}`)
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function removeNextOfKinAction(
  id: string,
  memberId: string,
  memberCode: string,
  nokName: string
) {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: "Unauthorized" }

  try {
    await removeNextOfKin(id)

    await logActivity({
      saccoId: user.saccoId, actorId: user.userId,
      actorName: user.fullName, actorRole: user.role,
      action: "delete", entity: "member",
      entityId: memberId, entityRef: memberCode,
      description: `Removed next of kin "${nokName}" from member ${memberCode}`,
    })

    revalidatePath(`/members/${memberId}`)
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}
