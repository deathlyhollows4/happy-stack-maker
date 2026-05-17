import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

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
      .select("id, display_name, created_at")
      .eq("id", userId)
      .maybeSingle();
    return { profile: data };
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
    const tables = [
      "review_issues",
      "submissions",
      "practice_problems",
      "progress",
      "usage_counters",
      "subscriptions",
      "user_roles",
      "profiles",
    ] as const;

    for (const t of tables) {
      const { error } = await sb.from(t).delete().eq("user_id", userId);
      // profiles uses id, not user_id
      if (error && t === "profiles") {
        await sb.from("profiles").delete().eq("id", userId);
      }
    }
    // Profile by id (in case the user_id pass above was a no-op)
    await sb.from("profiles").delete().eq("id", userId);

    const { error: delErr } = await sb.auth.admin.deleteUser(userId);
    if (delErr) {
      console.error("deleteUser failed:", delErr);
      return { ok: false as const, error: "Could not delete account. Contact support." };
    }
    return { ok: true as const };
  });
