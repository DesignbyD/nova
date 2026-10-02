/** "ada@example.com" -> "a**@example.com". Shown on pages reachable with an order link. */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf("@");
  if (at < 1) return "***";
  const local = email.slice(0, at);
  return `${local[0]}${"*".repeat(Math.min(Math.max(local.length - 1, 2), 6))}${email.slice(at)}`;
}
