const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateNewsletterEmail(value: unknown): { ok: true; email: string } | { ok: false; error: string } {
  const email = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!email) return { ok: false, error: "Enter your email address." };
  if (email.length > 254 || !EMAIL.test(email)) return { ok: false, error: "Enter a valid email address, like name@example.com." };
  return { ok: true, email };
}
