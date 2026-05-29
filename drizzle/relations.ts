import { relations } from "drizzle-orm/relations"
import {
  members,
  loanCategories,
  fineCategories,
  fines,
  complaints,
  loans,
  auditLogs,
  savingsCategories,
  savingsAccounts,
  notifications,
  transactions,
  documents,
  loanExtensions,
  loanGuarantors,
  interestRates,
  cmsActivityLogs,
  saccoUsers,
  loanTopUps,
  saccoStats,
  superadmins,
  saccos,
} from "./schema"

// ---------------------------------------------------------------------------
// saccos — root/parent table; all FK references point back here
// ---------------------------------------------------------------------------
export const saccosRelations = relations(saccos, ({ many }) => ({
  members: many(members),
  loanCategories: many(loanCategories),
  fineCategories: many(fineCategories),
  fines: many(fines),
  complaints: many(complaints),
  loans: many(loans),
  auditLogs: many(auditLogs),
  savingsCategories: many(savingsCategories),
  savingsAccounts: many(savingsAccounts),
  notifications: many(notifications),
  transactions: many(transactions),
  documents: many(documents),
  interestRates: many(interestRates),
  saccoUsers: many(saccoUsers),
}))

// ---------------------------------------------------------------------------
// members — FK: saccoId → saccos.id
// ---------------------------------------------------------------------------
export const membersRelations = relations(members, ({ one, many }) => ({
  sacco: one(saccos, {
    fields: [members.saccoId],
    references: [saccos.id],
  }),
  fines: many(fines),
  complaints: many(complaints),
  loans: many(loans),
  savingsAccounts: many(savingsAccounts),
  notifications: many(notifications),
  transactions: many(transactions),
  documents: many(documents),
  loanGuarantors: many(loanGuarantors),
}))

// ---------------------------------------------------------------------------
// loanCategories — FK: saccoId → saccos.id
// ---------------------------------------------------------------------------
export const loanCategoriesRelations = relations(loanCategories, ({ one, many }) => ({
  sacco: one(saccos, {
    fields: [loanCategories.saccoId],
    references: [saccos.id],
  }),
  loans: many(loans),
}))

// ---------------------------------------------------------------------------
// fineCategories — FK: saccoId → saccos.id
// ---------------------------------------------------------------------------
export const fineCategoriesRelations = relations(fineCategories, ({ one, many }) => ({
  sacco: one(saccos, {
    fields: [fineCategories.saccoId],
    references: [saccos.id],
  }),
  fines: many(fines),
}))

// ---------------------------------------------------------------------------
// fines — FKs: saccoId → saccos.id, memberId → members.id,
//               categoryId → fineCategories.id
// ---------------------------------------------------------------------------
export const finesRelations = relations(fines, ({ one }) => ({
  sacco: one(saccos, {
    fields: [fines.saccoId],
    references: [saccos.id],
  }),
  member: one(members, {
    fields: [fines.memberId],
    references: [members.id],
  }),
  category: one(fineCategories, {
    fields: [fines.categoryId],
    references: [fineCategories.id],
  }),
}))

// ---------------------------------------------------------------------------
// complaints — FKs: saccoId → saccos.id, memberId → members.id
// ---------------------------------------------------------------------------
export const complaintsRelations = relations(complaints, ({ one }) => ({
  sacco: one(saccos, {
    fields: [complaints.saccoId],
    references: [saccos.id],
  }),
  member: one(members, {
    fields: [complaints.memberId],
    references: [members.id],
  }),
}))

// ---------------------------------------------------------------------------
// loans — FKs: saccoId → saccos.id, memberId → members.id,
//              categoryId → loanCategories.id, interestRateId → interestRates.id
// ---------------------------------------------------------------------------
export const loansRelations = relations(loans, ({ one, many }) => ({
  sacco: one(saccos, {
    fields: [loans.saccoId],
    references: [saccos.id],
  }),
  member: one(members, {
    fields: [loans.memberId],
    references: [members.id],
  }),
  category: one(loanCategories, {
    fields: [loans.categoryId],
    references: [loanCategories.id],
  }),
  interestRate: one(interestRates, {
    fields: [loans.interestRateId],
    references: [interestRates.id],
  }),
  documents: many(documents),
  loanExtensions: many(loanExtensions),
  loanGuarantors: many(loanGuarantors),
  loanTopUps: many(loanTopUps),
}))

// ---------------------------------------------------------------------------
// auditLogs — FK: saccoId → saccos.id
// ---------------------------------------------------------------------------
export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  sacco: one(saccos, {
    fields: [auditLogs.saccoId],
    references: [saccos.id],
  }),
}))

// ---------------------------------------------------------------------------
// savingsCategories — FK: saccoId → saccos.id
// ---------------------------------------------------------------------------
export const savingsCategoriesRelations = relations(savingsCategories, ({ one, many }) => ({
  sacco: one(saccos, {
    fields: [savingsCategories.saccoId],
    references: [saccos.id],
  }),
  savingsAccounts: many(savingsAccounts),
}))

// ---------------------------------------------------------------------------
// savingsAccounts — FKs: saccoId → saccos.id, memberId → members.id,
//                        categoryId → savingsCategories.id
// ---------------------------------------------------------------------------
export const savingsAccountsRelations = relations(savingsAccounts, ({ one }) => ({
  sacco: one(saccos, {
    fields: [savingsAccounts.saccoId],
    references: [saccos.id],
  }),
  member: one(members, {
    fields: [savingsAccounts.memberId],
    references: [members.id],
  }),
  category: one(savingsCategories, {
    fields: [savingsAccounts.categoryId],
    references: [savingsCategories.id],
  }),
}))

// ---------------------------------------------------------------------------
// notifications — FKs: saccoId → saccos.id, memberId → members.id
// ---------------------------------------------------------------------------
export const notificationsRelations = relations(notifications, ({ one }) => ({
  sacco: one(saccos, {
    fields: [notifications.saccoId],
    references: [saccos.id],
  }),
  member: one(members, {
    fields: [notifications.memberId],
    references: [members.id],
  }),
}))

// ---------------------------------------------------------------------------
// transactions — FKs: saccoId → saccos.id, memberId → members.id
// ---------------------------------------------------------------------------
export const transactionsRelations = relations(transactions, ({ one }) => ({
  sacco: one(saccos, {
    fields: [transactions.saccoId],
    references: [saccos.id],
  }),
  member: one(members, {
    fields: [transactions.memberId],
    references: [members.id],
  }),
}))

// ---------------------------------------------------------------------------
// documents — FKs: saccoId → saccos.id, memberId → members.id,
//                  loanId → loans.id
// ---------------------------------------------------------------------------
export const documentsRelations = relations(documents, ({ one }) => ({
  sacco: one(saccos, {
    fields: [documents.saccoId],
    references: [saccos.id],
  }),
  member: one(members, {
    fields: [documents.memberId],
    references: [members.id],
  }),
  loan: one(loans, {
    fields: [documents.loanId],
    references: [loans.id],
  }),
}))

// ---------------------------------------------------------------------------
// loanExtensions — FK: loanId → loans.id
// ---------------------------------------------------------------------------
export const loanExtensionsRelations = relations(loanExtensions, ({ one }) => ({
  loan: one(loans, {
    fields: [loanExtensions.loanId],
    references: [loans.id],
  }),
}))

// ---------------------------------------------------------------------------
// loanGuarantors — FKs: loanId → loans.id, memberId → members.id
// ---------------------------------------------------------------------------
export const loanGuarantorsRelations = relations(loanGuarantors, ({ one }) => ({
  loan: one(loans, {
    fields: [loanGuarantors.loanId],
    references: [loans.id],
  }),
  member: one(members, {
    fields: [loanGuarantors.memberId],
    references: [members.id],
  }),
}))

// ---------------------------------------------------------------------------
// interestRates — FK: saccoId → saccos.id
// ---------------------------------------------------------------------------
export const interestRatesRelations = relations(interestRates, ({ one, many }) => ({
  sacco: one(saccos, {
    fields: [interestRates.saccoId],
    references: [saccos.id],
  }),
  loans: many(loans),
}))

// ---------------------------------------------------------------------------
// cmsActivityLogs — no foreign key constraints
// ---------------------------------------------------------------------------
export const cmsActivityLogsRelations = relations(cmsActivityLogs, () => ({

}))

// ---------------------------------------------------------------------------
// saccoUsers — FK: saccoId → saccos.id
// ---------------------------------------------------------------------------
export const saccoUsersRelations = relations(saccoUsers, ({ one }) => ({
  sacco: one(saccos, {
    fields: [saccoUsers.saccoId],
    references: [saccos.id],
  }),
}))

// ---------------------------------------------------------------------------
// loanTopUps — FK: loanId → loans.id
// ---------------------------------------------------------------------------
export const loanTopUpsRelations = relations(loanTopUps, ({ one }) => ({
  loan: one(loans, {
    fields: [loanTopUps.loanId],
    references: [loans.id],
  }),
}))

// ---------------------------------------------------------------------------
// saccoStats — no foreign key constraint (unique on saccoId only)
// ---------------------------------------------------------------------------
export const saccoStatsRelations = relations(saccoStats, () => ({

}))

// ---------------------------------------------------------------------------
// superadmins — no foreign key constraints
// ---------------------------------------------------------------------------
export const superadminsRelations = relations(superadmins, () => ({

}))
