import { supabaseAdmin } from "@/lib/supabase/server"

export function isUsingLocalDatabase() {
  return false
}

export function isUsingRemoteDatabase() {
  return true
}

export function getDatabase() {
  return supabaseAdmin
}
