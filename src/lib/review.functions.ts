import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getUserPlan, consumeQuota, getPlanQuotas, monthKey } from "@/lib/entitlements.server";
import { envInput, computeFSRSGrade, updateFSRS } from "./codewise.utils";
import { runJsonAiWorkflow } from "@/lib/ai-workflow.server";
import {
  LANGS,
  ReviewIssueSchema,
  ReviewResponseSchema,
  VALID_TOPIC_SLUGS,
  SYSTEM_PROMPT,
} from "@/lib/review.constants";
import {
  resolvePracticeReviewSubmissionContext,
  type PracticeReviewContextInput,
} from "@/lib/practice-review-context.server";

const PracticeReviewContextInputSchema = z
  .object({
    practiceProblemId: z.string().uuid(),
    practiceAttemptId: z.string().uuid(),
  })
  .strict() satisfies z.ZodType<PracticeReviewContextInput>;

export const reviewCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        code: z.string().min(1).max(20_000),
        language: z.enum(LANGS),
        practiceContext: PracticeReviewContextInputSchema.optional(),
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
    const planQuotas = await getPlanQuotas();
    const limit = planQuotas[plan].reviewsPerMonth;
    const proLimit = planQuotas.pro.reviewsPerMonth;
    const allowed = await consumeQuota(userId, "review", limit, monthKey());
    if (!allowed) {
      return {
        ok: false as const,
        error:
          plan === "pro"
            ? `You've used all ${limit} reviews this month. Quota resets on the 1st.`
            : `Free plan limit reached (${limit} reviews / month). Upgrade to Pro for ${proLimit}/month.`,
        upgradeRequired: plan === "free",
      };
    }

    const practiceContext = await resolvePracticeReviewSubmissionContext({
      supabase,
      userId,
      practiceContext: data.practiceContext ?? null,
    });
    if (practiceContext && !practiceContext.ok) {
      return { ok: false as const, error: practiceContext.error };
    }

    const userPrompt = `Language: ${data.language}\n\nStudent code:\n\`\`\`${data.language}\n${data.code}\n\`\`\`\n\nReview it.`;

    const workflow = await runJsonAiWorkflow({
      apiKey,
      flowName: "reviewCode",
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      schema: ReviewResponseSchema,
      malformedError: "AI returned an unexpected response. Please try again.",
    });

    if (!workflow.ok) {
      return {
        ok: false as const,
        error: workflow.error,
      };
    }
    const parsed = workflow.data;

    // persist submission
    const { data: sub, error: subErr } = await supabase
      .from("submissions")
      .insert({
        user_id: userId,
        language: data.language,
        code: data.code,
        summary: parsed.summary,
        concepts: parsed.concepts.filter((c) => VALID_TOPIC_SLUGS.has(c)),
        practice_problem_id: practiceContext?.practiceProblemId ?? null,
        practice_attempt_id: practiceContext?.practiceAttemptId ?? null,
        practice_metadata: practiceContext?.metadata ?? {},
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
            (i) => i.concept_slug === slug || i.concept_slug === null,
          );
          const grade = computeFSRSGrade(conceptIssues);
          try {
            await updateFSRS(userId, slug, grade);
          } catch (fsrsErr) {
            console.error("FSRS update failed for slug", slug, ":", fsrsErr);
          }
        }),
      );
    }

    return {
      ok: true as const,
      submissionId: sub.id,
      summary: parsed.summary,
      concepts,
      issues: parsed.issues,
      practiceContext:
        practiceContext && practiceContext.ok
          ? {
              practiceProblemId: practiceContext.practiceProblemId,
              practiceAttemptId: practiceContext.practiceAttemptId,
            }
          : null,
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
