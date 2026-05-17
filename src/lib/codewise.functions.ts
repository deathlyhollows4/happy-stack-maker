import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  getUserPlan,
  consumeQuota,
  readUsage,
  PLAN_QUOTAS,
  monthKey,
  dayKey,
} from "@/lib/entitlements.server";
import type { PaddleEnv } from "@/lib/paddle.server";

const envInput = z
  .enum(["sandbox", "live"])
  .default("sandbox") as z.ZodType<PaddleEnv>;

const LANGS = ["python", "javascript", "java", "cpp"] as const;

const ReviewIssueSchema = z.object({
  line: z.number().int().nullable().optional(),
  severity: z.enum(["error", "warning", "info"]).default("info"),
  concept_slug: z.string().nullable().optional(),
  title: z.string().min(1).max(200),
  explanation: z.string().min(1).max(2000),
  fix_hint: z.string().max(2000).nullable().optional(),
  is_correct_pattern: z.boolean().optional(),
});

const ReviewResponseSchema = z.object({
  summary: z.string().min(1).max(2000),
  concepts: z.array(z.string()).max(20),
  issues: z.array(ReviewIssueSchema).max(25),
});

const VALID_TOPIC_SLUGS = new Set([
  "arrays",
  "strings",
  "hashing",
  "linked-lists",
  "stacks",
  "queues",
  "recursion",
  "two-pointers",
  "sliding-window",
  "binary-search",
  "sorting",
  "trees",
  "bst",
  "heaps",
  "graphs",
  "dp",
  "greedy",
  "backtracking",
  "bit-manipulation",
  "complexity",
]);

const SYSTEM_PROMPT = `You are CodeWise, an AI code reviewer for computer-science students.
Your job is NOT to write production-quality code. Your job is to diagnose the
underlying CS concept the student does not yet fully understand, and explain it
in a teaching tone: concise, encouraging, and concrete.

For every issue you raise:
- explain WHY it's an issue in terms of the underlying CS concept
- map it to ONE concept_slug from this list (use null if no good match):
  arrays, strings, hashing, linked-lists, stacks, queues, recursion,
  two-pointers, sliding-window, binary-search, sorting, trees, bst,
  heaps, graphs, dp, greedy, backtracking, bit-manipulation, complexity
- give a concrete fix_hint (no full rewrites, guide them)
- severity: "error" = breaks correctness, "warning" = correctness/efficiency risk, "info" = style/clarity

If the code is good, return ZERO issues with severity error/warning, but you MAY
add 1-2 "info" items describing what concept the student DID demonstrate well,
with is_correct_pattern: true.

The "concepts" array lists all topic slugs touched by this code (correct or not),
used for mastery tracking. Pick 1-5 slugs from the list above.

Return ONLY JSON matching the requested schema. No markdown, no prose outside JSON.`;

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
    const limit = PLAN_QUOTAS[plan].reviewsPerMonth;
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
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const text = await aiRes.text();
      if (aiRes.status === 429)
        return { ok: false as const, error: "Rate limited. Try again in a minute." };
      if (aiRes.status === 402)
        return {
          ok: false as const,
          error: "AI credits exhausted. Add credits in Lovable settings.",
        };
      return { ok: false as const, error: `AI error: ${text.slice(0, 200)}` };
    }

    const aiJson = await aiRes.json();
    const content: string = aiJson?.choices?.[0]?.message?.content ?? "{}";

    let parsed;
    try {
      parsed = ReviewResponseSchema.parse(JSON.parse(content));
    } catch {
      return { ok: false as const, error: "AI returned malformed output. Try again." };
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
      await supabase.from("review_issues").insert(rows);
    }

    // update mastery (BKT-lite): per touched concept, compute correctness signal
    // correctness = 1 - (errors+warnings affecting concept) / max(1, totalIssuesForConcept)
    const concepts = parsed.concepts.filter((c) => VALID_TOPIC_SLUGS.has(c));
    if (concepts.length > 0) {
      const issuesByConcept = new Map<string, { bad: number; good: number }>();
      for (const slug of concepts) issuesByConcept.set(slug, { bad: 0, good: 0 });
      for (const issue of parsed.issues) {
        const s = issue.concept_slug;
        if (!s || !issuesByConcept.has(s)) continue;
        if (issue.is_correct_pattern) issuesByConcept.get(s)!.good += 1;
        else if (issue.severity !== "info") issuesByConcept.get(s)!.bad += 1;
      }

      const { data: existing } = await supabase
        .from("progress")
        .select("topic_slug, mastery, attempts")
        .in("topic_slug", concepts);

      const existingMap = new Map(existing?.map((r) => [r.topic_slug, r]) ?? []);
      const alpha = 0.35;

      const upserts = concepts.map((slug) => {
        const cur = existingMap.get(slug);
        const prior = cur?.mastery ?? 0.3;
        const { bad, good } = issuesByConcept.get(slug) ?? { bad: 0, good: 0 };
        // signal in [0..1]: bad pushes toward 0, good toward 1, neutral toward 0.7
        const signal = bad > 0 ? Math.max(0, 0.5 - 0.15 * bad) : good > 0 ? 0.95 : 0.7;
        const mastery = Math.min(1, Math.max(0, prior + alpha * (signal - prior)));
        return {
          user_id: userId,
          topic_slug: slug,
          mastery,
          attempts: (cur?.attempts ?? 0) + 1,
          last_reviewed: new Date().toISOString(),
        };
      });

      await supabase.from("progress").upsert(upserts, { onConflict: "user_id,topic_slug" });
    }

    return {
      ok: true as const,
      submissionId: sub.id,
      summary: parsed.summary,
      concepts,
      issues: parsed.issues,
    };
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
        .select("topic_slug, mastery, attempts, last_reviewed")
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

let _serviceClient: SupabaseClient | null = null;
function serviceClient(): SupabaseClient {
  if (!_serviceClient) {
    _serviceClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }
  return _serviceClient;
}

export const getPublicSubmission = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const supabase = serviceClient();
    const [{ data: sub }, { data: issues }] = await Promise.all([
      supabase.from("submissions").select("*").eq("id", data.id).maybeSingle(),
      supabase.from("review_issues").select("*").eq("submission_id", data.id),
    ]);
    return { submission: sub, issues: issues ?? [] };
  });

export const getTopicBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ slug: z.string().min(1).max(50) }).parse(input))
  .handler(async ({ data }) => {
    const supabase = serviceClient();
    const [{ data: topic }, { data: related }] = await Promise.all([
      supabase.from("topics").select("slug, name, category, description").eq("slug", data.slug).maybeSingle(),
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
    const limit = PLAN_QUOTAS[plan].roadmapsPerDay;
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
        model: "google/gemini-3-flash-preview",
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
    const content: string = aiJson?.choices?.[0]?.message?.content ?? "{}";
    let parsed;
    try {
      parsed = z
        .object({
          title: z.string().min(1).max(200),
          prompt: z.string().min(1).max(5000),
          starter_code: z.string().max(5000).optional().default(""),
        })
        .parse(JSON.parse(content));
    } catch {
      return { ok: false as const, error: "Malformed problem JSON." };
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
  .inputValidator((input: unknown) =>
    z.object({ environment: envInput }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { plan, status, pastDue } = await getUserPlan(userId, data.environment);
    const quotas = PLAN_QUOTAS[plan];
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
      roadmapsLimit: quotas.roadmapsPerDay,
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
    const admin = serviceClient();

    const { data: isAdmin } = await admin.rpc("has_role", {
      p_user_id: userId,
      p_role: "admin",
    });
    if (!isAdmin) {
      return { ok: false as const, error: "Forbidden", users: [], totals: {} };
    }

    const now = new Date();
    const mk = monthKey(now);

    const [profilesRes, subsRes, usageRes] = await Promise.all([
      admin.from("profiles").select("id, display_name, created_at").order("created_at", { ascending: false }),
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
        subByUser.set(s.user_id, { status: s.status as string, end: s.current_period_end as string | null });
      }
    }

    const reviewCountByUser = new Map<string, number>();
    const roadmapCountByUser = new Map<string, number>();
    for (const u of usage) {
      if (u.kind === "review") reviewCountByUser.set(u.user_id, (reviewCountByUser.get(u.user_id) ?? 0) + (u.count as number));
      else if (u.kind === "roadmap") roadmapCountByUser.set(u.user_id, (roadmapCountByUser.get(u.user_id) ?? 0) + (u.count as number));
    }

    let totalReviews = 0;
    let totalPro = 0;
    const users = profiles.map((p) => {
      const s = subByUser.get(p.id);
      const endMs = s?.end ? new Date(s.end).getTime() : null;
      const inPeriod = endMs === null || endMs > now.getTime();
      const isPro =
        s &&
        (["active", "trialing", "past_due"].includes(s.status) && inPeriod) ||
        (s.status === "canceled" && endMs !== null && endMs > now.getTime());

      const reviews = reviewCountByUser.get(p.id) ?? 0;
      const roadmaps = roadmapCountByUser.get(p.id) ?? 0;
      totalReviews += reviews;
      if (isPro) totalPro++;

      return {
        id: p.id,
        display_name: p.display_name ?? "—",
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
    const admin = serviceClient();

    const { data: isAdmin } = await admin.rpc("has_role", {
      p_user_id: userId,
      p_role: "admin",
    });
    if (!isAdmin) return { ok: false as const, error: "Forbidden", users: [] };

    const [profilesRes, rolesRes] = await Promise.all([
      admin.from("profiles").select("id, display_name, created_at").order("created_at", { ascending: false }),
      admin.from("user_roles").select("user_id, role"),
    ]);

    const rolesByUser = new Map<string, string[]>();
    for (const r of rolesRes.data ?? []) {
      const existing = rolesByUser.get(r.user_id) ?? [];
      existing.push(r.role as string);
      rolesByUser.set(r.user_id, existing);
    }

    const users = (profilesRes.data ?? []).map((p) => ({
      id: p.id,
      display_name: p.display_name ?? "—",
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
    const admin = serviceClient();

    const { data: isAdmin } = await admin.rpc("has_role", {
      p_user_id: userId,
      p_role: "admin",
    });
    if (!isAdmin) return { ok: false as const, error: "Forbidden" };

    const { error } = await admin.from("user_roles").upsert(
      { user_id: data.targetUserId, role: "admin" },
      { onConflict: "user_id,role" },
    );
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
    const admin = serviceClient();

    const { data: isAdmin } = await admin.rpc("has_role", {
      p_user_id: userId,
      p_role: "admin",
    });
    if (!isAdmin) return { ok: false as const, error: "Forbidden" };

    const { error } = await admin
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
    const admin = serviceClient();

    const { data: isAdmin } = await admin.rpc("has_role", {
      p_user_id: userId,
      p_role: "admin",
    });
    if (!isAdmin) return { ok: false as const, error: "Forbidden", data: null };

    const [submissionsRes, issuesRes, progressRes, practiceRes] = await Promise.all([
      admin.from("submissions").select("id, user_id, language, code, summary, concepts, created_at").order("created_at", { ascending: false }),
      admin.from("review_issues").select("id, submission_id, user_id, line, severity, concept_slug, title, explanation, fix_hint"),
      admin.from("progress").select("user_id, topic_slug, mastery, attempts, last_reviewed"),
      admin.from("practice_problems").select("id, user_id, topic_slug, title, prompt, starter_code, language, created_at"),
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
