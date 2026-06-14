-- ============================================================
-- SACCO Manager – Row Level Security (RLS) Policies
-- Run AFTER schema.sql in a fresh Supabase project
-- ============================================================
--
-- Design principles:
--   • Authenticated users can only access data for their own SACCO.
--   • The SACCO ID is checked at root JWT level first (set by
--     custom_access_token_hook), then falls back to user_metadata.
--   • Anon/unauthenticated users have no access to any table.
-- ============================================================

-- Inline helper: coalesce root-level sacco_id -> user_metadata -> null
-- NOTE: auth.sacco_id() helper function exists but editing it requires
--       supabase_auth_admin grants. Policies use inline COALESCE instead.

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

-- ─── Shared JWT helpers ────────────────────────────────────────

-- Reads sacco_id from JWT root first (where custom_access_token_hook
-- puts it), then falls back to user_metadata for compatibility.
-- Used inline in all policies below.
--    sacco_check := sacco_id = COALESCE(
--                     (auth.jwt() ->> 'sacco_id')::uuid,
--                     (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid
--                   )
--    role_check := auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'

-- ─── saccos ───────────────────────────────────────────────────

CREATE POLICY "saccos: users read own sacco"
  ON saccos FOR SELECT
  TO authenticated
  USING (id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid));

CREATE POLICY "saccos: admins update own sacco"
  ON saccos FOR UPDATE
  TO authenticated
  USING (id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid) AND auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  WITH CHECK (id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid));

-- ─── sacco_users ──────────────────────────────────────────────

CREATE POLICY "sacco_users: read same sacco"
  ON sacco_users FOR SELECT
  TO authenticated
  USING (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid));

CREATE POLICY "sacco_users: admins insert"
  ON sacco_users FOR INSERT
  TO authenticated
  WITH CHECK (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid) AND auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

CREATE POLICY "sacco_users: admins update"
  ON sacco_users FOR UPDATE
  TO authenticated
  USING (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid) AND auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

CREATE POLICY "sacco_users: admins delete"
  ON sacco_users FOR DELETE
  TO authenticated
  USING (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid) AND auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- ─── members ──────────────────────────────────────────────────

CREATE POLICY "members: read own sacco"
  ON members FOR SELECT
  TO authenticated
  USING (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid));

CREATE POLICY "members: insert own sacco"
  ON members FOR INSERT
  TO authenticated
  WITH CHECK (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid));

CREATE POLICY "members: update own sacco"
  ON members FOR UPDATE
  TO authenticated
  USING (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid))
  WITH CHECK (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid));

CREATE POLICY "members: admins delete"
  ON members FOR DELETE
  TO authenticated
  USING (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid) AND auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- ─── savings_categories ───────────────────────────────────────

CREATE POLICY "savings_categories: read own sacco"
  ON savings_categories FOR SELECT
  TO authenticated
  USING (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid));

CREATE POLICY "savings_categories: admins write"
  ON savings_categories FOR ALL
  TO authenticated
  USING (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid) AND auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  WITH CHECK (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid));

-- ─── savings_accounts ─────────────────────────────────────────

CREATE POLICY "savings_accounts: read own sacco"
  ON savings_accounts FOR SELECT
  TO authenticated
  USING (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid));

CREATE POLICY "savings_accounts: insert own sacco"
  ON savings_accounts FOR INSERT
  TO authenticated
  WITH CHECK (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid));

CREATE POLICY "savings_accounts: update own sacco"
  ON savings_accounts FOR UPDATE
  TO authenticated
  USING (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid))
  WITH CHECK (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid));

CREATE POLICY "savings_accounts: admins delete"
  ON savings_accounts FOR DELETE
  TO authenticated
  USING (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid) AND auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- ─── interest_rates ───────────────────────────────────────────

CREATE POLICY "interest_rates: read own sacco"
  ON interest_rates FOR SELECT
  TO authenticated
  USING (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid));

CREATE POLICY "interest_rates: admins write"
  ON interest_rates FOR ALL
  TO authenticated
  USING (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid) AND auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  WITH CHECK (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid));

-- ─── loan_categories ──────────────────────────────────────────

CREATE POLICY "loan_categories: read own sacco"
  ON loan_categories FOR SELECT
  TO authenticated
  USING (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid));

CREATE POLICY "loan_categories: admins write"
  ON loan_categories FOR ALL
  TO authenticated
  USING (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid) AND auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  WITH CHECK (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid));

-- ─── loans ────────────────────────────────────────────────────

CREATE POLICY "loans: read own sacco"
  ON loans FOR SELECT
  TO authenticated
  USING (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid));

CREATE POLICY "loans: insert own sacco"
  ON loans FOR INSERT
  TO authenticated
  WITH CHECK (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid));

CREATE POLICY "loans: update own sacco"
  ON loans FOR UPDATE
  TO authenticated
  USING (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid))
  WITH CHECK (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid));

CREATE POLICY "loans: admins delete"
  ON loans FOR DELETE
  TO authenticated
  USING (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid) AND auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- ─── loan_guarantors ──────────────────────────────────────────

CREATE POLICY "loan_guarantors: read via loan"
  ON loan_guarantors FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM loans l WHERE l.id = loan_id AND l.sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid)));

CREATE POLICY "loan_guarantors: insert via loan"
  ON loan_guarantors FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM loans l WHERE l.id = loan_id AND l.sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid)));

CREATE POLICY "loan_guarantors: update via loan"
  ON loan_guarantors FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM loans l WHERE l.id = loan_id AND l.sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid)))
  WITH CHECK (EXISTS (SELECT 1 FROM loans l WHERE l.id = loan_id AND l.sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid)));

CREATE POLICY "loan_guarantors: delete via loan"
  ON loan_guarantors FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM loans l WHERE l.id = loan_id AND l.sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid)));

-- ─── loan_extensions ──────────────────────────────────────────

CREATE POLICY "loan_extensions: read via loan"
  ON loan_extensions FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM loans l WHERE l.id = loan_id AND l.sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid)));

CREATE POLICY "loan_extensions: insert via loan"
  ON loan_extensions FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM loans l WHERE l.id = loan_id AND l.sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid)));

CREATE POLICY "loan_extensions: update via loan"
  ON loan_extensions FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM loans l WHERE l.id = loan_id AND l.sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid)))
  WITH CHECK (EXISTS (SELECT 1 FROM loans l WHERE l.id = loan_id AND l.sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid)));

CREATE POLICY "loan_extensions: delete via loan"
  ON loan_extensions FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM loans l WHERE l.id = loan_id AND l.sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid)));

-- ─── loan_top_ups ─────────────────────────────────────────────

CREATE POLICY "loan_top_ups: read via loan"
  ON loan_top_ups FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM loans l WHERE l.id = loan_id AND l.sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid)));

CREATE POLICY "loan_top_ups: insert via loan"
  ON loan_top_ups FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM loans l WHERE l.id = loan_id AND l.sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid)));

CREATE POLICY "loan_top_ups: update via loan"
  ON loan_top_ups FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM loans l WHERE l.id = loan_id AND l.sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid)))
  WITH CHECK (EXISTS (SELECT 1 FROM loans l WHERE l.id = loan_id AND l.sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid)));

CREATE POLICY "loan_top_ups: delete via loan"
  ON loan_top_ups FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM loans l WHERE l.id = loan_id AND l.sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid)));

-- ─── transactions ─────────────────────────────────────────────

CREATE POLICY "transactions: read own sacco"
  ON transactions FOR SELECT
  TO authenticated
  USING (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid));

CREATE POLICY "transactions: insert own sacco"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid));

CREATE POLICY "transactions: update own sacco"
  ON transactions FOR UPDATE
  TO authenticated
  USING (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid))
  WITH CHECK (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid));

-- ─── fine_categories ──────────────────────────────────────────

CREATE POLICY "fine_categories: read own sacco"
  ON fine_categories FOR SELECT
  TO authenticated
  USING (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid));

CREATE POLICY "fine_categories: admins write"
  ON fine_categories FOR ALL
  TO authenticated
  USING (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid) AND auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  WITH CHECK (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid));

-- ─── fines ────────────────────────────────────────────────────

CREATE POLICY "fines: read own sacco"
  ON fines FOR SELECT
  TO authenticated
  USING (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid));

CREATE POLICY "fines: insert own sacco"
  ON fines FOR INSERT
  TO authenticated
  WITH CHECK (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid));

CREATE POLICY "fines: update own sacco"
  ON fines FOR UPDATE
  TO authenticated
  USING (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid))
  WITH CHECK (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid));

CREATE POLICY "fines: admins delete"
  ON fines FOR DELETE
  TO authenticated
  USING (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid) AND auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- ─── complaints ───────────────────────────────────────────────

CREATE POLICY "complaints: read own sacco"
  ON complaints FOR SELECT
  TO authenticated
  USING (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid));

CREATE POLICY "complaints: insert own sacco"
  ON complaints FOR INSERT
  TO authenticated
  WITH CHECK (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid));

CREATE POLICY "complaints: update own sacco"
  ON complaints FOR UPDATE
  TO authenticated
  USING (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid))
  WITH CHECK (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid));

CREATE POLICY "complaints: admins delete"
  ON complaints FOR DELETE
  TO authenticated
  USING (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid) AND auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- ─── notifications ────────────────────────────────────────────

CREATE POLICY "notifications: read own sacco"
  ON notifications FOR SELECT
  TO authenticated
  USING (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid));

CREATE POLICY "notifications: insert own sacco"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid));

CREATE POLICY "notifications: update own sacco"
  ON notifications FOR UPDATE
  TO authenticated
  USING (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid))
  WITH CHECK (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid));

CREATE POLICY "notifications: admins delete"
  ON notifications FOR DELETE
  TO authenticated
  USING (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid) AND auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- ─── documents ────────────────────────────────────────────────

CREATE POLICY "documents: read own sacco"
  ON documents FOR SELECT
  TO authenticated
  USING (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid));

CREATE POLICY "documents: insert own sacco"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid));

CREATE POLICY "documents: update own sacco"
  ON documents FOR UPDATE
  TO authenticated
  USING (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid))
  WITH CHECK (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid));

CREATE POLICY "documents: admins delete"
  ON documents FOR DELETE
  TO authenticated
  USING (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid) AND auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- ─── sacco_stats ──────────────────────────────────────────────

CREATE POLICY "sacco_stats: read own sacco"
  ON sacco_stats FOR SELECT
  TO authenticated
  USING (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid));

-- Stats are written only by the service role (triggers / cron).

-- ─── audit_logs ───────────────────────────────────────────────

CREATE POLICY "audit_logs: read own sacco"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid) AND auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

CREATE POLICY "audit_logs: insert own sacco"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid));

-- ─── subscriptions ────────────────────────────────────────────

CREATE POLICY "subscriptions: admins read own sacco"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (sacco_id = COALESCE((auth.jwt() ->> 'sacco_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'sacco_id')::uuid) AND auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

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
