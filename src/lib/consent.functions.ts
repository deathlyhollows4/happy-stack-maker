import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { isAdmin } from "./codewise.utils";

export const updateProfileAvatar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ avatar_url: z.string().url() }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { error } = await (supabaseAdmin as any)
      .from("profiles")
      .update({ avatar_url: data.avatar_url })
      .eq("id", userId);
    if (error) {
      console.error("updateProfileAvatar failed:", error);
      return { ok: false as const, error: "Something went wrong. Please try again." };
    }
    return { ok: true as const, avatar_url: data.avatar_url };
  });

export const getUserConsent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await (supabase as any)
      .from("user_consent")
      .select("consent_given, consented_at, consent_version")
      .eq("user_id", userId)
      .maybeSingle();
    return { consent: (data as any) ?? null };
  });

export const setUserConsent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ consent_given: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { error } = await (supabaseAdmin as any).from("user_consent").upsert(
      {
        user_id: userId,
        consent_given: data.consent_given,
        consented_at: new Date().toISOString(),
        consent_version: "1.0",
      },
      { onConflict: "user_id" },
    );
    if (error) {
      console.error("setUserConsent failed:", error);
      return { ok: false as const, error: "Something went wrong. Please try again." };
    }
    return { ok: true as const };
  });

export const recordResearchEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        event_type: z.string().min(1).max(100),
        payload: z.record(z.unknown()).default({}),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;

    try {
      const { data: consentRow } = await (supabaseAdmin as any)
        .from("user_consent")
        .select("consent_given")
        .eq("user_id", userId)
        .maybeSingle();

      if (!consentRow?.consent_given) return { ok: true as const, recorded: false };

      const { error } = await (supabaseAdmin as any).from("research_events").insert({
        user_id: userId,
        event_type: data.event_type,
        payload: data.payload as Record<string, unknown>,
      });
      if (error) {
        console.error("recordResearchEvent insert failed:", error.message);
        return { ok: true as const, recorded: false };
      }
      return { ok: true as const, recorded: true };
    } catch (err: any) {
      console.error("recordResearchEvent failed:", err?.message ?? err);
      return { ok: true as const, recorded: false };
    }
  });

export const exportResearchData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    if (!(await isAdmin(userId)))
      return {
        ok: false as const,
        error: "Forbidden",
      } as const;

    const { data: events } = await (supabaseAdmin as any)
      .from("research_events")
      .select("event_type, payload, created_at")
      .order("created_at", { ascending: false });

    const rows = events as { event_type: string; payload: any; created_at: string }[] | null;
    const safeRows = rows ?? [];

    const eventCounts: Record<string, number> = {};
    const langBreakdown: Record<string, number> = {};
    const conceptDist: Record<string, number> = {};
    const severityDist: Record<string, number> = {};

    for (const row of safeRows) {
      eventCounts[row.event_type] = (eventCounts[row.event_type] ?? 0) + 1;
      const p = row.payload ?? {};
      if (typeof p.language === "string") {
        langBreakdown[p.language] = (langBreakdown[p.language] ?? 0) + 1;
      }
      if (p.concept_count != null) {
        const cnt = Number(p.concept_count);
        conceptDist[String(cnt)] = (conceptDist[String(cnt)] ?? 0) + 1;
      }
      if (typeof p.severity === "string") {
        severityDist[p.severity] = (severityDist[p.severity] ?? 0) + 1;
      }
    }

    return {
      ok: true as const,
      total_events: safeRows.length,
      event_counts: eventCounts,
      language_breakdown: langBreakdown,
      concept_distribution: conceptDist,
      severity_distribution: severityDist,
      events: safeRows.map((r) => ({
        event_type: r.event_type,
        created_at: r.created_at,
      })),
    };
  });

