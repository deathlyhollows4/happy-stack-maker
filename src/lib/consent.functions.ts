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

export const seedFSRSTestData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const now = new Date();
    const rows = [
      { slug: "arrays", r: 0.45, d: 6.2, s: 1.8, nd: new Date(now.getTime() - 36 * 3600000).toISOString() },
      { slug: "hashing", r: 0.22, d: 7.8, s: 0.9, nd: new Date(now.getTime() - 12 * 3600000).toISOString() },
      { slug: "strings", r: 0.61, d: 4.5, s: 3.2, nd: new Date(now.getTime() - 2 * 3600000).toISOString() },
      { slug: "recursion", r: 0.55, d: 5.1, s: 2.6, nd: new Date(now.getTime() + 3 * 3600000).toISOString() },
      { slug: "dp", r: 0.72, d: 4.0, s: 4.5, nd: new Date(now.getTime() + 20 * 3600000).toISOString() },
      { slug: "two-pointers", r: 0.81, d: 3.2, s: 7.0, nd: new Date(now.getTime() + 72 * 3600000).toISOString() },
      { slug: "graphs", r: 0.68, d: 5.5, s: 3.8, nd: new Date(now.getTime() + 8 * 3600000).toISOString() },
    ];
    const upserts = rows.map((r) => ({
      user_id: userId,
      topic_slug: r.slug,
      stability: r.s,
      difficulty: r.d,
      retrievability: r.r,
      next_review_date: r.nd,
      mastery: r.r,
      attempts: 5 + Math.floor(Math.random() * 20),
      last_reviewed: now.toISOString(),
    }));
    const { error } = await supabaseAdmin.from("progress").upsert(upserts, { onConflict: "user_id,topic_slug" });
    if (error) console.error("seedFSRS failed:", error);
    return { seeded: upserts.length, error: error?.message ?? null };
  });
