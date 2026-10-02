"use client";

import { useActionState } from "react";
import { subscribeToNewsletter, type NewsletterState } from "@/app/actions/newsletter";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";

const initial: NewsletterState = { status: "idle", message: "" };

export function NewsletterForm() {
  const [state, action, pending] = useActionState(subscribeToNewsletter, initial);

  if (state.status === "success") return <Alert tone="success" title="You're subscribed">{state.message}</Alert>;

  return (
    <form action={action} noValidate className="flex flex-col gap-4 sm:flex-row sm:items-start">
      {/* Honeypot: hidden from people and assistive tech, tempting to bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <TextField
        label="Email address"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        wrapperClassName="flex-1"
        error={state.status === "error" ? state.message : undefined}
      />
      <Button type="submit" variant="primary" size="lg" loading={pending} className="sm:mt-[1.625rem]">
        {pending ? "Subscribing" : "Subscribe"}
      </Button>
    </form>
  );
}
