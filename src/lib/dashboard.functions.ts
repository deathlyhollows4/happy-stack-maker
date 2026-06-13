import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  getUserPlan,
  getPlanQuotas,
  readUsage,
  monthKey,
  dayKey,
} from "@/lib/entitlements.server";
import { envInput } from "./codewise.utils";

export const getDueReviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data } = await supabaseAdmin
      .from("progress")
      .select("topic_slug, retrievability, next_review_date, difficulty, stability")
      .eq("user_id", userId)
      .lte("next_review_date", new Date().toISOString())
      .order("next_review_date", { ascending: true });
    return data ?? [];
  });

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: subs }, { data: progress }, { data: topics }] = await Promise.all([
      supabase
        .from("submissions")
        .select("id, language, summary, created_at")
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("progress")
        .select("topic_slug, mastery, attempts, last_reviewed, retrievability, next_review_date, difficulty, stability")
        .eq("user_id", userId),
      supabase.from("topics").select("slug, name, category"),
    ]);
    return {
      submissions: subs ?? [],
      progress: progress ?? [],
      topics: topics ?? [],
    };
  });

export const getTopicBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ slug: z.string().min(1).max(50) }).parse(input))
  .handler(async ({ data }) => {
    const supabase = supabaseAdmin;
    const [{ data: topic }, { data: related }] = await Promise.all([
      supabase
        .from("topics")
        .select("slug, name, category, description, overview, operations, common_patterns, when_to_use, when_to_avoid, maang_frequency, prerequisites")
        .eq("slug", data.slug)
        .maybeSingle(),
      supabase.from("topics").select("slug, name, category, description"),
    ]);
    const sameCategory = (related ?? []).filter(
      (t) => t.category === topic?.category && t.slug !== topic?.slug,
    );
    const allSlugs = (related ?? []).map((t) => t.slug);
    return { topic, related: sameCategory, allSlugs };
  });

export const getEntitlements = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ environment: envInput }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { plan, status, pastDue } = await getUserPlan(userId, data.environment);
    const quotas = (await getPlanQuotas())[plan];
    const [reviewsUsed, roadmapsUsed] = await Promise.all([
      readUsage(userId, "review", monthKey()),
      readUsage(userId, "roadmap", dayKey()),
    ]);
    return {
      plan,
      status,
      pastDue,
      reviewsUsed,
      reviewsLimit: quotas.reviewsPerMonth,
      roadmapsUsed,
      problemsLimit: quotas.problemsPerDay,
    };
  });

export const exportUserData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [submissionsRes, progressRes, practiceRes] = await Promise.all([
      supabase
        .from("submissions")
        .select("id, language, code, summary, concepts, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("progress")
        .select("topic_slug, mastery, attempts, last_reviewed")
        .eq("user_id", userId),
      supabase
        .from("practice_problems")
        .select("id, topic_slug, title, prompt, starter_code, language, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    ]);

    const submissions = submissionsRes.data ?? [];
    const submissionIds = submissions.map((s) => s.id);

    let issues: any[] = [];
    if (submissionIds.length > 0) {
      const { data: issuesData } = await supabase
        .from("review_issues")
        .select("id, submission_id, line, severity, concept_slug, title, explanation, fix_hint")
        .in("submission_id", submissionIds)
        .order("submission_id");
      issues = issuesData ?? [];
    }

    return {
      exported_at: new Date().toISOString(),
      submissions,
      review_issues: issues,
      progress: progressRes.data ?? [],
      practice_problems: practiceRes.data ?? [],
    };
  });
