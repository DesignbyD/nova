"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.200 3.5-8.800Z" />
      <path fill="#34A853" d="M12 24c3.200 0 6-1.100 7.900-2.900l-3.900-3c-1.100.7-2.500 1.200-4 1.200-3.100 0-5.700-2.100-6.600-4.900H1.400v3.100A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.400 14.400a7.200 7.200 0 0 1 0-4.800V6.500H1.400a12 12 0 0 0 0 10.900l4-3Z" />
      <path fill="#EA4335" d="M12 4.800c1.800 0 3.300.6 4.600 1.800l3.400-3.400A12 12 0 0 0 1.400 6.500l4 3.100C6.300 6.900 8.900 4.800 12 4.800Z" />
    </svg>
  );
}

export function LoginButton({ next }: { next: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setLoading(true);
    setError(null);
    try {
      const { error: authError } = await createClient().auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
      });
      // On success the browser leaves for Google, so loading stays on until the page unloads.
      if (authError) throw authError;
    } catch {
      setError("We couldn't start Google sign-in. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <Button variant="secondary" size="lg" fullWidth loading={loading} onClick={signIn} className="gap-3">
        {loading ? null : <GoogleMark />}
        {loading ? "Opening Google" : "Continue with Google"}
      </Button>
    </div>
  );
}
