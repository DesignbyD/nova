import "server-only";
import Mailgun from "mailgun.js";

type Message = { to: string; subject: string; html: string; text: string };

let cached: ReturnType<InstanceType<typeof Mailgun>["client"]> | null = null;

function client() {
  const key = process.env.MAILGUN_API_KEY;
  if (!key) throw new Error("Mailgun is not configured.");
  cached ??= new Mailgun(FormData).client({
    username: "api",
    key,
    // Use https://api.eu.mailgun.net for EU-region domains.
    url: process.env.MAILGUN_API_URL || "https://api.mailgun.net",
  });
  return cached;
}

/**
 * Sends one email through Mailgun. Server-side only: the private API key never reaches the browser.
 * Throws if Mailgun rejects the message, so callers can never record a failed send as delivered.
 */
export async function sendEmail({ to, subject, html, text }: Message): Promise<{ id?: string }> {
  const domain = process.env.MAILGUN_DOMAIN;
  const from = process.env.MAILGUN_FROM_EMAIL;
  if (!domain || !from) throw new Error("Mailgun is not configured.");
  const result = await client().messages.create(domain, { from, to: [to], subject, html, text });
  return { id: result.id };
}
