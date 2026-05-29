import {
  pgTable,
  foreignKey,
  unique,
  check,
  uuid,
  text,
  date,
  timestamp,
  integer,
  numeric,
  boolean,
  jsonb,
  bigint,
  pgEnum,
} from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

// Drizzle ORM schema definition for all database tables.
// Tables: members, loanCategories, fineCategories, fines, complaints, loans, auditLogs,
//   savingsCategories, savingsAccounts, notifications, transactions, documents,
//   loanExtensions, loanGuarantors, interestRates, cmsActivityLogs, saccoUsers,
//   loanTopUps, saccoStats, superadmins, saccos

export const complaintStatus = pgEnum("complaint_status", [
  "open",
  "in_progress",
  "resolved",
])
export const documentType = pgEnum("document_type", [
  "national_id",
  "registration_form",
  "loan_contract",
  "membership_certificate",
  "other",
])
export const fineStatus = pgEnum("fine_status", ["pending", "paid", "waived"])
export const interestType = pgEnum("interest_type", [
  "daily",
  "monthly",
  "annual",
])
export const loanStatus = pgEnum("loan_status", [
  "pending",
  "verified",
  "approved",
  "declined",
  "disbursed",
  "active",
  "extended",
  "settled",
  "defaulted",
])
export const memberStatus = pgEnum("member_status", [
  "active",
  "suspended",
  "exited",
])
export const notificationStatus = pgEnum("notification_status", [
  "pending",
  "sent",
  "failed",
])
export const notificationType = pgEnum("notification_type", ["sms", "in_app"])
export const paymentMethod = pgEnum("payment_method", [
  "cash",
  "mobile_money",
  "bank",
  "flutterwave",
  "mtn",
  "airtel",
])
export const saccoStatus = pgEnum("sacco_status", [
  "active",
  "suspended",
  "trial",
  "cancelled",
])
export const savingsAccountType = pgEnum("savings_account_type", [
  "regular",
  "fixed",
])
export const superadminRole = pgEnum("superadmin_role", [
  "superadmin",
  "support",
])
export const transactionType = pgEnum("transaction_type", [
  "loan_disbursement",
  "loan_repayment",
  "savings_deposit",
  "savings_withdrawal",
  "fine_payment",
])
export const userRole = pgEnum("user_role", ["admin", "cashier", "field_agent"])

export const members = pgTable(
  "members",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    saccoId: uuid("sacco_id").notNull(),
    memberCode: text("member_code").notNull(),
    fullName: text("full_name").notNull(),
    email: text(),
    phone: text(),
    nationalId: text("national_id"),
    photoUrl: text("photo_url"),
    dateOfBirth: date("date_of_birth"),
    address: text(),
    nextOfKin: text("next_of_kin"),
    nextOfKinPhone: text("next_of_kin_phone"),
    nextOfKinRelationship: text("next_of_kin_relationship"),
    nextOfKinAddress: text("next_of_kin_address"),
    status: memberStatus().default("active").notNull(),
    joinedAt: timestamp("joined_at", { mode: "string" }).defaultNow(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
  },
  (table) => {
    return {
      membersSaccoIdSaccosIdFk: foreignKey({
        columns: [table.saccoId],
        foreignColumns: [saccos.id],
        name: "members_sacco_id_saccos_id_fk",
      }),
      membersMemberCodeUnique: unique("members_member_code_unique").on(
        table.memberCode
      ),
    }
  }
)

export const loanCategories = pgTable(
  "loan_categories",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    saccoId: uuid("sacco_id").notNull(),
    name: text().notNull(),
    description: text(),
    minAmount: integer("min_amount").default(0),
    maxAmount: integer("max_amount").notNull(),
    interestRate: numeric("interest_rate").default("0").notNull(),
    maxDurationMonths: integer("max_duration_months").default(12),
    requiresGuarantor: boolean("requires_guarantor").default(false),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
  },
  (table) => {
    return {
      loanCategoriesSaccoIdSaccosIdFk: foreignKey({
        columns: [table.saccoId],
        foreignColumns: [saccos.id],
        name: "loan_categories_sacco_id_saccos_id_fk",
      }),
    }
  }
)

export const fineCategories = pgTable(
  "fine_categories",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    saccoId: uuid("sacco_id").notNull(),
    name: text().notNull(),
    defaultAmount: integer("default_amount").default(0),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
  },
  (table) => {
    return {
      fineCategoriesSaccoIdSaccosIdFk: foreignKey({
        columns: [table.saccoId],
        foreignColumns: [saccos.id],
        name: "fine_categories_sacco_id_saccos_id_fk",
      }),
    }
  }
)

export const fines = pgTable(
  "fines",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    saccoId: uuid("sacco_id").notNull(),
    memberId: uuid("member_id").notNull(),
    categoryId: uuid("category_id"),
    amount: integer().notNull(),
    reason: text(),
    status: fineStatus().default("pending").notNull(),
    paidAt: timestamp("paid_at", { mode: "string" }),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    fineRef: text("fine_ref"),
    description: text(),
    priority: text().default("normal"),
    dueDate: date("due_date"),
    paymentMethod: paymentMethod("payment_method"),
    paymentReference: text("payment_reference"),
    waivedBy: uuid("waived_by"),
    waiverReason: text("waiver_reason"),
    notes: text(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
  },
  (table) => {
    return {
      finesSaccoIdSaccosIdFk: foreignKey({
        columns: [table.saccoId],
        foreignColumns: [saccos.id],
        name: "fines_sacco_id_saccos_id_fk",
      }),
      finesMemberIdMembersIdFk: foreignKey({
        columns: [table.memberId],
        foreignColumns: [members.id],
        name: "fines_member_id_members_id_fk",
      }),
      finesCategoryIdFineCategoriesIdFk: foreignKey({
        columns: [table.categoryId],
        foreignColumns: [fineCategories.id],
        name: "fines_category_id_fine_categories_id_fk",
      }),
      finesFineRefUnique: unique("fines_fine_ref_unique").on(table.fineRef),
    }
  }
)

export const complaints = pgTable(
  "complaints",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    saccoId: uuid("sacco_id").notNull(),
    memberId: uuid("member_id"),
    subject: text().notNull(),
    body: text().notNull(),
    status: complaintStatus().default("open"),
    resolvedAt: timestamp("resolved_at", { mode: "string" }),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    complaintRef: text("complaint_ref"),
    category: text().default("general"),
    priority: text().default("normal"),
    assignedTo: uuid("assigned_to"),
    resolutionNotes: text("resolution_notes"),
    resolvedBy: uuid("resolved_by"),
    satisfactionRating: integer("satisfaction_rating"),
    feedback: text(),
    notes: text(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
  },
  (table) => {
    return {
      complaintsSaccoIdSaccosIdFk: foreignKey({
        columns: [table.saccoId],
        foreignColumns: [saccos.id],
        name: "complaints_sacco_id_saccos_id_fk",
      }),
      complaintsMemberIdMembersIdFk: foreignKey({
        columns: [table.memberId],
        foreignColumns: [members.id],
        name: "complaints_member_id_members_id_fk",
      }),
      complaintsComplaintRefUnique: unique(
        "complaints_complaint_ref_unique"
      ).on(table.complaintRef),
    }
  }
)

export const loans = pgTable(
  "loans",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    saccoId: uuid("sacco_id").notNull(),
    memberId: uuid("member_id").notNull(),
    categoryId: uuid("category_id"),
    loanRef: text("loan_ref").notNull(),
    amount: integer().notNull(),
    balance: integer().notNull(),
    interestRate: numeric("interest_rate").notNull(),
    status: loanStatus().default("pending").notNull(),
    dueDate: date("due_date"),
    disbursedAt: timestamp("disbursed_at", { mode: "string" }),
    settledAt: timestamp("settled_at", { mode: "string" }),
    declineReason: text("decline_reason"),
    notes: text(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
    interestRateId: uuid("interest_rate_id"),
    expectedReceived: integer("expected_received").notNull(),
    interestType: interestType("interest_type").default("monthly"),
    durationMonths: integer("duration_months").default(12),
    latePenaltyFee: integer("late_penalty_fee").default(0),
    dailyPayment: integer("daily_payment").default(0),
    monthlyPayment: integer("monthly_payment").default(0),
  },
  (table) => {
    return {
      loansSaccoIdSaccosIdFk: foreignKey({
        columns: [table.saccoId],
        foreignColumns: [saccos.id],
        name: "loans_sacco_id_saccos_id_fk",
      }),
      loansMemberIdMembersIdFk: foreignKey({
        columns: [table.memberId],
        foreignColumns: [members.id],
        name: "loans_member_id_members_id_fk",
      }),
      loansCategoryIdLoanCategoriesIdFk: foreignKey({
        columns: [table.categoryId],
        foreignColumns: [loanCategories.id],
        name: "loans_category_id_loan_categories_id_fk",
      }),
      loansInterestRateIdInterestRatesIdFk: foreignKey({
        columns: [table.interestRateId],
        foreignColumns: [interestRates.id],
        name: "loans_interest_rate_id_interest_rates_id_fk",
      }),
      loansLoanRefUnique: unique("loans_loan_ref_unique").on(table.loanRef),
    }
  }
)

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    saccoId: uuid("sacco_id").notNull(),
    action: text().notNull(),
    entity: text().notNull(),
    entityId: uuid("entity_id"),
    diff: text(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    actorId: uuid("actor_id"),
    actorName: text("actor_name"),
    actorRole: text("actor_role"),
    ipAddress: text("ip_address"),
  },
  (table) => {
    return {
      auditLogsSaccoIdSaccosIdFk: foreignKey({
        columns: [table.saccoId],
        foreignColumns: [saccos.id],
        name: "audit_logs_sacco_id_saccos_id_fk",
      }),
    }
  }
)

export const savingsCategories = pgTable(
  "savings_categories",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    saccoId: uuid("sacco_id").notNull(),
    name: text().notNull(),
    description: text(),
    interestRate: numeric("interest_rate").default("0"),
    isFixed: boolean("is_fixed").default(false),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
  },
  (table) => {
    return {
      savingsCategoriesSaccoIdSaccosIdFk: foreignKey({
        columns: [table.saccoId],
        foreignColumns: [saccos.id],
        name: "savings_categories_sacco_id_saccos_id_fk",
      }),
    }
  }
)

export const savingsAccounts = pgTable(
  "savings_accounts",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    saccoId: uuid("sacco_id").notNull(),
    memberId: uuid("member_id").notNull(),
    categoryId: uuid("category_id"),
    accountNumber: text("account_number").notNull(),
    balance: integer().default(0).notNull(),
    accountType: savingsAccountType("account_type").default("regular"),
    isLocked: boolean("is_locked").default(false),
    lockUntil: date("lock_until"),
    lockReason: text("lock_reason"),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
  },
  (table) => {
    return {
      savingsAccountsSaccoIdSaccosIdFk: foreignKey({
        columns: [table.saccoId],
        foreignColumns: [saccos.id],
        name: "savings_accounts_sacco_id_saccos_id_fk",
      }),
      savingsAccountsMemberIdMembersIdFk: foreignKey({
        columns: [table.memberId],
        foreignColumns: [members.id],
        name: "savings_accounts_member_id_members_id_fk",
      }),
      savingsAccountsCategoryIdSavingsCategoriesIdFk: foreignKey({
        columns: [table.categoryId],
        foreignColumns: [savingsCategories.id],
        name: "savings_accounts_category_id_savings_categories_id_fk",
      }),
      savingsAccountsAccountNumberUnique: unique(
        "savings_accounts_account_number_unique"
      ).on(table.accountNumber),
    }
  }
)

export const notifications = pgTable(
  "notifications",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    saccoId: uuid("sacco_id").notNull(),
    memberId: uuid("member_id"),
    title: text().notNull(),
    body: text().notNull(),
    type: notificationType().default("sms"),
    status: notificationStatus().default("pending"),
    sentAt: timestamp("sent_at", { mode: "string" }),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    priority: text().default("normal"),
    channel: text().default("sms"),
    recipientPhone: text("recipient_phone"),
    recipientEmail: text("recipient_email"),
    referenceType: text("reference_type"),
    referenceId: text("reference_id"),
    metadata: text().default("{}"),
    retryCount: integer("retry_count").default(0),
    maxRetries: integer("max_retries").default(3),
    errorMessage: text("error_message"),
    scheduledAt: timestamp("scheduled_at", { mode: "string" }),
    deliveredAt: timestamp("delivered_at", { mode: "string" }),
    readAt: timestamp("read_at", { mode: "string" }),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
  },
  (table) => {
    return {
      notificationsSaccoIdSaccosIdFk: foreignKey({
        columns: [table.saccoId],
        foreignColumns: [saccos.id],
        name: "notifications_sacco_id_saccos_id_fk",
      }),
      notificationsMemberIdMembersIdFk: foreignKey({
        columns: [table.memberId],
        foreignColumns: [members.id],
        name: "notifications_member_id_members_id_fk",
      }),
    }
  }
)

export const transactions = pgTable(
  "transactions",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    saccoId: uuid("sacco_id").notNull(),
    memberId: uuid("member_id").notNull(),
    type: transactionType().notNull(),
    amount: integer().notNull(),
    balanceAfter: integer("balance_after"),
    referenceId: text("reference_id"),
    paymentMethod: paymentMethod("payment_method").default("cash"),
    narration: text(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
  },
  (table) => {
    return {
      transactionsSaccoIdSaccosIdFk: foreignKey({
        columns: [table.saccoId],
        foreignColumns: [saccos.id],
        name: "transactions_sacco_id_saccos_id_fk",
      }),
      transactionsMemberIdMembersIdFk: foreignKey({
        columns: [table.memberId],
        foreignColumns: [members.id],
        name: "transactions_member_id_members_id_fk",
      }),
    }
  }
)

export const documents = pgTable(
  "documents",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    saccoId: uuid("sacco_id").notNull(),
    memberId: uuid("member_id").notNull(),
    loanId: uuid("loan_id"),
    type: documentType().notNull(),
    fileName: text("file_name").notNull(),
    blobUrl: text("blob_url").notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
  },
  (table) => {
    return {
      documentsSaccoIdSaccosIdFk: foreignKey({
        columns: [table.saccoId],
        foreignColumns: [saccos.id],
        name: "documents_sacco_id_saccos_id_fk",
      }),
      documentsMemberIdMembersIdFk: foreignKey({
        columns: [table.memberId],
        foreignColumns: [members.id],
        name: "documents_member_id_members_id_fk",
      }),
      documentsLoanIdLoansIdFk: foreignKey({
        columns: [table.loanId],
        foreignColumns: [loans.id],
        name: "documents_loan_id_loans_id_fk",
      }),
    }
  }
)

export const loanExtensions = pgTable(
  "loan_extensions",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    loanId: uuid("loan_id").notNull(),
    oldDueDate: date("old_due_date").notNull(),
    newDueDate: date("new_due_date").notNull(),
    reason: text(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
  },
  (table) => {
    return {
      loanExtensionsLoanIdLoansIdFk: foreignKey({
        columns: [table.loanId],
        foreignColumns: [loans.id],
        name: "loan_extensions_loan_id_loans_id_fk",
      }),
    }
  }
)

export const loanGuarantors = pgTable(
  "loan_guarantors",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    loanId: uuid("loan_id").notNull(),
    memberId: uuid("member_id").notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
  },
  (table) => {
    return {
      loanGuarantorsLoanIdLoansIdFk: foreignKey({
        columns: [table.loanId],
        foreignColumns: [loans.id],
        name: "loan_guarantors_loan_id_loans_id_fk",
      }),
      loanGuarantorsMemberIdMembersIdFk: foreignKey({
        columns: [table.memberId],
        foreignColumns: [members.id],
        name: "loan_guarantors_member_id_members_id_fk",
      }),
    }
  }
)

export const interestRates = pgTable(
  "interest_rates",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    saccoId: uuid("sacco_id").notNull(),
    minAmount: integer("min_amount").notNull(),
    maxAmount: integer("max_amount").notNull(),
    rate: numeric().notNull(),
    rateType: interestType("rate_type").default("monthly"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
  },
  (table) => {
    return {
      interestRatesSaccoIdSaccosIdFk: foreignKey({
        columns: [table.saccoId],
        foreignColumns: [saccos.id],
        name: "interest_rates_sacco_id_saccos_id_fk",
      }),
    }
  }
)

export const cmsActivityLogs = pgTable(
  "cms_activity_logs",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    adminId: uuid("admin_id"),
    adminName: text("admin_name"),
    action: text().notNull(),
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    entityName: text("entity_name"),
    details: jsonb().default({}),
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
  },
  (table) => {
    return {}
  }
)

export const saccoUsers = pgTable(
  "sacco_users",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    saccoId: uuid("sacco_id"),
    fullName: text("full_name").notNull(),
    email: text().notNull(),
    phone: text(),
    role: userRole().default("field_agent").notNull(),
    avatarUrl: text("avatar_url"),
    isActive: boolean("is_active").default(true),
    lastLoginAt: timestamp("last_login_at", { mode: "string" }),
    notes: text(),
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
    passwordHash: text("password_hash").notNull(),
    mustChangePassword: boolean("must_change_password").default(false),
  },
  (table) => {
    return {
      saccoUsersSaccoIdSaccosIdFk: foreignKey({
        columns: [table.saccoId],
        foreignColumns: [saccos.id],
        name: "sacco_users_sacco_id_saccos_id_fk",
      }),
      saccoUsersEmailUnique: unique("sacco_users_email_unique").on(table.email),
    }
  }
)

export const loanTopUps = pgTable(
  "loan_top_ups",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    loanId: uuid("loan_id").notNull(),
    amount: integer().notNull(),
    reason: text(),
    paymentMethod: paymentMethod("payment_method").default("cash"),
    notes: text(),
    processedBy: uuid("processed_by"),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
  },
  (table) => {
    return {
      loanTopUpsLoanIdLoansIdFk: foreignKey({
        columns: [table.loanId],
        foreignColumns: [loans.id],
        name: "loan_top_ups_loan_id_loans_id_fk",
      }),
    }
  }
)

export const saccoStats = pgTable(
  "sacco_stats",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    saccoId: uuid("sacco_id").notNull(),
    totalMembers: integer("total_members").default(0),
    activeMembers: integer("active_members").default(0),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    totalLoans: bigint("total_loans", { mode: "number" }).default(0),
    activeLoans: integer("active_loans").default(0),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    totalSavings: bigint("total_savings", { mode: "number" }).default(0),
    totalTransactions: integer("total_transactions").default(0),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    totalFines: bigint("total_fines", { mode: "number" }).default(0),
    pendingFines: integer("pending_fines").default(0),
    totalStaff: integer("total_staff").default(0),
    lastActivityAt: timestamp("last_activity_at", { mode: "string" }),
    computedAt: timestamp("computed_at", { mode: "string" }).defaultNow(),
  },
  (table) => {
    return {
      saccoStatsSaccoIdUnique: unique("sacco_stats_sacco_id_unique").on(
        table.saccoId
      ),
    }
  }
)

export const superadmins = pgTable(
  "superadmins",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    fullName: text("full_name").notNull(),
    email: text().notNull(),
    passwordHash: text("password_hash").notNull(),
    role: superadminRole().default("support").notNull(),
    avatarUrl: text("avatar_url"),
    isActive: boolean("is_active").default(true),
    lastLoginAt: timestamp("last_login_at", { mode: "string" }),
    lastLoginIp: text("last_login_ip"),
    twoFaEnabled: boolean("two_fa_enabled").default(false),
    notes: text(),
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
  },
  (table) => {
    return {
      superadminsEmailUnique: unique("superadmins_email_unique").on(
        table.email
      ),
    }
  }
)

export const saccos = pgTable(
  "saccos",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: text().notNull(),
    code: text(),
    logoUrl: text("logo_url"),
    primaryColor: text("primary_color").default("#f97316"),
    contactEmail: text("contact_email"),
    contactPhone: text("contact_phone"),
    address: text(),
    settings: text().default("{}"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
    onboardingCompleted: boolean("onboarding_completed").default(false),
    website: text(),
    registrationNumber: text("registration_number"),
    slug: text(),
    country: text().default("Uganda"),
    status: saccoStatus().default("trial").notNull(),
    plan: text().default("free"),
    trialEndsAt: timestamp("trial_ends_at", { mode: "string" }),
    subscriptionEndsAt: timestamp("subscription_ends_at", { mode: "string" }),
    notes: text(),
    createdByCms: uuid("created_by_cms"),
  },
  (table) => {
    return {
      saccosCodeUnique: unique("saccos_code_unique").on(table.code),
      saccosSlugKey: unique("saccos_slug_key").on(table.slug),
    }
  }
)
