import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginButton } from "@/components/account/LoginButton";
import { Alert } from "@/components/ui/Alert";
import { Container } from "@/components/ui/Container";
import { NovaStar } from "@/components/ui/NovaStar";
import { getUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { safeNext } from "@/lib/utils/safe-redirect";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default async function LoginPage(props: PageProps<"/login">) {
  const sp = await props.searchParams;
  const next = safeNext(typeof sp.next === "string" ? sp.next : null);
  const failed = sp.error === "auth";

  if (await getUser()) redirect(next);

  return (
    <Container className="py-14 sm:py-24">
      <div className="mx-auto max-w-md">
        <NovaStar className="size-8 text-accent" />
        <h1 className="mt-6 text-display-md font-semibold">Sign in to NOVA</h1>
        <p className="mt-4 font-serif text-lead text-ink-soft">See your orders and check out faster. We use your Google account, so there&apos;s no new password to keep.</p>

        <div className="mt-10 flex flex-col gap-4">
          {failed ? (
            <Alert tone="danger" title="Sign-in didn't complete">
              Something went wrong while signing you in. Please try again.
            </Alert>
          ) : null}
          {isSupabaseConfigured() ? (
            <LoginButton next={next} />
          ) : (
            <Alert tone="warning" title="Sign-in isn't set up yet">
              Add your Supabase keys to enable Google sign-in. See the README for the steps.
            </Alert>
          )}
        </div>
      </div>
    </Container>
  );
}
