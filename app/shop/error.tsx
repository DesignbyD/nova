"use client";

import { RouteError } from "@/components/ui/RouteError";

export default function ShopError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError {...props} title="We couldn't load the shop" description="Something interrupted the connection. Please try again." />;
}
