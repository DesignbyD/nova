"use client";

import { useEffect } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ErrorState } from "@/components/ui/States";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Log for debugging only. The message is never shown to customers.
    console.error("Unhandled route error", { digest: error.digest });
  }, [error]);

  return (
    <Container className="py-16 sm:py-24">
      <ErrorState
        onRetry={reset}
        action={
          <ButtonLink href="/" variant="secondary">
            Back to home
          </ButtonLink>
        }
      />
    </Container>
  );
}
