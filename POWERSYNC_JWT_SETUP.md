# PowerSync JWT Setup — Fix Data Disappearing on Reconnect

## What Was Happening

Every time the Electron app reconnected to the internet, **all locally stored data
(members, loans, savings, fines) was being deleted**. This happened because:

1. PowerSync syncs data using "bucket rules" defined in your sync rules YAML.
2. The bucket rule is: `SELECT token_parameters.sacco_id as sacco_id`
3. `token_parameters` reads claims from the user's **JWT token**.
4. Supabase puts `sacco_id` inside `user_metadata` — a nested JSON object inside the JWT.
5. PowerSync cannot access nested JWT fields — it only reads **root-level claims**.
6. So `token_parameters.sacco_id` was resolving to `NULL`.
7. With `NULL` as the bucket parameter, the sync rule became:
   `WHERE members.sacco_id = NULL` — which matches **zero rows**.
8. PowerSync received an empty sync response and **deleted all local data**
   to match the server state.

---

## The Fix

Supabase supports a **Custom Access Token Hook** — a PostgreSQL function that runs
every time a JWT is issued and can add custom claims to the token's root level.

By promoting `sacco_id` from `user_metadata` to a root-level claim, PowerSync can
read it directly via `token_parameters.sacco_id`.

---

## Step-by-Step Instructions

### Step 1 — Create the hook function in Supabase

Open your Supabase project → **SQL Editor** → run the following:

```sql
-- Create the hook function
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  claims jsonb;
BEGIN
  claims := event -> 'claims';

  -- Promote sacco_id from user_metadata to a root-level JWT claim
  -- so PowerSync can read it via token_parameters.sacco_id
  claims := jsonb_set(
    claims,
    '{sacco_id}',
    COALESCE(
      event -> 'user' -> 'user_metadata' -> 'sacco_id',
      'null'::jsonb
    )
  );

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- Grant the auth admin the right to call this function
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook
  TO supabase_auth_admin;

-- Revoke from regular roles so only Supabase internals can call it
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook
  FROM authenticated, anon, public;
```

### Step 2 — Enable the hook in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Authentication → Hooks**
3. Find **Custom Access Token**
4. Toggle it **ON**
5. Select `public.custom_access_token_hook` from the dropdown
6. Click **Save**

### Step 3 — Sign out and back in

The hook only affects **newly issued JWTs**. Existing sessions still have the old
token without the `sacco_id` claim.

In the Lendwell app:
1. Click your profile → **Sign Out**
2. Log back in with your credentials
3. Your new JWT now includes `sacco_id` at the root level

### Step 4 — Verify sync is working

After signing back in:
1. Open the app while online
2. Wait 10–30 seconds for the initial sync
3. Go to Members — all your data should appear and stay
4. Disconnect from the internet — data remains visible
5. Add a member offline — it appears immediately in the list
6. Reconnect — the new member syncs to Supabase and stays in the local list

---

## How the JWT Changes

**Before the hook:**
```json
{
  "sub": "user-uuid",
  "email": "admin@sacco.com",
  "user_metadata": {
    "sacco_id": "sacco-uuid",
    "role": "admin",
    "full_name": "Dan Kwikiriz"
  }
}
```

**After the hook:**
```json
{
  "sub": "user-uuid",
  "email": "admin@sacco.com",
  "sacco_id": "sacco-uuid",
  "user_metadata": {
    "sacco_id": "sacco-uuid",
    "role": "admin",
    "full_name": "Dan Kwikiriz"
  }
}
```

`sacco_id` is now at the root — PowerSync can read it directly.

---

## Why This Matters for Offline-First

PowerSync's offline-first architecture works like this:

```
Online:   Supabase ──sync──► Local SQLite ──useQuery──► UI
Offline:  Local SQLite ──useQuery──► UI (instant, no network)
Write offline: UI ──db.execute()──► Local SQLite ──queue──► Supabase (on reconnect)
```

The sync from Supabase to Local SQLite is driven by **bucket rules**. If the bucket
parameter (`sacco_id`) is NULL, the bucket is empty, and PowerSync deletes all local
data to match — destroying the offline cache.

Once the JWT hook is active, `sacco_id` is always in the token, the bucket always
has data, and the offline cache is preserved across reconnects.

---

## Checklist

- [ ] SQL function created in Supabase
- [ ] Hook enabled in Supabase Auth → Hooks
- [ ] Signed out and back in (all users must do this once)
- [ ] Verified data persists after reconnecting
- [ ] PowerSync sync rules deployed with `token_parameters.sacco_id`

---

## Related Files

| File | Purpose |
|---|---|
| `POWERSYNC_RULES.yaml` | Full sync rules — paste into PowerSync dashboard |
| `lib/powersync/connector.ts` | Routes offline writes to `/api/powersync/upload` |
| `app/api/powersync/upload/route.ts` | Server-side upload using `supabaseAdmin` (bypasses RLS) |
| `lib/powersync/provider.tsx` | Only connects when online to protect local cache |
