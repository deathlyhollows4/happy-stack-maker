import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  getUserPlan,
  consumeQuota,
  getPlanQuotas,
  monthKey,
} from "@/lib/entitlements.server";
import {
  envInput,
  extractJson,
  computeFSRSGrade,
  updateFSRS,
} from "./codewise.utils";
import {
  LANGS,
  ReviewIssueSchema,
  ReviewResponseSchema,
  VALID_TOPIC_SLUGS,
  SYSTEM_PROMPT,
} from "@/lib/review.constants";

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
          // Exponential backoff with jitter: 1s, 2s (+ random up to 500ms)
          const baseDelay = Math.pow(2, attempt - 1) * 1000;
          const jitter = Math.random() * 500;
          await new Promise(resolve => setTimeout(resolve, baseDelay + jitter));

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

    const subId = sub.id;

    // persist issues
    if (parsed.issues.length > 0) {
      const rows = parsed.issues.map((i) => ({
        submission_id: subId,
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
      if (issuesErr) {
        // Clean up orphaned submission
        await supabase.from("submissions").delete().eq("id", subId);
        console.error("review_issues insert failed, cleaned up submission:", issuesErr);
        return { ok: false as const, error: "Something went wrong. Please try again." };
      }
    }

    // FSRS: auto-grade from review issues per concept
    const concepts = parsed.concepts.filter((c) => VALID_TOPIC_SLUGS.has(c));
    if (concepts.length > 0) {
      await Promise.all(
        concepts.map(async (slug) => {
          // Filter issues matching this concept (null concept_slug = "general" issue counts toward all)
          const conceptIssues = parsed.issues.filter(
            (i) => i.concept_slug === slug || i.concept_slug === null
          );
          const grade = computeFSRSGrade(conceptIssues);
          try {
            await updateFSRS(userId, slug, grade);
          } catch (fsrsErr) {
            console.error("FSRS update failed for slug", slug, ":", fsrsErr);
          }
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
