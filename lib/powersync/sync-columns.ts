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
  loan_guarantors: [
    "id","loan_id","member_id","sacco_id","status","notes",
    "created_at","updated_at",
  ],
  complaints: [
    "id","sacco_id","member_id","complaint_ref","subject","body","category",
    "priority","status","assigned_to","resolution_notes","resolved_at",
    "resolved_by","notes","satisfaction_rating","feedback","created_at","updated_at",
  ],
  documents: [
    "id","sacco_id","member_id","loan_id","type","file_name","blob_url","created_at",
  ],
  notifications: [
    "id","sacco_id","member_id","title","body","type","status","priority",
    "channel","recipient_phone","recipient_email","reference_type","reference_id",
    "metadata","retry_count","max_retries","error_message","scheduled_at",
    "sent_at","delivered_at","read_at","created_at","updated_at",
  ],
  saccos: [
    "id","name","code","logo_url","primary_color","contact_email","contact_phone",
    "address","settings","is_active","created_at","updated_at","onboarding_completed",
    "website","registration_number","slug","country","status","plan",
    "trial_ends_at","subscription_ends_at","notes","created_by_cms","tagline",
  ],
  branches: [
    "id","sacco_id","name","code","address","phone","email","manager_id",
    "is_active","created_at","updated_at",
  ],
}
