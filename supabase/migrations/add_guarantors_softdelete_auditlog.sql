-- ============================================================
-- Migration: Enhance loan_guarantors, soft-delete columns,
--            enhance audit_logs
-- Run in Supabase SQL Editor
-- ============================================================

-- ── 1. Enhance loan_guarantors ────────────────────────────────
ALTER TABLE loan_guarantors
  ADD COLUMN IF NOT EXISTS sacco_id UUID REFERENCES saccos(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS status   TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS notes    TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_loan_guarantors_sacco_id ON loan_guarantors(sacco_id);
CREATE INDEX IF NOT EXISTS idx_loan_guarantors_status   ON loan_guarantors(status);

-- ── 2. Enhance audit_logs ─────────────────────────────────────
ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS entity_ref  TEXT,
  ADD COLUMN IF NOT EXISTS metadata    JSONB;

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity      ON audit_logs(entity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id    ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action      ON audit_logs(action);

-- ── 3. Soft-delete columns ────────────────────────────────────
ALTER TABLE members          ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE loans            ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE savings_accounts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE fines            ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_members_deleted_at          ON members(deleted_at);
CREATE INDEX IF NOT EXISTS idx_loans_deleted_at            ON loans(deleted_at);
CREATE INDEX IF NOT EXISTS idx_savings_accounts_deleted_at ON savings_accounts(deleted_at);
CREATE INDEX IF NOT EXISTS idx_fines_deleted_at            ON fines(deleted_at);

-- ── 4. updated_at trigger for loan_guarantors ─────────────────
CREATE OR REPLACE FUNCTION set_loan_guarantors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_loan_guarantors_updated_at ON loan_guarantors;
CREATE TRIGGER trg_loan_guarantors_updated_at
  BEFORE UPDATE ON loan_guarantors
  FOR EACH ROW EXECUTE FUNCTION set_loan_guarantors_updated_at();
