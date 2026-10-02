import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountNav } from "@/components/account/AccountNav";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/States";
import { getUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: { default: "Account", template: "%s | Account | NOVA" }, robots: { index: false, follow: false } };

export default async function AccountLayout({ children }: LayoutProps<"/account">) {
  if (!isSupabaseConfigured())
    return (
      <Container className="py-16">
        <EmptyState title="Accounts aren't set up yet" description="Add your Supabase keys to enable sign-in. The README has the steps." action={<ButtonLink href="/">Back to home</ButtonLink>} />
      </Container>
    );

  // Checked on the server for every request: no user, no page.
  const user = await getUser();
  if (!user) redirect("/login?next=/account");

  return (
    <Container className="py-8 sm:py-12">
      <AccountNav />
      <div className="pt-8">{children}</div>
    </Container>
  );
}
