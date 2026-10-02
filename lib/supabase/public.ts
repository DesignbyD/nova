import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cookie-free client for public catalog reads. Because it never touches cookies,
 * pages that use it can still be statically generated and cached.
 */
export function createPublicClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
