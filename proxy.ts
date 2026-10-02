import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { isSupabaseConfigured } from "@/lib/env";

// Next.js 16 renamed middleware to proxy. It only runs on routes that depend on the session,
// so the public storefront stays fully cacheable.
export async function proxy(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.next();
  return updateSession(request);
}

export const config = {
  matcher: ["/account/:path*", "/login", "/checkout", "/order-success/:path*"],
};
