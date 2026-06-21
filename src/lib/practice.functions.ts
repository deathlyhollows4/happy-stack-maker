import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getUserPlan, consumeQuota, getPlanQuotas, dayKey } from "@/lib/entitlements.server";
import { envInput } from "./codewise.utils";
import { runJsonAiWorkflow } from "@/lib/ai-workflow.server";
import { LANGS } from "@/lib/review.constants";
import { getTopicBySlug, normalizeTopicSlug } from "@/lib/topics";

function practiceSystemPrompt() {
  return [
    "You generate small, focused CS practice problems for students.",
    "Difficulty: easy-medium, similar to LeetCode Easy or classic CS1-CS2 assignments.",
    'Return JSON: { "title": string, "prompt": string, "starter_code": string }.',
    "The prompt must include examples, constraints, expected behavior, and a short rubric.",
    "Aim the task at the student's misconception or weak concept.",
    "Starter code must include TODO comments but no full solution.",
    "No markdown fences around the JSON.",
  ].join(" ");
}

function practiceUserPrompt(topicSlug: string, language: string) {
  const topic = getTopicBySlug(topicSlug);
  return [
    `Topic: ${topic?.name ?? topicSlug}.`,
    topic?.description ? `Description: ${topic.description}` : "",
    topic?.mentalModel ? `Mental model: ${topic.mentalModel}` : "",
    topic?.commonMistakes?.length
      ? `Common mistakes to target: ${topic.commonMistakes.join("; ")}`
      : "",
    topic?.operations?.length
      ? `Relevant operations: ${topic.operations
          .map((op) => `${op.name} ${op.time} time, ${op.space} space`)
          .join("; ")}`
      : "",
    topic?.practiceLadder?.length
      ? `Practice ladder examples: ${topic.practiceLadder.join("; ")}`
      : "",
    `Language: ${language}.`,
    "Generate ONE practice problem aimed at strengthening this concept.",
  ]
    .filter(Boolean)
    .join("\n");
}

const PracticeResponseSchema = z.object({
  title: z.string().min(1).max(200),
  prompt: z.string().min(1).max(5000),
  starter_code: z.string().max(5000).optional().default(""),
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
    const planQuotas = await getPlanQuotas();
    const limit = planQuotas[plan].problemsPerDay;
    const proLimit = planQuotas.pro.problemsPerDay;
    const allowed = await consumeQuota(userId, "roadmap", limit, dayKey());
    if (!allowed) {
      return {
        ok: false as const,
        error:
          plan === "pro"
            ? `You've used all ${limit} practice problems today. Resets at UTC midnight.`
            : `Free plan limit reached (${limit} practice problems / day). Upgrade to Pro for ${proLimit}/day.`,
        upgradeRequired: plan === "free",
      };
    }

    let topicSlug = normalizeTopicSlug(data.topicSlug);
    if (!topicSlug) {
      const { data: weakest } = await supabase
        .from("progress")
        .select("topic_slug, mastery")
        .order("mastery", { ascending: true })
        .limit(1);
      topicSlug = normalizeTopicSlug(weakest?.[0]?.topic_slug) ?? "arrays";
    }

    const workflow = await runJsonAiWorkflow({
      apiKey,
      flowName: "generatePractice",
      systemPrompt: practiceSystemPrompt(),
      userPrompt: practiceUserPrompt(topicSlug, data.language),
      schema: PracticeResponseSchema,
      malformedError: "AI returned an unexpected response. Please try again.",
    });

    if (!workflow.ok) {
      return {
        ok: false as const,
        error: workflow.error,
      };
    }
    const parsed = workflow.data;

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
