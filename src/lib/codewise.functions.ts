import { createServerFn } from "@tanstack/react-start";
import { z, type ZodType } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  getUserPlan,
  consumeQuota,
  readUsage,
  getPlanQuotas,
  monthKey,
  dayKey,
  refreshPlanQuotas,
} from "@/lib/entitlements.server";
import type { PaddleEnv } from "@/lib/paddle.server";
import {
  LANGS,
  ReviewIssueSchema,
  ReviewResponseSchema,
  VALID_TOPIC_SLUGS,
  SYSTEM_PROMPT,
} from "@/lib/review.constants";

const envInput = z.enum(["sandbox", "live"]).default("sandbox") as z.ZodType<PaddleEnv>;

export function extractJson(raw: string): string {
  const trimmed = raw.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence?.[1]) return fence[1].trim();
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }
  return trimmed;
}

async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin.rpc("has_role", {
    p_user_id: userId,
    p_role: "admin",
  });
  return !!data;
}

const FSRS_WEIGHTS = [0.4, 0.6, 2.4, 5.8, 4.9, 0.9, 0.8, 0.7, 1.5, 0.1];

export function computeFSRSGrade(
  issues: { severity: string; title: string }[],
): 1 | 2 | 3 | 4 {
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");

  if (
    errors.length >= 2 ||
    issues.some(
      (i) =>
        i.title.toLowerCase().includes("syntax") ||
        i.title.toLowerCase().includes("incorrect") ||
        i.title.toLowerCase().includes("wrong"),
    )
  )
    return 1;

  if (errors.length === 1 || warnings.length >= 3) return 2;
  if (warnings.length >= 1) return 3;
  return 4;
}

async function updateFSRS(
  userId: string,
  topicSlug: string,
  grade: 1 | 2 | 3 | 4,
): Promise<void> {
  const { data: row } = await supabaseAdmin
    .from("progress")
    .select("stability, difficulty, retrievability, last_reviewed, attempts")
    .eq("user_id", userId)
    .eq("topic_slug", topicSlug)
    .single();

  const w = FSRS_WEIGHTS;

  const D = row?.difficulty ?? 5.0;
  const S = row?.stability ?? 2.5;

  // Compute actual retrieval probability from elapsed time since last review
  const now = Date.now();
  const lastReviewMs = row?.last_reviewed ? new Date(row.last_reviewed).getTime() : now;
  const elapsedDays = Math.max(0, (now - lastReviewMs) / 86400000);
  const currentR = row ? (1 + elapsedDays / (9 * Math.max(0.1, S))) ** (-1) : 0.9;

  const newDifficulty = Math.max(1, Math.min(10, D - w[2] * (grade - 3)));

  let newStability: number;
  if (grade === 1) {
    newStability = Math.max(0.1, S * 0.5);
  } else {
    newStability =
      S *
      (1 +
        w[3] *
          Math.pow(newDifficulty, -w[4]) *
          Math.pow(S, -w[5]) *
          (Math.exp(1 - currentR) - 1));
    newStability = Math.max(0.1, newStability);
  }

  // Proper interval: stability = days until R drops to 90%
  const intervalDays = Math.max(1, Math.round(newStability));
  // Track actual retrievability after interval
  const newR = grade === 1 ? 0 : (1 + intervalDays / (9 * Math.max(0.1, newStability))) ** (-1);
  const nextReview = new Date(Date.now() + intervalDays * 86400000);

  await supabaseAdmin.from("progress").upsert(
    {
      user_id: userId,
      topic_slug: topicSlug,
      stability: newStability,
      difficulty: newDifficulty,
      retrievability: newR,
      next_review_date: nextReview.toISOString(),
      mastery: grade >= 3 ? 0.9 : grade === 2 ? 0.6 : 0.3,
      attempts: (row?.attempts ?? 0) + 1,
      last_reviewed: new Date().toISOString(),
    },
    { onConflict: "user_id,topic_slug" },
  );
}

export const reviewCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        code: z.string().min(1).max(20_000),
        language: z.enum(LANGS),
        environment: envInput,
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { ok: false as const, error: "AI is not configured. Please add LOVABLE_API_KEY." };
    }

    // Entitlement check
    const { plan } = await getUserPlan(userId, data.environment);
    const limit = (await getPlanQuotas())[plan].reviewsPerMonth;
    const allowed = await consumeQuota(userId, "review", limit, monthKey());
    if (!allowed) {
      return {
        ok: false as const,
        error:
          plan === "pro"
            ? `You've used all ${limit} reviews this month. Quota resets on the 1st.`
            : `Free plan limit reached (${limit} reviews / month). Upgrade to Pro for 1500/month.`,
        upgradeRequired: plan === "free",
      };
    }

    const userPrompt = `Language: ${data.language}\n\nStudent code:\n\`\`\`${data.language}\n${data.code}\n\`\`\`\n\nReview it.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const text = await aiRes.text();
      console.error("AI gateway error:", aiRes.status, text.slice(0, 500));
      if (aiRes.status === 429)
        return { ok: false as const, error: "Rate limited. Try again in a minute." };
      if (aiRes.status === 402)
        return {
          ok: false as const,
          error: "AI credits exhausted. Add credits in Lovable settings.",
        };
      console.error("AI gateway error", aiRes.status, text.slice(0, 500));
      return {
        ok: false as const,
        error: "AI service is temporarily unavailable. Please try again.",
      };
    }

    const aiJson = await aiRes.json();
    let content: string = aiJson?.choices?.[0]?.message?.content ?? "{}";

    let parsed: z.infer<typeof ReviewResponseSchema> | null = null;
    let attempt = 0;
    const maxAttempts = 3;
    while (attempt < maxAttempts) {
      attempt++;
      try {
        parsed = ReviewResponseSchema.parse(JSON.parse(extractJson(content)));
        break;
      } catch (parseErr) {
        console.error(
          "reviewCode parse attempt",
          attempt,
          "failed:",
          parseErr,
          "content preview:",
          content.slice(0, 200),
        );
        if (attempt < maxAttempts) {
          const retryRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "openai/gpt-5-mini",
              messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: userPrompt },
              ],
              response_format: { type: "json_object" },
            }),
          });
          if (!retryRes.ok) {
            console.error("AI gateway retry error:", retryRes.status);
            continue;
          }
          const retryJson = await retryRes.json();
          content = retryJson?.choices?.[0]?.message?.content ?? "{}";
        }
      }
    }
    if (!parsed) {
      console.error("reviewCode: malformed AI output after 3 attempts. Raw preview:", content.slice(0, 500));
      return {
        ok: false as const,
        error: "AI returned an unexpected response. Please try again.",
      };
    }

    // persist submission
    const { data: sub, error: subErr } = await supabase
      .from("submissions")
      .insert({
        user_id: userId,
        language: data.language,
        code: data.code,
        summary: parsed.summary,
        concepts: parsed.concepts.filter((c) => VALID_TOPIC_SLUGS.has(c)),
      })
      .select("id")
      .single();
    if (subErr || !sub) {
      console.error("reviewCode insert submission failed:", subErr);
      return { ok: false as const, error: "Something went wrong. Please try again." };
    }

    // persist issues
    if (parsed.issues.length > 0) {
      const rows = parsed.issues.map((i) => ({
        submission_id: sub.id,
        user_id: userId,
        line: i.line ?? null,
        severity: i.severity,
        concept_slug:
          i.concept_slug && VALID_TOPIC_SLUGS.has(i.concept_slug) ? i.concept_slug : null,
        title: i.title,
        explanation: i.explanation,
        fix_hint: i.fix_hint ?? null,
      }));
      const { error: issuesErr } = await supabase.from("review_issues").insert(rows);
      if (issuesErr) console.error("review_issues insert failed:", issuesErr);
    }

    // FSRS: auto-grade from review issues per concept
    const concepts = parsed.concepts.filter((c) => VALID_TOPIC_SLUGS.has(c));
    if (concepts.length > 0) {
      await Promise.all(
        concepts.map((slug) => {
          // Filter issues matching this concept (null concept_slug = "general" issue counts toward all)
          const conceptIssues = parsed.issues.filter(
            (i) => i.concept_slug === slug || i.concept_slug === null
          );
          const grade = computeFSRSGrade(conceptIssues);
          return updateFSRS(userId, slug, grade);
        })
      );
    }

    return {
      ok: true as const,
      submissionId: sub.id,
      summary: parsed.summary,
      concepts,
      issues: parsed.issues,
    };
  });

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

export const getSubmission = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const [{ data: sub }, { data: issues }] = await Promise.all([
      supabase.from("submissions").select("*").eq("id", data.id).maybeSingle(),
      supabase.from("review_issues").select("*").eq("submission_id", data.id),
    ]);
    return { submission: sub, issues: issues ?? [] };
  });

export const getPublicSubmission = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const supabase = supabaseAdmin;
    const [{ data: sub }, { data: issues }] = await Promise.all([
      supabase.from("submissions").select("*").eq("id", data.id).maybeSingle(),
      supabase.from("review_issues").select("*").eq("submission_id", data.id),
    ]);
    return { submission: sub, issues: issues ?? [] };
  });

export const getTopicBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ slug: z.string().min(1).max(50) }).parse(input))
  .handler(async ({ data }) => {
    const supabase = supabaseAdmin;
    const [{ data: topic }, { data: related }] = await Promise.all([
      supabase
        .from("topics")
        .select("slug, name, category, description")
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

export const generatePractice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        topicSlug: z.string().nullable().optional(),
        language: z.enum(LANGS).default("python"),
        environment: envInput,
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { ok: false as const, error: "AI not configured." };

    // Entitlement check
    const { plan } = await getUserPlan(userId, data.environment);
    const limit = (await getPlanQuotas())[plan].problemsPerDay;
    const allowed = await consumeQuota(userId, "roadmap", limit, dayKey());
    if (!allowed) {
      return {
        ok: false as const,
        error:
          plan === "pro"
            ? `You've used all ${limit} roadmap generations today. Resets at UTC midnight.`
            : `Free plan limit reached (${limit} roadmap / day). Upgrade to Pro for 15/day.`,
        upgradeRequired: plan === "free",
      };
    }

    let topicSlug = data.topicSlug;
    if (!topicSlug) {
      const { data: weakest } = await supabase
        .from("progress")
        .select("topic_slug, mastery")
        .order("mastery", { ascending: true })
        .limit(1);
      topicSlug = weakest?.[0]?.topic_slug ?? "arrays";
    }
    if (!VALID_TOPIC_SLUGS.has(topicSlug)) topicSlug = "arrays";

    const { data: topic } = await supabase
      .from("topics")
      .select("name, description")
      .eq("slug", topicSlug)
      .maybeSingle();

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        messages: [
          {
            role: "system",
            content: `You generate small, focused CS practice problems for students. Difficulty: easy-medium (LeetCode Easy / classic CS1-CS2). Return JSON: { "title": string, "prompt": string (markdown ok, include examples + constraints), "starter_code": string (skeleton in the requested language with TODO comments) }. No markdown fences around the JSON.`,
          },
          {
            role: "user",
            content: `Topic: ${topic?.name ?? topicSlug}. ${topic?.description ?? ""}\nLanguage: ${data.language}\nGenerate ONE practice problem aimed at strengthening this concept.`,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) return { ok: false as const, error: "Rate limited." };
      if (aiRes.status === 402) return { ok: false as const, error: "AI credits exhausted." };
      return { ok: false as const, error: "AI error generating problem." };
    }
    const aiJson = await aiRes.json();
    let content: string = aiJson?.choices?.[0]?.message?.content ?? "{}";

    let parsed: { title: string; prompt: string; starter_code: string } | null = null;
    let attempt = 0;
    const maxAttempts = 3;
    while (attempt < maxAttempts) {
      attempt++;
      try {
        parsed = z
          .object({
            title: z.string().min(1).max(200),
            prompt: z.string().min(1).max(5000),
            starter_code: z.string().max(5000).optional().default(""),
          })
          .parse(JSON.parse(extractJson(content)));
        break;
      } catch (parseErr) {
        console.error(
          "generatePractice parse attempt",
          attempt,
          "failed:",
          parseErr,
          "content preview:",
          content.slice(0, 200),
        );
        if (attempt < maxAttempts) {
          const retryRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "openai/gpt-5-mini",
              messages: [
                {
                  role: "system",
                  content: `You generate small, focused CS practice problems for students. Difficulty: easy-medium (LeetCode Easy / classic CS1-CS2). Return JSON: { "title": string, "prompt": string (markdown ok, include examples + constraints), "starter_code": string (skeleton in the requested language with TODO comments) }. No markdown fences around the JSON.`,
                },
                {
                  role: "user",
                  content: `Topic: ${topic?.name ?? topicSlug}. ${topic?.description ?? ""}\nLanguage: ${data.language}\nGenerate ONE practice problem aimed at strengthening this concept.`,
                },
              ],
              response_format: { type: "json_object" },
            }),
          });
          if (!retryRes.ok) {
            console.error("AI gateway retry error:", retryRes.status);
            continue;
          }
          const retryJson = await retryRes.json();
          content = retryJson?.choices?.[0]?.message?.content ?? "{}";
        }
      }
    }
    if (!parsed) {
      console.error("generatePracticeProblem: malformed AI output after 3 attempts. Raw preview:", content.slice(0, 500));
      return {
        ok: false as const,
        error: "AI returned an unexpected response. Please try again.",
      };
    }

    const { data: row, error } = await supabase
      .from("practice_problems")
      .insert({
        user_id: userId,
        topic_slug: topicSlug,
        title: parsed.title,
        prompt: parsed.prompt,
        starter_code: parsed.starter_code,
        language: data.language,
      })
      .select("*")
      .single();
    if (error || !row) {
      console.error("generatePractice insert failed:", error);
      return { ok: false as const, error: "Something went wrong. Please try again." };
    }
    return { ok: true as const, problem: row };
  });

export const listPractice = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("practice_problems")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    return { problems: data ?? [] };
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

export const getAdminDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const admin = supabaseAdmin;

    if (!(await isAdmin(userId))) {
      return { ok: false as const, error: "Forbidden", users: [], totals: {} };
    }

    const now = new Date();
    const mk = monthKey(now);

    const [profilesRes, subsRes, usageRes] = await Promise.all([
      admin
        .from("profiles")
        .select("id, display_name, created_at")
        .order("created_at", { ascending: false }),
      admin.from("subscriptions").select("user_id, status, current_period_end, environment"),
      admin.from("usage_counters").select("user_id, kind, count").eq("period_key", mk),
    ]);

    const profiles = profilesRes.data ?? [];
    const subs = subsRes.data ?? [];
    const usage = usageRes.data ?? [];

    const subByUser = new Map<string, { status: string; end: string | null }>();
    for (const s of subs) {
      const existing = subByUser.get(s.user_id);
      if (!existing || (s.status === "active" && existing.status !== "active")) {
        subByUser.set(s.user_id, {
          status: s.status as string,
          end: s.current_period_end as string | null,
        });
      }
    }

    const reviewCountByUser = new Map<string, number>();
    const roadmapCountByUser = new Map<string, number>();
    for (const u of usage) {
      if (u.kind === "review")
        reviewCountByUser.set(
          u.user_id,
          (reviewCountByUser.get(u.user_id) ?? 0) + (u.count as number),
        );
      else if (u.kind === "roadmap")
        roadmapCountByUser.set(
          u.user_id,
          (roadmapCountByUser.get(u.user_id) ?? 0) + (u.count as number),
        );
    }

    let totalReviews = 0;
    let totalPro = 0;
    const users = profiles.map((p) => {
      const s = subByUser.get(p.id);
      const endMs = s?.end ? new Date(s.end).getTime() : null;
      const inPeriod = endMs === null || endMs > now.getTime();
      const isPro =
        !!s &&
        ((["active", "trialing", "past_due"].includes(s.status) && inPeriod) ||
          (s.status === "canceled" && endMs !== null && endMs > now.getTime()));

      const reviews = reviewCountByUser.get(p.id) ?? 0;
      const roadmaps = roadmapCountByUser.get(p.id) ?? 0;
      totalReviews += reviews;
      if (isPro) totalPro++;

      return {
        id: p.id,
        display_name: p.display_name ?? "",
        created_at: p.created_at as string,
        plan: isPro ? "pro" : "free",
        subscription: s?.status ?? null,
        reviews_this_month: reviews,
        roadmaps_today: roadmaps,
      };
    });

    return {
      ok: true as const,
      users,
      totals: {
        users: users.length,
        pro_users: totalPro,
        reviews_this_month: totalReviews,
        free_users: users.length - totalPro,
      },
    };
  });

export const getAdminSeats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;

    if (!(await isAdmin(userId))) return { ok: false as const, error: "Forbidden", users: [] };

    const [profilesRes, rolesRes] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id, display_name, created_at")
        .order("created_at", { ascending: false }),
      supabaseAdmin.from("user_roles").select("user_id, role"),
    ]);

    const rolesByUser = new Map<string, string[]>();
    for (const r of rolesRes.data ?? []) {
      const existing = rolesByUser.get(r.user_id) ?? [];
      existing.push(r.role as string);
      rolesByUser.set(r.user_id, existing);
    }

    const users = (profilesRes.data ?? []).map((p) => ({
      id: p.id,
      display_name: p.display_name ?? "",
      created_at: p.created_at as string,
      roles: rolesByUser.get(p.id) ?? [],
    }));

    return { ok: true as const, users };
  });

export const grantAdminRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ targetUserId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;

    if (!(await isAdmin(userId))) return { ok: false as const, error: "Forbidden" };

    const { error } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: data.targetUserId, role: "admin" }, { onConflict: "user_id,role" });
    if (error) {
      console.error("grantAdminRole failed:", error);
      return { ok: false as const, error: "Failed to grant admin role." };
    }
    return { ok: true as const };
  });

export const revokeAdminRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ targetUserId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;

    if (!(await isAdmin(userId))) return { ok: false as const, error: "Forbidden" };

    const { error } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.targetUserId)
      .eq("role", "admin");
    if (error) {
      console.error("revokeAdminRole failed:", error);
      return { ok: false as const, error: "Failed to revoke admin role." };
    }
    return { ok: true as const };
  });

export const exportAllUserData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;

    if (!(await isAdmin(userId))) return { ok: false as const, error: "Forbidden", data: null };

    const [submissionsRes, issuesRes, progressRes, practiceRes] = await Promise.all([
      supabaseAdmin
        .from("submissions")
        .select("id, user_id, language, code, summary, concepts, created_at")
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("review_issues")
        .select(
          "id, submission_id, user_id, line, severity, concept_slug, title, explanation, fix_hint",
        ),
      supabaseAdmin
        .from("progress")
        .select("user_id, topic_slug, mastery, attempts, last_reviewed"),
      supabaseAdmin
        .from("practice_problems")
        .select("id, user_id, topic_slug, title, prompt, starter_code, language, created_at"),
    ]);

    return {
      ok: true as const,
      data: {
        exported_at: new Date().toISOString(),
        submissions: submissionsRes.data ?? [],
        review_issues: issuesRes.data ?? [],
        progress: progressRes.data ?? [],
        practice_problems: practiceRes.data ?? [],
      },
    };
  });

export type CurriculumMapping = {
  topic_slug: string;
  sppu_course: string | null;
  sppu_module: string | null;
  nptel_course: string | null;
  nptel_module: string | null;
  year_semester: string | null;
};

export const getCurriculumMappings = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ mappings: CurriculumMapping[] }> => {
    const admin = supabaseAdmin as any;
    const { data } = await admin
      .from("curriculum_mappings")
      .select("topic_slug, sppu_course, sppu_module, nptel_course, nptel_module, year_semester")
      .order("topic_slug");
    return { mappings: (data ?? []) as CurriculumMapping[] };
  },
);

export const upsertCurriculumMapping = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        topic_slug: z.string(),
        sppu_course: z.string().nullable().optional(),
        sppu_module: z.string().nullable().optional(),
        nptel_course: z.string().nullable().optional(),
        nptel_module: z.string().nullable().optional(),
        year_semester: z.string().nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;

    if (!(await isAdmin(userId))) return { ok: false as const, error: "Forbidden" };

    const { error } = await (supabaseAdmin as any).from("curriculum_mappings").upsert(
      {
        topic_slug: data.topic_slug,
        sppu_course: data.sppu_course ?? null,
        sppu_module: data.sppu_module ?? null,
        nptel_course: data.nptel_course ?? null,
        nptel_module: data.nptel_module ?? null,
        year_semester: data.year_semester ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "topic_slug" },
    );
    if (error) {
      console.error("upsertCurriculumMapping failed:", error);
      return { ok: false as const, error: "Failed to save mapping." };
    }
    return { ok: true as const };
  });

// --- App Config ---

export type AppConfig = Record<string, string>;

export const getAppConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    if (!(await isAdmin(userId))) return { ok: false as const, error: "Forbidden", config: {} };
    const { data } = await supabaseAdmin.from("app_config").select("key, value");
    const config: AppConfig = {};
    for (const row of data ?? []) {
      config[row.key] = row.value as string;
    }
    return { ok: true as const, config };
  });

export const setAppConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ entries: z.array(z.object({ key: z.string().min(1), value: z.string() })) })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    if (!(await isAdmin(userId))) return { ok: false as const, error: "Forbidden" };
    for (const entry of data.entries) {
      await supabaseAdmin
        .from("app_config")
        .upsert(
          { key: entry.key, value: entry.value, updated_at: new Date().toISOString() },
          { onConflict: "key" },
        );
    }
    refreshPlanQuotas();
    return { ok: true as const };
  });

// --- Blog Posts ---

export type BlogPostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  tags: string[];
  author: string;
  published: boolean;
  created_at: string;
  updated_at: string;
};

export const getAllBlogPosts = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await supabaseAdmin
    .from("blog_posts")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });
  return (data as BlogPostRow[]) ?? [];
});

export const getBlogPostBySlug = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ slug: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const { data: post } = await supabaseAdmin
      .from("blog_posts")
      .select("*")
      .eq("slug", data.slug)
      .eq("published", true)
      .maybeSingle();
    return post as BlogPostRow | null;
  });

export const listAllBlogPostsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    if (!(await isAdmin(userId)))
      return { ok: false as const, error: "Forbidden", posts: [] as BlogPostRow[] };
    const { data } = await supabaseAdmin
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false });
    return { ok: true as const, posts: (data ?? []) as BlogPostRow[] };
  });

export const createBlogPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        slug: z.string().min(1).max(200),
        title: z.string().min(1).max(500),
        excerpt: z.string().default(""),
        body: z.string().default("[]"),
        tags: z.array(z.string()).default([]),
        author: z.string().default("CodeWise"),
        published: z.boolean().default(false),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    if (!(await isAdmin(userId))) return { ok: false as const, error: "Forbidden" };
    const { error } = await supabaseAdmin.from("blog_posts").insert({
      slug: data.slug,
      title: data.title,
      excerpt: data.excerpt,
      body: data.body,
      tags: data.tags,
      author: data.author,
      published: data.published,
    });
    if (error) {
      console.error("createBlogPost failed:", error);
      return { ok: false as const, error: error.message };
    }
    return { ok: true as const };
  });

export const updateBlogPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        slug: z.string().min(1).max(200),
        title: z.string().min(1).max(500),
        excerpt: z.string().default(""),
        body: z.string().default("[]"),
        tags: z.array(z.string()).default([]),
        author: z.string().default("CodeWise"),
        published: z.boolean().default(false),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    if (!(await isAdmin(userId))) return { ok: false as const, error: "Forbidden" };
    const { error } = await supabaseAdmin
      .from("blog_posts")
      .update({
        slug: data.slug,
        title: data.title,
        excerpt: data.excerpt,
        body: data.body,
        tags: data.tags,
        author: data.author,
        published: data.published,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) {
      console.error("updateBlogPost failed:", error);
      return { ok: false as const, error: error.message };
    }
    return { ok: true as const };
  });

export const deleteBlogPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    if (!(await isAdmin(userId))) return { ok: false as const, error: "Forbidden" };
    const { error } = await supabaseAdmin.from("blog_posts").delete().eq("id", data.id);
    if (error) {
      console.error("deleteBlogPost failed:", error);
      return { ok: false as const, error: error.message };
    }
    return { ok: true as const };
  });

// --- User Consent ---

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

// --- User Consent ---

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

// --- Research Telemetry ---

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

// --- Research Data Export (admin-gated, anonymized) ---

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

// Dev utility: seeds progress table with mock FSRS data for testing ReviewQueue urgency levels.
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
