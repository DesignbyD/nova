import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/utils/safe-redirect";

/** Google sends people back here with a one-time code, which we exchange for a session cookie. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(`${origin}${next}`);
      logError("auth.callback", error);
    } catch (error) {
      logError("auth.callback", error);
    }
  }
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
