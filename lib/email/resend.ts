import "server-only";

import { Resend } from "resend";

type Message = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

let cached: Resend | null = null;

function client() {
  const key = process.env.RESEND_API_KEY;

  if (!key) {
    throw new Error("Resend is not configured.");
  }

  cached ??= new Resend(key);

  return cached;
}

/**
 * Sends one email through Resend.
 * Server-side only: the private API key never reaches the browser.
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: Message): Promise<{ id?: string }> {
  const from = process.env.RESEND_FROM_EMAIL;

  if (!from) {
    throw new Error("RESEND_FROM_EMAIL is not configured.");
  }

  const { data, error } = await client().emails.send({
    from,
    to: [to],
    subject,
    html,
    text,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { id: data?.id };
}