"use client";

import { RouteError } from "@/components/ui/RouteError";

export default function ProductError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError {...props} title="We couldn't load this product" />;
}
