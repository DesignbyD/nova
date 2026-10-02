import type { Metadata } from "next";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";
import { Container } from "@/components/ui/Container";
import { displayName, getUser } from "@/lib/auth";
import { isAdminConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Checkout", robots: { index: false, follow: false } };

export default async function CheckoutPage() {
  const user = await getUser();
  return (
    <Container className="py-8 sm:py-12">
      <CheckoutClient
        defaultName={user ? displayName(user) : ""}
        defaultEmail={user?.email ?? ""}
        signedIn={Boolean(user)}
        ordersEnabled={isAdminConfigured()}
      />
    </Container>
  );
}
