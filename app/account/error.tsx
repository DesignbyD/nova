"use client";

import { RouteError } from "@/components/ui/RouteError";

export default function AccountError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError {...props} title="We couldn't load your account" />;
}
