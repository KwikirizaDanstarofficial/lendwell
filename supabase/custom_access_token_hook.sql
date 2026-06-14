-- Supabase Custom Access Token Hook
-- Run this in Supabase SQL Editor, then enable in Auth → Hooks
--
-- Adds sacco_id claims that PowerSync v2's token_parameters can read.
-- PowerSync v2 reads from the JWT's `parameters` claim object.
--
-- After deploying:
--   1. Go to Supabase Dashboard → Auth → Hooks
--   2. Enable "custom_access_token" hook → point to this function
--   3. All users sign out and back in

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  claims        jsonb;
  user_id       uuid;
  user_sacco_id uuid;
BEGIN
  claims  := event->'claims';
  user_id := (claims->>'sub')::uuid;

  -- Try root-level sacco_id first, then user_metadata
  user_sacco_id := (claims->>'sacco_id')::uuid;
  IF user_sacco_id IS NULL THEN
    user_sacco_id := (claims->'user_metadata'->>'sacco_id')::uuid;
  END IF;
  IF user_sacco_id IS NULL THEN
    SELECT raw_user_meta_data->>'sacco_id' INTO user_sacco_id
    FROM auth.users WHERE id = user_id;
  END IF;

  IF user_sacco_id IS NOT NULL THEN
    -- PowerSync v2 reads token_parameters from the JWT's parameters claim
    claims := jsonb_set(claims, '{parameters}', jsonb_build_object('sacco_id', user_sacco_id));
    -- Also keep it at root for Supabase RLS
    claims := jsonb_set(claims, '{sacco_id}', to_jsonb(user_sacco_id));
    -- And in app_metadata for other use cases
    claims := jsonb_set(claims, '{app_metadata,sacco_id}', to_jsonb(user_sacco_id));
  END IF;

  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;
$$;
