"use client"

import { usePowerSync } from "@powersync/react"
import { useCallback } from "react"
import {
  offlineAddMember, offlineEditMember, offlineDeleteMember, offlineUpdateMemberStatus,
  offlineAddLoan, offlineRepayLoan, offlineDeleteLoan,
  offlineApproveLoan, offlineDisburseLoan, offlineDeclineLoan, offlineTopUpLoan,
  offlineCreateSavingsAccount, offlineDeposit, offlineWithdraw,
  offlineLockAccount, offlineUnlockAccount, offlineDeleteSavingsAccount, offlineTrimToLoan,
  offlineAddFine, offlineMarkFinePaid, offlineWaiveFine, offlineDeleteFine,
} from "./offline-mutations"

export { offlineAddMember, offlineEditMember, offlineDeleteMember, offlineUpdateMemberStatus,
  offlineAddLoan, offlineRepayLoan, offlineDeleteLoan,
  offlineApproveLoan, offlineDisburseLoan, offlineDeclineLoan, offlineTopUpLoan,
  offlineCreateSavingsAccount, offlineDeposit, offlineWithdraw,
  offlineLockAccount, offlineUnlockAccount, offlineDeleteSavingsAccount, offlineTrimToLoan,
  offlineAddFine, offlineMarkFinePaid, offlineWaiveFine, offlineDeleteFine }

export function useOfflineMutations(saccoId: string) {
  const db = usePowerSync()
  const isOffline = () =>
    typeof navigator !== "undefined" && !navigator.onLine

  return {
    db,
    isOffline,
    // Members
    addMember:          (data: Parameters<typeof offlineAddMember>[2]) =>
                          offlineAddMember(db, saccoId, data),
    editMember:         (id: string, data: Parameters<typeof offlineEditMember>[2]) =>
                          offlineEditMember(db, id, data),
    deleteMember:       (id: string) => offlineDeleteMember(db, id),
    updateMemberStatus: (id: string, status: string) =>
                          offlineUpdateMemberStatus(db, id, status),
    // Loans
    addLoan:       (data: Parameters<typeof offlineAddLoan>[2]) =>
                     offlineAddLoan(db, saccoId, data),
    repayLoan:     (loanId: string, memberId: string, amount: number) =>
                     offlineRepayLoan(db, saccoId, loanId, memberId, amount),
    approveLoan:   (id: string) => offlineApproveLoan(db, id),
    disburseLoan:  (id: string) => offlineDisburseLoan(db, id),
    declineLoan:   (id: string, reason: string) => offlineDeclineLoan(db, id, reason),
    topUpLoan:     (loanId: string, memberId: string, amount: number, reason?: string) =>
                     offlineTopUpLoan(db, saccoId, loanId, memberId, amount, reason),
    deleteLoan:    (id: string) => offlineDeleteLoan(db, id),
    // Savings
    createSavingsAccount: (data: Parameters<typeof offlineCreateSavingsAccount>[2]) =>
                            offlineCreateSavingsAccount(db, saccoId, data),
    deposit:      (accountId: string, memberId: string, amount: number, narration?: string) =>
                    offlineDeposit(db, saccoId, accountId, memberId, amount, narration),
    withdraw:     (accountId: string, memberId: string, amount: number, narration?: string) =>
                    offlineWithdraw(db, saccoId, accountId, memberId, amount, narration),
    lockAccount:  (id: string, lockUntil?: string | null, lockReason?: string | null) =>
                    offlineLockAccount(db, id, lockUntil, lockReason),
    unlockAccount:(id: string) => offlineUnlockAccount(db, id),
    deleteSavingsAccount: (id: string) => offlineDeleteSavingsAccount(db, id),
    trimToLoan: (accountId: string, memberId: string, loanId: string, amount: number) =>
                  offlineTrimToLoan(db, saccoId, accountId, memberId, loanId, amount),
    // Fines
    addFine:       (data: Parameters<typeof offlineAddFine>[2]) =>
                     offlineAddFine(db, saccoId, data),
    markFinePaid:  (id: string, paymentMethod?: string) =>
                     offlineMarkFinePaid(db, id, paymentMethod),
    waiveFine:     (id: string) => offlineWaiveFine(db, id),
    deleteFine:    (id: string) => offlineDeleteFine(db, id),
  }
}
