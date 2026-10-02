import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Privileged client using the service-role key. Bypasses Row Level Security.
 * `server-only` makes the build fail if this file is ever imported into browser code.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase admin client is not configured.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
