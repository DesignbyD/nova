/**
 * Only allow same-site relative paths after login, so a crafted ?next= cannot send people elsewhere.
 * Rejects absolute URLs, protocol-relative URLs ("//evil.com") and backslash tricks.
 */
export function safeNext(value: string | null | undefined, fallback = "/account"): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  if (/[\u0000-\u001f]/.test(value)) return fallback;
  return value;
}
