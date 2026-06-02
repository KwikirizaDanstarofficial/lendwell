/** Column lists used for both the server-side pull API and the client sync engine. */
export const TABLE_COLUMNS: Record<string, string[]> = {
  members: [
    "id","sacco_id","member_code","full_name","email","phone","national_id",
    "photo_url","date_of_birth","address","next_of_kin","next_of_kin_phone",
    "next_of_kin_relationship","next_of_kin_address","status","joined_at",
    "created_at","updated_at",
  ],
  loans: [
    "id","sacco_id","member_id","category_id","loan_ref","amount","balance",
    "interest_rate","interest_type","status","due_date","disbursed_at",
    "settled_at","decline_reason","notes","created_at","updated_at",
    "expected_received","duration_months","late_penalty_fee","daily_payment",
    "monthly_payment",
  ],
  loan_categories: [
    "id","sacco_id","name","description","min_amount","max_amount",
    "interest_rate","max_duration_months","requires_guarantor","is_active",
    "created_at",
  ],
  savings_accounts: [
    "id","sacco_id","member_id","category_id","account_number","balance",
    "account_type","is_locked","lock_until","lock_reason","created_at","updated_at",
  ],
  savings_categories: [
    "id","sacco_id","name","description","interest_rate","is_fixed",
    "is_active","created_at",
  ],
  transactions: [
    "id","sacco_id","member_id","type","amount","balance_after",
    "reference_id","payment_method","narration","created_at",
  ],
  fines: [
    "id","sacco_id","member_id","category_id","amount","reason","status",
    "paid_at","fine_ref","due_date","payment_method","payment_reference",
    "notes","created_at","updated_at",
  ],
  fine_categories: [
    "id","sacco_id","name","default_amount","created_at",
  ],
  interest_rates: [
    "id","sacco_id","min_amount","max_amount","rate","rate_type",
    "is_active","created_at","updated_at",
  ],
}
