"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { addGuarantor, removeGuarantor, updateGuarantorStatus } from "@/db/queries/guarantors"
import { logActivity } from "@/lib/activity-log"
import { isOfflineError } from "@/lib/offline-safe"

export async function addGuarantorAction(loanId: string, memberId: string, loanRef: string, notes?: string) {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: "Unauthorized" }

  try {
    await addGuarantor({ loanId, saccoId: user.saccoId, memberId, notes })
    await logActivity({
      saccoId: user.saccoId, actorId: user.userId,
      actorName: user.fullName, actorRole: user.role,
      action: "add_guarantor", entity: "guarantor",
      entityRef: loanRef,
      description: `Added guarantor to loan ${loanRef}`,
    })
    revalidatePath(`/loans/${loanId}`)
    return { success: true }
  } catch (err: any) {
    if (isOfflineError(err)) return { success: false, offline: true, error: "offline" }
    return { success: false, error: err.message }
  }
}

export async function removeGuarantorAction(guarantorId: string, loanId: string, loanRef: string) {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: "Unauthorized" }

  try {
    await removeGuarantor(guarantorId)
    await logActivity({
      saccoId: user.saccoId, actorId: user.userId,
      actorName: user.fullName, actorRole: user.role,
      action: "remove_guarantor", entity: "guarantor",
      entityRef: loanRef,
      description: `Removed guarantor from loan ${loanRef}`,
    })
    revalidatePath(`/loans/${loanId}`)
    return { success: true }
  } catch (err: any) {
    if (isOfflineError(err)) return { success: false, offline: true, error: "offline" }
    return { success: false, error: err.message }
  }
}

export async function updateGuarantorStatusAction(
  guarantorId: string,
  loanId: string,
  loanRef: string,
  status: "pending" | "accepted" | "declined",
  notes?: string
) {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: "Unauthorized" }

  try {
    await updateGuarantorStatus(guarantorId, status, notes)
    await logActivity({
      saccoId: user.saccoId, actorId: user.userId,
      actorName: user.fullName, actorRole: user.role,
      action: "update", entity: "guarantor",
      entityRef: loanRef,
      description: `Guarantor status updated to "${status}" on loan ${loanRef}`,
    })
    revalidatePath(`/loans/${loanId}`)
    return { success: true }
  } catch (err: any) {
    if (isOfflineError(err)) return { success: false, offline: true, error: "offline" }
    return { success: false, error: err.message }
  }
}
