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
  offlineAddInterestRate, offlineUpdateInterestRate,
  offlineDeactivateInterestRate, offlineActivateInterestRate, offlineDeleteInterestRate,
  offlineAddLoanCategory, offlineDeleteLoanCategory,
  offlineAddSavingsCategory, offlineDeleteSavingsCategory,
  offlineAddFineCategory, offlineDeleteFineCategory,
  offlineCreateBranch, offlineUpdateBranch, offlineDeleteBranch,
  offlineAddDocument, offlineDeleteDocument,
  offlineSendNotification, offlineMarkNotificationRead, offlineDeleteNotification,
  offlineAddNextOfKin, offlineUpdateNextOfKin, offlineDeleteNextOfKin,
  offlineUpdateSacco,
  offlineAddExpense, offlineUpdateExpense, offlineDeleteExpense,
  offlineAddBankAccount, offlineUpdateBankAccount, offlineDeleteBankAccount,
  offlineRecordBankingTransaction, offlineDeleteBankingTransaction,
} from "./offline-mutations"

export {
  offlineAddMember, offlineEditMember, offlineDeleteMember, offlineUpdateMemberStatus,
  offlineAddLoan, offlineRepayLoan, offlineDeleteLoan,
  offlineApproveLoan, offlineDisburseLoan, offlineDeclineLoan, offlineTopUpLoan,
  offlineCreateSavingsAccount, offlineDeposit, offlineWithdraw,
  offlineLockAccount, offlineUnlockAccount, offlineDeleteSavingsAccount, offlineTrimToLoan,
  offlineAddFine, offlineMarkFinePaid, offlineWaiveFine, offlineDeleteFine,
  offlineAddInterestRate, offlineUpdateInterestRate,
  offlineDeactivateInterestRate, offlineActivateInterestRate, offlineDeleteInterestRate,
  offlineAddLoanCategory, offlineDeleteLoanCategory,
  offlineAddSavingsCategory, offlineDeleteSavingsCategory,
  offlineAddFineCategory, offlineDeleteFineCategory,
  offlineCreateBranch, offlineUpdateBranch, offlineDeleteBranch,
  offlineAddDocument, offlineDeleteDocument,
  offlineSendNotification, offlineMarkNotificationRead, offlineDeleteNotification,
  offlineAddNextOfKin, offlineUpdateNextOfKin, offlineDeleteNextOfKin,
  offlineUpdateSacco,
  offlineAddExpense, offlineUpdateExpense, offlineDeleteExpense,
  offlineAddBankAccount, offlineUpdateBankAccount, offlineDeleteBankAccount,
  offlineRecordBankingTransaction, offlineDeleteBankingTransaction,
}

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
    // Interest Rates
    addInterestRate:       (data: Parameters<typeof offlineAddInterestRate>[2]) =>
                            offlineAddInterestRate(db, saccoId, data),
    updateInterestRate:    (id: string, data: Parameters<typeof offlineUpdateInterestRate>[2]) =>
                            offlineUpdateInterestRate(db, id, data),
    deactivateInterestRate: (id: string) => offlineDeactivateInterestRate(db, id),
    activateInterestRate:   (id: string) => offlineActivateInterestRate(db, id),
    deleteInterestRate:    (id: string) => offlineDeleteInterestRate(db, id),
    // Loan Categories
    addLoanCategory:    (data: Parameters<typeof offlineAddLoanCategory>[2]) =>
                         offlineAddLoanCategory(db, saccoId, data),
    deleteLoanCategory: (id: string) => offlineDeleteLoanCategory(db, id),
    // Savings Categories
    addSavingsCategory:    (data: Parameters<typeof offlineAddSavingsCategory>[2]) =>
                            offlineAddSavingsCategory(db, saccoId, data),
    deleteSavingsCategory: (id: string) => offlineDeleteSavingsCategory(db, id),
    // Fine Categories
    addFineCategory:    (data: Parameters<typeof offlineAddFineCategory>[2]) =>
                         offlineAddFineCategory(db, saccoId, data),
    deleteFineCategory: (id: string) => offlineDeleteFineCategory(db, id),
    // Branches
    createBranch: (data: Parameters<typeof offlineCreateBranch>[2]) =>
                    offlineCreateBranch(db, saccoId, data),
    updateBranch: (id: string, data: Parameters<typeof offlineUpdateBranch>[2]) =>
                    offlineUpdateBranch(db, id, data),
    deleteBranch: (id: string) => offlineDeleteBranch(db, id),
    // Documents
    addDocument:    (data: Parameters<typeof offlineAddDocument>[2]) =>
                     offlineAddDocument(db, saccoId, data),
    deleteDocument: (id: string) => offlineDeleteDocument(db, id),
    // Notifications
    sendNotification:      (data: Parameters<typeof offlineSendNotification>[2]) =>
                            offlineSendNotification(db, saccoId, data),
    markNotificationRead:  (id: string) => offlineMarkNotificationRead(db, id),
    deleteNotification:    (id: string) => offlineDeleteNotification(db, id),
    // Next of Kin
    addNextOfKin:    (data: Parameters<typeof offlineAddNextOfKin>[2]) =>
                      offlineAddNextOfKin(db, saccoId, data),
    updateNextOfKin: (id: string, data: Parameters<typeof offlineUpdateNextOfKin>[2]) =>
                      offlineUpdateNextOfKin(db, id, data),
    deleteNextOfKin: (id: string) => offlineDeleteNextOfKin(db, id),
    // Saccos
    updateSacco: (id: string, data: Parameters<typeof offlineUpdateSacco>[2]) =>
                   offlineUpdateSacco(db, id, data),
    // Expenses
    addExpense:    (data: Parameters<typeof offlineAddExpense>[2]) =>
                    offlineAddExpense(db, saccoId, data),
    updateExpense: (id: string, data: Parameters<typeof offlineUpdateExpense>[2]) =>
                    offlineUpdateExpense(db, id, data),
    deleteExpense: (id: string) => offlineDeleteExpense(db, id),
    // Bank Accounts
    addBankAccount:    (data: Parameters<typeof offlineAddBankAccount>[2]) =>
                        offlineAddBankAccount(db, saccoId, data),
    updateBankAccount: (id: string, data: Parameters<typeof offlineUpdateBankAccount>[2]) =>
                        offlineUpdateBankAccount(db, id, data),
    deleteBankAccount: (id: string) => offlineDeleteBankAccount(db, id),
    // Banking Transactions
    recordBankingTransaction: (data: Parameters<typeof offlineRecordBankingTransaction>[2]) =>
                               offlineRecordBankingTransaction(db, saccoId, data),
    deleteBankingTransaction: (id: string) => offlineDeleteBankingTransaction(db, id),
  }
}
