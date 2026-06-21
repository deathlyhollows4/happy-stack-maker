import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getUserPlan, consumeQuota, getPlanQuotas, dayKey } from "@/lib/entitlements.server";
import { envInput } from "./codewise.utils";
import { runJsonAiWorkflow } from "@/lib/ai-workflow.server";
import { LANGS } from "@/lib/review.constants";
import { getTopicBySlug, normalizeTopicSlug } from "@/lib/topics";
import {
  mapProgressRowsForPracticePlanner,
  planPracticeSession,
  type PracticePlannerResult,
} from "@/lib/practice-planner.server";

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

function practiceUserPrompt(
  topicSlug: string | null,
  language: string,
  practicePlan: PracticePlannerResult,
) {
  const topic = getTopicBySlug(topicSlug);
  return [
    `Curriculum node: ${practicePlan.node.title}.`,
    `Curriculum objective: ${practicePlan.node.objective}`,
    `Mastery band: ${practicePlan.masteryBand.id} (${practicePlan.masteryBand.label}).`,
    `Generation rule: ${practicePlan.masteryBand.generationRule}`,
    practicePlan.node.concepts.length ? `Concepts: ${practicePlan.node.concepts.join("; ")}` : "",
    practicePlan.node.practicePatterns.length
      ? `Practice patterns: ${practicePlan.node.practicePatterns.join("; ")}`
      : "",
    practicePlan.preview
      ? `Requested target preview: ${practicePlan.preview.node.title}. Teach the selected prerequisite first.`
      : "",
    `Topic: ${topic?.name ?? topicSlug ?? practicePlan.node.title}.`,
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

    const requestedTopicSlug = normalizeTopicSlug(data.topicSlug);
    const { data: progressRows } = await supabase
      .from("progress")
      .select("topic_slug, mastery, attempts, next_review_date, last_reviewed, retrievability");
    const practicePlan = planPracticeSession({
      topicSlug: requestedTopicSlug,
      progress: mapProgressRowsForPracticePlanner(progressRows ?? []),
    });
    const topicSlug = practicePlan.topicSlug ?? practicePlan.requestedTopicSlug;

    const workflow = await runJsonAiWorkflow({
      apiKey,
      flowName: "generatePractice",
      systemPrompt: practiceSystemPrompt(),
      userPrompt: practiceUserPrompt(topicSlug, data.language, practicePlan),
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
        curriculum_node_id: practicePlan.node.id,
        mastery_band: practicePlan.masteryBand.id,
        objective: practicePlan.node.objective,
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
