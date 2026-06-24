import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";
import { ACCOUNT_DELETE_TABLES } from "@/lib/practice-data-ownership";

type ProfileRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "display_name" | "avatar_url" | "created_at"
>;

export const updateDisplayName = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ displayName: z.string().trim().min(1).max(80) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: data.displayName })
      .eq("id", userId);
    if (error) {
      console.error("updateDisplayName failed:", error);
      return { ok: false as const, error: "Could not update name." };
    }
    return { ok: true as const };
  });

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, created_at")
      .eq("id", userId)
      .maybeSingle();
    return { profile: data as ProfileRow | null };
  });

/**
 * Hard-delete the current user. Removes app data first (best-effort), then
 * deletes the auth user. The user is signed out client-side after this call.
 */
export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const sb = supabaseAdmin;

    // App-level data: order matters for FK-less tables.
    for (const t of ACCOUNT_DELETE_TABLES) {
      await sb.from(t).delete().eq("user_id", userId);
    }
    await sb.from("profiles").delete().eq("id", userId);

    const { error: delErr } = await sb.auth.admin.deleteUser(userId);
    if (delErr) {
      console.error("deleteUser failed:", delErr);
      return { ok: false as const, error: "Could not delete account. Contact support." };
    }
    return { ok: true as const };
  });
