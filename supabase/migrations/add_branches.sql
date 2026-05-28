-- ============================================================
-- Migration: Add branches support
-- A SACCO can have multiple branches; users and members can
-- belong to a branch; new branch_admin role added.
-- ============================================================

-- ── 1. branches table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS branches (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sacco_id    UUID NOT NULL REFERENCES saccos(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  code        TEXT NOT NULL,
  address     TEXT,
  phone       TEXT,
  email       TEXT,
  manager_id  UUID REFERENCES sacco_users(id) ON DELETE SET NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_branches_sacco_code ON branches(sacco_id, code);
CREATE INDEX IF NOT EXISTS idx_branches_sacco_id ON branches(sacco_id);
CREATE INDEX IF NOT EXISTS idx_branches_manager_id ON branches(manager_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_branches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_branches_updated_at ON branches;
CREATE TRIGGER trg_branches_updated_at
  BEFORE UPDATE ON branches
  FOR EACH ROW EXECUTE FUNCTION update_branches_updated_at();

-- ── 2. Add branch_id to members ───────────────────────────────
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_members_branch_id ON members(branch_id);

-- ── 3. Add branch_id to sacco_users ──────────────────────────
ALTER TABLE sacco_users
  ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sacco_users_branch_id ON sacco_users(branch_id);

-- ── 4. Add branch_admin to the user_role enum ────────────────
-- Only add if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'branch_admin'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    ALTER TYPE user_role ADD VALUE 'branch_admin';
  END IF;
END $$;
