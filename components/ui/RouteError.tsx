"use client";

import { useEffect } from "react";
import { ButtonLink } from "./Button";
import { Container } from "./Container";
import { ErrorState } from "./States";

/** Shared body for route-level error.tsx files. Logs the digest; never shows the raw message. */
export function RouteError({ error, reset, title, description }: { error: Error & { digest?: string }; reset: () => void; title?: string; description?: string }) {
  useEffect(() => {
    console.error("Route error", { digest: error.digest });
  }, [error]);
  return (
    <Container className="py-16 sm:py-24">
      <ErrorState title={title} description={description} onRetry={reset} action={<ButtonLink href="/" variant="secondary">Back to home</ButtonLink>} />
    </Container>
  );
}
