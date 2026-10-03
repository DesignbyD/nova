/**
 * Environment checks. Public variables must be referenced literally (process.env.NEXT_PUBLIC_X)
 * so Next.js can inline them for the browser; server secrets are only read in server-only modules.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

/** True when the privileged server client can be created (orders, newsletter). */
export function isAdminConfigured(): boolean {
  return isSupabaseConfigured() && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

/**
 * Browse the bundled catalog (data/catalog.json) instead of the database.
 * Only when Supabase is not configured AND we are developing, or the flag is set explicitly.
 * Orders are never created in this mode.
 */
export function shouldUseLocalCatalog(): boolean {
  if (isSupabaseConfigured()) return false;
  return process.env.NODE_ENV !== "production" || process.env.NOVA_LOCAL_CATALOG === "true";
}
