import { db } from "../db"
import {
  auditLogs,
  complaints,
  documents,
  fineCategories,
  fines,
  interestRates,
  loanCategories,
  loanExtensions,
  loanGuarantors,
  loanTopUps,
  loans,
  members,
  notifications,
  saccoUsers,
  saccos,
  savingsAccounts,
  savingsCategories,
  transactions,
} from "../db/schema"

async function resetDb() {
  console.log("Resetting database...")

  // Delete in reverse order of dependencies
  await db.delete(auditLogs)
  await db.delete(complaints)
  await db.delete(documents)
  await db.delete(fines)
  await db.delete(fineCategories)
  await db.delete(loanTopUps)
  await db.delete(loanExtensions)
  await db.delete(loanGuarantors)
  await db.delete(loans)
  await db.delete(interestRates)
  await db.delete(loanCategories)
  await db.delete(transactions)
  await db.delete(savingsAccounts)
  await db.delete(savingsCategories)
  await db.delete(members)
  await db.delete(notifications)
  await db.delete(saccoUsers)
  await db.delete(saccos)

  console.log("Database reset complete")
}

resetDb().catch(console.error)
