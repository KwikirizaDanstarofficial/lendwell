-- ============================================================
-- SACCO Manager – Database Schema
-- Run this in a fresh Supabase project (SQL Editor → Run)
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Enum Types ───────────────────────────────────────────────

CREATE TYPE complaint_status   AS ENUM ('open', 'in_progress', 'resolved');
CREATE TYPE document_type      AS ENUM ('national_id', 'registration_form', 'loan_contract', 'membership_certificate', 'other');
CREATE TYPE fine_status        AS ENUM ('pending', 'paid', 'waived');
CREATE TYPE interest_type      AS ENUM ('daily', 'monthly', 'annual');
CREATE TYPE loan_status        AS ENUM ('pending', 'verified', 'approved', 'declined', 'disbursed', 'active', 'extended', 'settled', 'defaulted');
CREATE TYPE member_status      AS ENUM ('active', 'suspended', 'exited');
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed');
CREATE TYPE notification_type  AS ENUM ('sms', 'in_app');
CREATE TYPE payment_method     AS ENUM ('cash', 'mobile_money', 'bank', 'flutterwave', 'mtn', 'airtel');
CREATE TYPE sacco_status       AS ENUM ('active', 'suspended', 'trial', 'cancelled');
CREATE TYPE sacco_user_role    AS ENUM ('admin', 'cashier', 'field_agent');
CREATE TYPE savings_account_type AS ENUM ('regular', 'fixed');
CREATE TYPE superadmin_role    AS ENUM ('superadmin', 'support');
CREATE TYPE transaction_type   AS ENUM ('loan_disbursement', 'loan_repayment', 'savings_deposit', 'savings_withdrawal', 'fine_payment');
CREATE TYPE user_role          AS ENUM ('admin', 'cashier', 'field_agent');
CREATE TYPE subscription_plan  AS ENUM ('trial', 'basic', 'pro', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('pending', 'active', 'cancelled', 'expired');

-- ─── Core Tables ──────────────────────────────────────────────

-- saccos
CREATE TABLE saccos (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL,
  code                  TEXT UNIQUE,
  logo_url              TEXT,
  primary_color         TEXT,
  contact_email         TEXT,
  contact_phone         TEXT,
  address               TEXT,
  tagline               TEXT,
  settings              TEXT,               -- JSON stored as text
  is_active             BOOLEAN DEFAULT TRUE,
  status                sacco_status NOT NULL DEFAULT 'trial',
  plan                  TEXT,
  trial_ends_at         TIMESTAMP WITH TIME ZONE,
  subscription_ends_at  TIMESTAMP WITH TIME ZONE,
  onboarding_completed  BOOLEAN DEFAULT FALSE,
  website               TEXT,
  registration_number   TEXT,
  slug                  TEXT UNIQUE,
  country               TEXT DEFAULT 'Uganda',
  notes                 TEXT,
  created_by_cms        UUID,
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- sacco_users (staff/team members)
CREATE TABLE sacco_users (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sacco_id            UUID REFERENCES saccos(id) ON DELETE CASCADE,
  full_name           TEXT NOT NULL,
  email               TEXT NOT NULL UNIQUE,
  phone               TEXT,
  role                user_role NOT NULL DEFAULT 'cashier',
  avatar_url          TEXT,
  password_hash       TEXT NOT NULL,
  is_active           BOOLEAN DEFAULT TRUE,
  must_change_password BOOLEAN DEFAULT TRUE,
  last_login_at       TIMESTAMP WITH TIME ZONE,
  notes               TEXT,
  created_by          UUID,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- members
CREATE TABLE members (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sacco_id                UUID NOT NULL REFERENCES saccos(id) ON DELETE CASCADE,
  member_code             TEXT NOT NULL UNIQUE,
  full_name               TEXT NOT NULL,
  email                   TEXT,
  phone                   TEXT,
  national_id             TEXT,
  photo_url               TEXT,
  date_of_birth           DATE,
  address                 TEXT,
  next_of_kin             TEXT,
  next_of_kin_phone       TEXT,
  next_of_kin_relationship TEXT,
  next_of_kin_address     TEXT,
  status                  member_status NOT NULL DEFAULT 'active',
  joined_at               TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- savings_categories
CREATE TABLE savings_categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sacco_id      UUID NOT NULL REFERENCES saccos(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  interest_rate NUMERIC,
  is_fixed      BOOLEAN DEFAULT FALSE,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- savings_accounts
CREATE TABLE savings_accounts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sacco_id       UUID NOT NULL REFERENCES saccos(id) ON DELETE CASCADE,
  member_id      UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  category_id    UUID REFERENCES savings_categories(id),
  account_number TEXT NOT NULL UNIQUE,
  balance        INTEGER NOT NULL DEFAULT 0,
  account_type   savings_account_type DEFAULT 'regular',
  is_locked      BOOLEAN DEFAULT FALSE,
  lock_until     DATE,
  lock_reason    TEXT,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- interest_rates
CREATE TABLE interest_rates (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sacco_id   UUID NOT NULL REFERENCES saccos(id) ON DELETE CASCADE,
  min_amount INTEGER NOT NULL,
  max_amount INTEGER NOT NULL,
  rate       NUMERIC NOT NULL,
  rate_type  interest_type DEFAULT 'monthly',
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- loan_categories
CREATE TABLE loan_categories (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sacco_id            UUID NOT NULL REFERENCES saccos(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  description         TEXT,
  min_amount          INTEGER,
  max_amount          INTEGER NOT NULL,
  interest_rate       NUMERIC NOT NULL,
  max_duration_months INTEGER,
  requires_guarantor  BOOLEAN DEFAULT FALSE,
  is_active           BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- loans
CREATE TABLE loans (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sacco_id         UUID NOT NULL REFERENCES saccos(id) ON DELETE CASCADE,
  member_id        UUID NOT NULL REFERENCES members(id),
  category_id      UUID REFERENCES loan_categories(id),
  interest_rate_id UUID REFERENCES interest_rates(id),
  loan_ref         TEXT NOT NULL UNIQUE,
  amount           INTEGER NOT NULL,
  balance          INTEGER NOT NULL,
  interest_rate    NUMERIC NOT NULL,
  interest_type    interest_type,
  duration_months  INTEGER,
  status           loan_status NOT NULL DEFAULT 'pending',
  due_date         DATE,
  disbursed_at     TIMESTAMP WITH TIME ZONE,
  settled_at       TIMESTAMP WITH TIME ZONE,
  decline_reason   TEXT,
  notes            TEXT,
  expected_received INTEGER NOT NULL DEFAULT 0,
  monthly_payment  INTEGER,
  daily_payment    INTEGER,
  late_penalty_fee INTEGER,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- loan_guarantors
CREATE TABLE loan_guarantors (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id    UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  member_id  UUID NOT NULL REFERENCES members(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- loan_extensions
CREATE TABLE loan_extensions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id      UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  old_due_date DATE NOT NULL,
  new_due_date DATE NOT NULL,
  reason       TEXT,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- loan_top_ups
CREATE TABLE loan_top_ups (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id        UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  amount         INTEGER NOT NULL,
  reason         TEXT,
  payment_method payment_method,
  notes          TEXT,
  processed_by   UUID,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- transactions
CREATE TABLE transactions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sacco_id       UUID NOT NULL REFERENCES saccos(id) ON DELETE CASCADE,
  member_id      UUID NOT NULL REFERENCES members(id),
  type           transaction_type NOT NULL,
  amount         INTEGER NOT NULL,
  balance_after  INTEGER,
  reference_id   TEXT,
  payment_method payment_method,
  narration      TEXT,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- fine_categories
CREATE TABLE fine_categories (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sacco_id       UUID NOT NULL REFERENCES saccos(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  default_amount INTEGER,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- fines
CREATE TABLE fines (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sacco_id         UUID NOT NULL REFERENCES saccos(id) ON DELETE CASCADE,
  member_id        UUID NOT NULL REFERENCES members(id),
  category_id      UUID REFERENCES fine_categories(id),
  amount           INTEGER NOT NULL,
  reason           TEXT,
  description      TEXT,
  status           fine_status NOT NULL DEFAULT 'pending',
  fine_ref         TEXT UNIQUE,
  priority         TEXT,
  due_date         DATE,
  paid_at          TIMESTAMP WITH TIME ZONE,
  payment_method   payment_method,
  payment_reference TEXT,
  waived_by        UUID,
  waiver_reason    TEXT,
  notes            TEXT,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- complaints
CREATE TABLE complaints (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sacco_id          UUID NOT NULL REFERENCES saccos(id) ON DELETE CASCADE,
  member_id         UUID REFERENCES members(id),
  subject           TEXT NOT NULL,
  body              TEXT NOT NULL,
  status            complaint_status DEFAULT 'open',
  complaint_ref     TEXT UNIQUE,
  category          TEXT,
  priority          TEXT,
  assigned_to       UUID,
  resolution_notes  TEXT,
  resolved_by       UUID,
  satisfaction_rating INTEGER,
  resolved_at       TIMESTAMP WITH TIME ZONE,
  feedback          TEXT,
  notes             TEXT,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- notifications
CREATE TABLE notifications (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sacco_id         UUID NOT NULL REFERENCES saccos(id) ON DELETE CASCADE,
  member_id        UUID REFERENCES members(id),
  title            TEXT NOT NULL,
  body             TEXT NOT NULL,
  type             notification_type,
  status           notification_status DEFAULT 'pending',
  channel          TEXT,
  priority         TEXT,
  recipient_phone  TEXT,
  recipient_email  TEXT,
  reference_type   TEXT,
  reference_id     TEXT,
  retry_count      INTEGER DEFAULT 0,
  max_retries      INTEGER DEFAULT 3,
  error_message    TEXT,
  sent_at          TIMESTAMP WITH TIME ZONE,
  delivered_at     TIMESTAMP WITH TIME ZONE,
  read_at          TIMESTAMP WITH TIME ZONE,
  scheduled_at     TIMESTAMP WITH TIME ZONE,
  metadata         TEXT,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- documents
CREATE TABLE documents (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sacco_id   UUID NOT NULL REFERENCES saccos(id) ON DELETE CASCADE,
  member_id  UUID NOT NULL REFERENCES members(id),
  loan_id    UUID REFERENCES loans(id),
  type       document_type NOT NULL,
  file_name  TEXT NOT NULL,
  blob_url   TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── Analytics / Stats ────────────────────────────────────────

-- sacco_stats (denormalised cache, updated by triggers or cron)
CREATE TABLE sacco_stats (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sacco_id          UUID NOT NULL UNIQUE REFERENCES saccos(id) ON DELETE CASCADE,
  total_members     INTEGER DEFAULT 0,
  active_members    INTEGER DEFAULT 0,
  total_loans       BIGINT DEFAULT 0,
  active_loans      INTEGER DEFAULT 0,
  total_savings     BIGINT DEFAULT 0,
  total_transactions INTEGER DEFAULT 0,
  total_fines       BIGINT DEFAULT 0,
  pending_fines     INTEGER DEFAULT 0,
  total_staff       INTEGER DEFAULT 0,
  last_activity_at  TIMESTAMP WITH TIME ZONE,
  computed_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- audit_logs
CREATE TABLE audit_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sacco_id   UUID NOT NULL REFERENCES saccos(id) ON DELETE CASCADE,
  action     TEXT NOT NULL,
  entity     TEXT NOT NULL,
  entity_id  UUID,
  diff       TEXT,
  actor_id   UUID,
  actor_name TEXT,
  actor_role TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── Subscriptions ────────────────────────────────────────────

-- subscriptions
CREATE TABLE subscriptions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sacco_id   UUID NOT NULL REFERENCES saccos(id) ON DELETE CASCADE,
  plan       subscription_plan NOT NULL,
  status     subscription_status NOT NULL DEFAULT 'pending',
  amount     INTEGER NOT NULL,
  tx_ref     TEXT NOT NULL UNIQUE,
  flw_tx_id  TEXT,
  starts_at  TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  paid_at    TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── OTP ──────────────────────────────────────────────────────

-- otp_codes
CREATE TABLE otp_codes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone      TEXT NOT NULL UNIQUE,
  user_id    UUID NOT NULL,
  code       TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  attempts   INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── CMS ──────────────────────────────────────────────────────

-- superadmins (CMS admin users, separate from sacco_users)
CREATE TABLE superadmins (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name       TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  role            superadmin_role NOT NULL DEFAULT 'support',
  avatar_url      TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  last_login_at   TIMESTAMP WITH TIME ZONE,
  last_login_ip   TEXT,
  two_fa_enabled  BOOLEAN DEFAULT FALSE,
  notes           TEXT,
  created_by      UUID,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- cms_activity_logs
CREATE TABLE cms_activity_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id     UUID REFERENCES superadmins(id),
  admin_name   TEXT,
  action       TEXT NOT NULL,
  entity_type  TEXT,
  entity_id    TEXT,
  entity_name  TEXT,
  details      JSONB,
  ip_address   TEXT,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────────

-- Core query filters
CREATE INDEX idx_members_sacco_id         ON members(sacco_id);
CREATE INDEX idx_members_status           ON members(status);
CREATE INDEX idx_members_created_at       ON members(created_at);
CREATE INDEX idx_loans_sacco_id           ON loans(sacco_id);
CREATE INDEX idx_loans_member_id          ON loans(member_id);
CREATE INDEX idx_loans_category_id        ON loans(category_id);
CREATE INDEX idx_loans_status             ON loans(status);
CREATE INDEX idx_loans_created_at         ON loans(created_at);
CREATE INDEX idx_loans_interest_rate_id   ON loans(interest_rate_id);
CREATE INDEX idx_transactions_sacco_id    ON transactions(sacco_id);
CREATE INDEX idx_transactions_member_id   ON transactions(member_id);
CREATE INDEX idx_transactions_type        ON transactions(type);
CREATE INDEX idx_transactions_reference_id ON transactions(reference_id);
CREATE INDEX idx_transactions_created_at  ON transactions(created_at);
CREATE INDEX idx_savings_accounts_sacco   ON savings_accounts(sacco_id);
CREATE INDEX idx_savings_accounts_member  ON savings_accounts(member_id);
CREATE INDEX idx_savings_accounts_category ON savings_accounts(category_id);
CREATE INDEX idx_savings_accounts_type    ON savings_accounts(account_type);
CREATE INDEX idx_savings_accounts_locked  ON savings_accounts(is_locked);
CREATE INDEX idx_fines_sacco_id           ON fines(sacco_id);
CREATE INDEX idx_fines_member_id          ON fines(member_id);
CREATE INDEX idx_fines_category_id        ON fines(category_id);
CREATE INDEX idx_fines_status             ON fines(status);
CREATE INDEX idx_complaints_sacco_id      ON complaints(sacco_id);
CREATE INDEX idx_complaints_member_id     ON complaints(member_id);
CREATE INDEX idx_complaints_status        ON complaints(status);
CREATE INDEX idx_notifications_sacco_id   ON notifications(sacco_id);
CREATE INDEX idx_notifications_member_id  ON notifications(member_id);
CREATE INDEX idx_notifications_status     ON notifications(status);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_documents_sacco_id       ON documents(sacco_id);
CREATE INDEX idx_documents_member_id      ON documents(member_id);
CREATE INDEX idx_documents_loan_id        ON documents(loan_id);
CREATE INDEX idx_audit_logs_sacco_id      ON audit_logs(sacco_id);
CREATE INDEX idx_audit_logs_created_at    ON audit_logs(created_at);
CREATE INDEX idx_sacco_users_sacco_id     ON sacco_users(sacco_id);
CREATE INDEX idx_interest_rates_sacco_id  ON interest_rates(sacco_id);
CREATE INDEX idx_loan_categories_sacco_id ON loan_categories(sacco_id);
CREATE INDEX idx_fine_categories_sacco_id ON fine_categories(sacco_id);
CREATE INDEX idx_savings_categories_sacco_id ON savings_categories(sacco_id);
CREATE INDEX idx_loan_extensions_loan_id  ON loan_extensions(loan_id);
CREATE INDEX idx_loan_guarantors_loan_id  ON loan_guarantors(loan_id);
CREATE INDEX idx_loan_guarantors_member_id ON loan_guarantors(member_id);
CREATE INDEX idx_loan_top_ups_loan_id     ON loan_top_ups(loan_id);
CREATE INDEX idx_subscriptions_sacco_id   ON subscriptions(sacco_id);

-- ─── updated_at Trigger ───────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_saccos_updated_at          BEFORE UPDATE ON saccos          FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_sacco_users_updated_at     BEFORE UPDATE ON sacco_users     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_members_updated_at         BEFORE UPDATE ON members         FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_loans_updated_at           BEFORE UPDATE ON loans           FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_savings_accounts_updated_at BEFORE UPDATE ON savings_accounts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_fines_updated_at           BEFORE UPDATE ON fines           FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_complaints_updated_at      BEFORE UPDATE ON complaints      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_notifications_updated_at   BEFORE UPDATE ON notifications   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_interest_rates_updated_at  BEFORE UPDATE ON interest_rates  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_superadmins_updated_at     BEFORE UPDATE ON superadmins     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
