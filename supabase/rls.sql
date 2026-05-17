-- ============================================================
-- SACCO Manager – Row Level Security (RLS) Policies
-- Run AFTER schema.sql in a fresh Supabase project
-- ============================================================
--
-- Design principles:
--   • Authenticated users can only access data for their own SACCO.
--   • The SACCO ID is stored in auth.users.raw_user_meta_data->>'sacco_id'.
--   • Service-role key (supabaseAdmin) bypasses all RLS – used server-side.
--   • Anon/unauthenticated users have no access to any table.
-- ============================================================

-- Helper: extract the current user's sacco_id from JWT metadata
CREATE OR REPLACE FUNCTION auth.sacco_id() RETURNS UUID AS $$
  SELECT NULLIF(auth.jwt() -> 'user_metadata' ->> 'sacco_id', '')::uuid;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper: extract the current user's role from JWT metadata
CREATE OR REPLACE FUNCTION auth.user_role() RETURNS TEXT AS $$
  SELECT auth.jwt() -> 'user_metadata' ->> 'role';
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ─── Enable RLS on all tables ─────────────────────────────────

ALTER TABLE saccos              ENABLE ROW LEVEL SECURITY;
ALTER TABLE sacco_users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE members             ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_categories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_accounts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE interest_rates      ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_categories     ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans               ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_guarantors     ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_extensions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_top_ups        ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE fine_categories     ENABLE ROW LEVEL SECURITY;
ALTER TABLE fines               ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints          ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents           ENABLE ROW LEVEL SECURITY;
ALTER TABLE sacco_stats         ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE superadmins         ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_activity_logs   ENABLE ROW LEVEL SECURITY;

-- ─── saccos ───────────────────────────────────────────────────
-- Users can read and update their own SACCO row only.
-- Insert is done server-side (service role) during onboarding.

CREATE POLICY "saccos: users read own sacco"
  ON saccos FOR SELECT
  TO authenticated
  USING (id = auth.sacco_id());

CREATE POLICY "saccos: admins update own sacco"
  ON saccos FOR UPDATE
  TO authenticated
  USING (id = auth.sacco_id() AND auth.user_role() = 'admin')
  WITH CHECK (id = auth.sacco_id());

-- ─── sacco_users ──────────────────────────────────────────────

CREATE POLICY "sacco_users: read same sacco"
  ON sacco_users FOR SELECT
  TO authenticated
  USING (sacco_id = auth.sacco_id());

CREATE POLICY "sacco_users: admins insert"
  ON sacco_users FOR INSERT
  TO authenticated
  WITH CHECK (sacco_id = auth.sacco_id() AND auth.user_role() = 'admin');

CREATE POLICY "sacco_users: admins update"
  ON sacco_users FOR UPDATE
  TO authenticated
  USING (sacco_id = auth.sacco_id() AND auth.user_role() = 'admin');

CREATE POLICY "sacco_users: admins delete"
  ON sacco_users FOR DELETE
  TO authenticated
  USING (sacco_id = auth.sacco_id() AND auth.user_role() = 'admin');

-- ─── members ──────────────────────────────────────────────────

CREATE POLICY "members: read own sacco"
  ON members FOR SELECT
  TO authenticated
  USING (sacco_id = auth.sacco_id());

CREATE POLICY "members: insert own sacco"
  ON members FOR INSERT
  TO authenticated
  WITH CHECK (sacco_id = auth.sacco_id());

CREATE POLICY "members: update own sacco"
  ON members FOR UPDATE
  TO authenticated
  USING (sacco_id = auth.sacco_id())
  WITH CHECK (sacco_id = auth.sacco_id());

CREATE POLICY "members: admins delete"
  ON members FOR DELETE
  TO authenticated
  USING (sacco_id = auth.sacco_id() AND auth.user_role() = 'admin');

-- ─── savings_categories ───────────────────────────────────────

CREATE POLICY "savings_categories: read own sacco"
  ON savings_categories FOR SELECT
  TO authenticated
  USING (sacco_id = auth.sacco_id());

CREATE POLICY "savings_categories: admins write"
  ON savings_categories FOR ALL
  TO authenticated
  USING (sacco_id = auth.sacco_id() AND auth.user_role() = 'admin')
  WITH CHECK (sacco_id = auth.sacco_id());

-- ─── savings_accounts ─────────────────────────────────────────

CREATE POLICY "savings_accounts: read own sacco"
  ON savings_accounts FOR SELECT
  TO authenticated
  USING (sacco_id = auth.sacco_id());

CREATE POLICY "savings_accounts: insert own sacco"
  ON savings_accounts FOR INSERT
  TO authenticated
  WITH CHECK (sacco_id = auth.sacco_id());

CREATE POLICY "savings_accounts: update own sacco"
  ON savings_accounts FOR UPDATE
  TO authenticated
  USING (sacco_id = auth.sacco_id())
  WITH CHECK (sacco_id = auth.sacco_id());

CREATE POLICY "savings_accounts: admins delete"
  ON savings_accounts FOR DELETE
  TO authenticated
  USING (sacco_id = auth.sacco_id() AND auth.user_role() = 'admin');

-- ─── interest_rates ───────────────────────────────────────────

CREATE POLICY "interest_rates: read own sacco"
  ON interest_rates FOR SELECT
  TO authenticated
  USING (sacco_id = auth.sacco_id());

CREATE POLICY "interest_rates: admins write"
  ON interest_rates FOR ALL
  TO authenticated
  USING (sacco_id = auth.sacco_id() AND auth.user_role() = 'admin')
  WITH CHECK (sacco_id = auth.sacco_id());

-- ─── loan_categories ──────────────────────────────────────────

CREATE POLICY "loan_categories: read own sacco"
  ON loan_categories FOR SELECT
  TO authenticated
  USING (sacco_id = auth.sacco_id());

CREATE POLICY "loan_categories: admins write"
  ON loan_categories FOR ALL
  TO authenticated
  USING (sacco_id = auth.sacco_id() AND auth.user_role() = 'admin')
  WITH CHECK (sacco_id = auth.sacco_id());

-- ─── loans ────────────────────────────────────────────────────

CREATE POLICY "loans: read own sacco"
  ON loans FOR SELECT
  TO authenticated
  USING (sacco_id = auth.sacco_id());

CREATE POLICY "loans: insert own sacco"
  ON loans FOR INSERT
  TO authenticated
  WITH CHECK (sacco_id = auth.sacco_id());

CREATE POLICY "loans: update own sacco"
  ON loans FOR UPDATE
  TO authenticated
  USING (sacco_id = auth.sacco_id())
  WITH CHECK (sacco_id = auth.sacco_id());

CREATE POLICY "loans: admins delete"
  ON loans FOR DELETE
  TO authenticated
  USING (sacco_id = auth.sacco_id() AND auth.user_role() = 'admin');

-- ─── loan_guarantors ──────────────────────────────────────────
-- Scoped through the parent loan via sacco_id join.

CREATE POLICY "loan_guarantors: read via loan"
  ON loan_guarantors FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM loans l WHERE l.id = loan_id AND l.sacco_id = auth.sacco_id())
  );

CREATE POLICY "loan_guarantors: insert via loan"
  ON loan_guarantors FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM loans l WHERE l.id = loan_id AND l.sacco_id = auth.sacco_id())
  );

CREATE POLICY "loan_guarantors: delete via loan"
  ON loan_guarantors FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM loans l WHERE l.id = loan_id AND l.sacco_id = auth.sacco_id())
  );

-- ─── loan_extensions ──────────────────────────────────────────

CREATE POLICY "loan_extensions: read via loan"
  ON loan_extensions FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM loans l WHERE l.id = loan_id AND l.sacco_id = auth.sacco_id())
  );

CREATE POLICY "loan_extensions: insert via loan"
  ON loan_extensions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM loans l WHERE l.id = loan_id AND l.sacco_id = auth.sacco_id())
  );

-- ─── loan_top_ups ─────────────────────────────────────────────

CREATE POLICY "loan_top_ups: read via loan"
  ON loan_top_ups FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM loans l WHERE l.id = loan_id AND l.sacco_id = auth.sacco_id())
  );

CREATE POLICY "loan_top_ups: insert via loan"
  ON loan_top_ups FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM loans l WHERE l.id = loan_id AND l.sacco_id = auth.sacco_id())
  );

-- ─── transactions ─────────────────────────────────────────────

CREATE POLICY "transactions: read own sacco"
  ON transactions FOR SELECT
  TO authenticated
  USING (sacco_id = auth.sacco_id());

CREATE POLICY "transactions: insert own sacco"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (sacco_id = auth.sacco_id());

-- Transactions are immutable – no update/delete policies.

-- ─── fine_categories ──────────────────────────────────────────

CREATE POLICY "fine_categories: read own sacco"
  ON fine_categories FOR SELECT
  TO authenticated
  USING (sacco_id = auth.sacco_id());

CREATE POLICY "fine_categories: admins write"
  ON fine_categories FOR ALL
  TO authenticated
  USING (sacco_id = auth.sacco_id() AND auth.user_role() = 'admin')
  WITH CHECK (sacco_id = auth.sacco_id());

-- ─── fines ────────────────────────────────────────────────────

CREATE POLICY "fines: read own sacco"
  ON fines FOR SELECT
  TO authenticated
  USING (sacco_id = auth.sacco_id());

CREATE POLICY "fines: insert own sacco"
  ON fines FOR INSERT
  TO authenticated
  WITH CHECK (sacco_id = auth.sacco_id());

CREATE POLICY "fines: update own sacco"
  ON fines FOR UPDATE
  TO authenticated
  USING (sacco_id = auth.sacco_id())
  WITH CHECK (sacco_id = auth.sacco_id());

CREATE POLICY "fines: admins delete"
  ON fines FOR DELETE
  TO authenticated
  USING (sacco_id = auth.sacco_id() AND auth.user_role() = 'admin');

-- ─── complaints ───────────────────────────────────────────────

CREATE POLICY "complaints: read own sacco"
  ON complaints FOR SELECT
  TO authenticated
  USING (sacco_id = auth.sacco_id());

CREATE POLICY "complaints: insert own sacco"
  ON complaints FOR INSERT
  TO authenticated
  WITH CHECK (sacco_id = auth.sacco_id());

CREATE POLICY "complaints: update own sacco"
  ON complaints FOR UPDATE
  TO authenticated
  USING (sacco_id = auth.sacco_id())
  WITH CHECK (sacco_id = auth.sacco_id());

CREATE POLICY "complaints: admins delete"
  ON complaints FOR DELETE
  TO authenticated
  USING (sacco_id = auth.sacco_id() AND auth.user_role() = 'admin');

-- ─── notifications ────────────────────────────────────────────

CREATE POLICY "notifications: read own sacco"
  ON notifications FOR SELECT
  TO authenticated
  USING (sacco_id = auth.sacco_id());

CREATE POLICY "notifications: insert own sacco"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (sacco_id = auth.sacco_id());

CREATE POLICY "notifications: update own sacco"
  ON notifications FOR UPDATE
  TO authenticated
  USING (sacco_id = auth.sacco_id())
  WITH CHECK (sacco_id = auth.sacco_id());

CREATE POLICY "notifications: admins delete"
  ON notifications FOR DELETE
  TO authenticated
  USING (sacco_id = auth.sacco_id() AND auth.user_role() = 'admin');

-- ─── documents ────────────────────────────────────────────────

CREATE POLICY "documents: read own sacco"
  ON documents FOR SELECT
  TO authenticated
  USING (sacco_id = auth.sacco_id());

CREATE POLICY "documents: insert own sacco"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (sacco_id = auth.sacco_id());

CREATE POLICY "documents: admins delete"
  ON documents FOR DELETE
  TO authenticated
  USING (sacco_id = auth.sacco_id() AND auth.user_role() = 'admin');

-- ─── sacco_stats ──────────────────────────────────────────────

CREATE POLICY "sacco_stats: read own sacco"
  ON sacco_stats FOR SELECT
  TO authenticated
  USING (sacco_id = auth.sacco_id());

-- Stats are written only by the service role (triggers / cron).

-- ─── audit_logs ───────────────────────────────────────────────

CREATE POLICY "audit_logs: read own sacco"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (sacco_id = auth.sacco_id() AND auth.user_role() = 'admin');

CREATE POLICY "audit_logs: insert own sacco"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (sacco_id = auth.sacco_id());

-- ─── subscriptions ────────────────────────────────────────────

CREATE POLICY "subscriptions: admins read own sacco"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (sacco_id = auth.sacco_id() AND auth.user_role() = 'admin');

-- Inserts/updates handled server-side via service role (payment webhooks).

-- ─── otp_codes ────────────────────────────────────────────────
-- OTPs are managed entirely server-side; no client access.

CREATE POLICY "otp_codes: no client access"
  ON otp_codes FOR ALL
  TO authenticated
  USING (false);

-- ─── superadmins / cms_activity_logs ─────────────────────────
-- CMS tables are never accessed by regular users; service role only.

CREATE POLICY "superadmins: no client access"
  ON superadmins FOR ALL
  TO authenticated
  USING (false);

CREATE POLICY "cms_activity_logs: no client access"
  ON cms_activity_logs FOR ALL
  TO authenticated
  USING (false);

-- ─── Storage Buckets ──────────────────────────────────────────
-- Run separately in Supabase Dashboard > Storage, or via the API.
-- Bucket names: 'logos', 'avatars', 'documents'

-- Example (replace with actual storage policies in Supabase dashboard):
-- INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);
