import "server-only";

import type { User } from "@supabase/supabase-js";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function getUser(): Promise<User | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();

    return error ? null : data.user;
  } catch {
    return null;
  }
}

export async function getUserFromRequest(
  request: Request,
): Promise<User | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return null;
    }

    const accessToken = authorization
      .slice("Bearer ".length)
      .trim();

    if (!accessToken) {
      return null;
    }

    const supabase = await createClient();

    const { data, error } =
      await supabase.auth.getUser(accessToken);

    return error ? null : data.user;
  } catch {
    return null;
  }
}

export function displayName(user: User): string {
  const meta = user.user_metadata as
    | {
        full_name?: string;
        name?: string;
      }
    | undefined;

  return (
    meta?.full_name ??
    meta?.name ??
    user.email?.split("@")[0] ??
    "there"
  );
}

export function avatarUrl(user: User): string | null {
  const meta = user.user_metadata as
    | {
        avatar_url?: string;
        picture?: string;
      }
    | undefined;

  return meta?.avatar_url ?? meta?.picture ?? null;
}