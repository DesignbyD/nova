import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { logError } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

/** POST only, so a link or image on another site cannot sign someone out. */
export async function POST(request: Request) {
  if (isSupabaseConfigured()) {
    try {
      await (await createClient()).auth.signOut();
    } catch (error) {
      logError("auth.signout", error);
    }
  }
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
