-- Independent next_of_kin table (members can have multiple entries)
CREATE TABLE IF NOT EXISTS next_of_kin (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id       UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  sacco_id        UUID NOT NULL REFERENCES saccos(id) ON DELETE CASCADE,
  full_name       TEXT NOT NULL,
  relationship    TEXT,
  phone           TEXT,
  email           TEXT,
  address         TEXT,
  is_primary      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_next_of_kin_member_id ON next_of_kin(member_id);
CREATE INDEX IF NOT EXISTS idx_next_of_kin_sacco_id ON next_of_kin(sacco_id);

-- Trigger to keep updated_at current
CREATE OR REPLACE FUNCTION update_next_of_kin_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_next_of_kin_updated_at ON next_of_kin;
CREATE TRIGGER trg_next_of_kin_updated_at
  BEFORE UPDATE ON next_of_kin
  FOR EACH ROW EXECUTE FUNCTION update_next_of_kin_updated_at();

-- Migrate existing single next-of-kin from members table (non-null rows only)
INSERT INTO next_of_kin (member_id, sacco_id, full_name, relationship, phone, address, is_primary)
SELECT
  m.id,
  m.sacco_id,
  m.next_of_kin,
  m.next_of_kin_relationship,
  m.next_of_kin_phone,
  m.next_of_kin_address,
  TRUE
FROM members m
WHERE m.next_of_kin IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM next_of_kin nok WHERE nok.member_id = m.id
  );
