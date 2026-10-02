"use client";

import { RouteError } from "@/components/ui/RouteError";

export default function CheckoutError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError {...props} title="Checkout hit a problem" description="Your cart is safe. Please try again." />;
}
