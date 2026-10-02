"use server";

import { isAdminConfigured } from "@/lib/env";
import { logError } from "@/lib/logger";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateNewsletterEmail } from "@/lib/validation/newsletter";

export type NewsletterState = { status: "idle" | "success" | "error"; message: string };

/** Stores the address in the database. Only reports success once the database confirms the write. */
export async function subscribeToNewsletter(_prev: NewsletterState, formData: FormData): Promise<NewsletterState> {
  // Hidden "website" field: people never see it, bots fill it in. Pretend success and store nothing.
  if (String(formData.get("website") ?? "").length > 0) return { status: "success", message: "Thanks, you're on the list." };

  const parsed = validateNewsletterEmail(formData.get("email"));
  if (!parsed.ok) return { status: "error", message: parsed.error };

  if (!isAdminConfigured()) return { status: "error", message: "Sign-up isn't available right now. Please try again later." };

  const { error } = await createAdminClient().from("newsletter_subscribers").insert({ email: parsed.email });
  if (error) {
    if (error.code === "23505") return { status: "success", message: "You're already on the list. Thank you." };
    logError("newsletter.subscribe", error);
    return { status: "error", message: "We couldn't sign you up. Please try again." };
  }
  return { status: "success", message: "Thanks, you're on the list." };
}
