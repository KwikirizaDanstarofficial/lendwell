"use client"

import { usePowerSync } from "@powersync/react"
import { useCallback } from "react"
import {
  offlineEditMember, offlineDeleteMember, offlineUpdateMemberStatus,
  offlineAddLoan, offlineRepayLoan, offlineDeleteLoan,
  offlineCreateSavingsAccount, offlineDeposit, offlineWithdraw,
  offlineAddFine, offlineMarkFinePaid, offlineWaiveFine, offlineDeleteFine,
} from "./offline-mutations"

export { offlineEditMember, offlineDeleteMember, offlineUpdateMemberStatus,
  offlineAddLoan, offlineRepayLoan, offlineDeleteLoan,
  offlineCreateSavingsAccount, offlineDeposit, offlineWithdraw,
  offlineAddFine, offlineMarkFinePaid, offlineWaiveFine, offlineDeleteFine }

export function useOfflineMutations(saccoId: string) {
  const db = usePowerSync()
  const isOffline = () =>
    typeof navigator !== "undefined" && !navigator.onLine

  return {
    db,
    isOffline,
    // Members
    addMember:          (data: Parameters<typeof offlineEditMember>[2]) =>
                          offlineEditMember(db, "", data as any),
    editMember:         (id: string, data: Parameters<typeof offlineEditMember>[2]) =>
                          offlineEditMember(db, id, data),
    deleteMember:       (id: string) => offlineDeleteMember(db, id),
    updateMemberStatus: (id: string, status: string) =>
                          offlineUpdateMemberStatus(db, id, status),
    // Loans
    addLoan:    (data: Parameters<typeof offlineAddLoan>[2]) =>
                  offlineAddLoan(db, saccoId, data),
    repayLoan:  (loanId: string, memberId: string, amount: number) =>
                  offlineRepayLoan(db, saccoId, loanId, memberId, amount),
    deleteLoan: (id: string) => offlineDeleteLoan(db, id),
    // Savings
    createSavingsAccount: (data: Parameters<typeof offlineCreateSavingsAccount>[2]) =>
                            offlineCreateSavingsAccount(db, saccoId, data),
    deposit:  (accountId: string, memberId: string, amount: number, narration?: string) =>
                offlineDeposit(db, saccoId, accountId, memberId, amount, narration),
    withdraw: (accountId: string, memberId: string, amount: number, narration?: string) =>
                offlineWithdraw(db, saccoId, accountId, memberId, amount, narration),
    // Fines
    addFine:       (data: Parameters<typeof offlineAddFine>[2]) =>
                     offlineAddFine(db, saccoId, data),
    markFinePaid:  (id: string, paymentMethod?: string) =>
                     offlineMarkFinePaid(db, id, paymentMethod),
    waiveFine:     (id: string) => offlineWaiveFine(db, id),
    deleteFine:    (id: string) => offlineDeleteFine(db, id),
  }
}
