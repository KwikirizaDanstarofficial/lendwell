import { column, Schema, Table } from "@powersync/web"

const members = new Table({
  sacco_id: column.text,
  member_code: column.text,
  full_name: column.text,
  email: column.text,
  phone: column.text,
  national_id: column.text,
  photo_url: column.text,
  date_of_birth: column.text,
  address: column.text,
  next_of_kin: column.text,
  next_of_kin_phone: column.text,
  next_of_kin_relationship: column.text,
  next_of_kin_address: column.text,
  status: column.text,
  joined_at: column.text,
  created_at: column.text,
  updated_at: column.text,
})

const loans = new Table({
  sacco_id: column.text,
  member_id: column.text,
  category_id: column.text,
  loan_ref: column.text,
  amount: column.integer,
  balance: column.integer,
  interest_rate: column.text,
  status: column.text,
  due_date: column.text,
  disbursed_at: column.text,
  settled_at: column.text,
  decline_reason: column.text,
  notes: column.text,
  created_at: column.text,
  updated_at: column.text,
  expected_received: column.integer,
  interest_type: column.text,
  duration_months: column.integer,
  late_penalty_fee: column.integer,
  daily_payment: column.integer,
  monthly_payment: column.integer,
})

const loan_categories = new Table({
  sacco_id: column.text,
  name: column.text,
  description: column.text,
  min_amount: column.integer,
  max_amount: column.integer,
  interest_rate: column.text,
  max_duration_months: column.integer,
  requires_guarantor: column.integer,
  is_active: column.integer,
  created_at: column.text,
})

const savings_accounts = new Table({
  sacco_id: column.text,
  member_id: column.text,
  category_id: column.text,
  account_number: column.text,
  balance: column.integer,
  account_type: column.text,
  is_locked: column.integer,
  lock_until: column.text,
  lock_reason: column.text,
  created_at: column.text,
  updated_at: column.text,
})

const savings_categories = new Table({
  sacco_id: column.text,
  name: column.text,
  description: column.text,
  interest_rate: column.text,
  is_fixed: column.integer,
  is_active: column.integer,
  created_at: column.text,
})

const transactions = new Table({
  sacco_id: column.text,
  member_id: column.text,
  type: column.text,
  amount: column.integer,
  balance_after: column.integer,
  reference_id: column.text,
  payment_method: column.text,
  narration: column.text,
  created_at: column.text,
})

const fines = new Table({
  sacco_id: column.text,
  member_id: column.text,
  category_id: column.text,
  amount: column.integer,
  reason: column.text,
  status: column.text,
  paid_at: column.text,
  fine_ref: column.text,
  due_date: column.text,
  payment_method: column.text,
  payment_reference: column.text,
  notes: column.text,
  created_at: column.text,
  updated_at: column.text,
})

const fine_categories = new Table({
  sacco_id: column.text,
  name: column.text,
  default_amount: column.integer,
  created_at: column.text,
})

const interest_rates = new Table({
  sacco_id: column.text,
  min_amount: column.integer,
  max_amount: column.integer,
  rate: column.text,
  rate_type: column.text,
  is_active: column.integer,
  created_at: column.text,
  updated_at: column.text,
})

const loan_guarantors = new Table({
  loan_id: column.text,
  member_id: column.text,
  sacco_id: column.text,
  status: column.text,
  notes: column.text,
  created_at: column.text,
  updated_at: column.text,
})

export const AppSchema = new Schema({
  members,
  loans,
  loan_categories,
  savings_accounts,
  savings_categories,
  transactions,
  fines,
  fine_categories,
  interest_rates,
  loan_guarantors,
})

export type Database = (typeof AppSchema)["types"]
