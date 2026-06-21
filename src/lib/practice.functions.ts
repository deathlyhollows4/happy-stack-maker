import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getUserPlan, consumeQuota, getPlanQuotas, dayKey } from "@/lib/entitlements.server";
import { envInput } from "./codewise.utils";
import { runJsonAiWorkflow } from "@/lib/ai-workflow.server";
import { LANGS } from "@/lib/review.constants";
import { getTopicBySlug } from "@/lib/topics";
import type { PracticePlannerResult } from "@/lib/practice-planner.server";
import { buildPracticeGenerationPlan } from "@/lib/practice-generation-plan.server";
import { PRACTICE_PROBLEM_CONTRACT_VERSION } from "@/lib/practice-problem-contract";
import type { PracticeProblemLanguage } from "@/lib/practice-problem-contract";
import {
  buildStructuredPracticeHiddenTestsInsert,
  buildStructuredPracticeProblemInsert,
  buildStructuredPracticeProblemSchema,
} from "@/lib/practice-structured-problem.server";

function practiceSystemPrompt() {
  return [
    "You generate one beginner DSA practice problem as strict JSON only.",
    `Return exactly one JSON object with contractVersion ${PRACTICE_PROBLEM_CONTRACT_VERSION}.`,
    "Do not include markdown, prose outside JSON, or extra keys.",
    "Required fields: contractVersion, curriculumNodeId, title, topicTags, prerequisiteTags, masteryBand, objective, statement, examples, constraints, functionSignature, visibleTests, hiddenTests, hiddenTestThemes, hintLadder, successCriteria.",
    "The statement must be story-free, direct, and focused on the function behavior.",
    "Generate function signatures and starterCode for python, javascript, java, cpp, and go.",
    "Visible and hidden tests must use JSON values for arguments and expected.",
    "Every hiddenTestThemes item must match at least one hidden test theme.",
    "Starter code must include TODO comments but no full solution.",
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
    `Required contractVersion: ${PRACTICE_PROBLEM_CONTRACT_VERSION}.`,
    `Required curriculumNodeId: ${practicePlan.node.id}.`,
    `Required objective: ${practicePlan.node.objective}`,
    `Required masteryBand: ${practicePlan.masteryBand.id}.`,
    "Generate one structured problem for the selected curriculum node.",
  ]
    .filter(Boolean)
    .join("\n");
}

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

    const { data: progressRows } = await supabase
      .from("progress")
      .select("topic_slug, mastery, attempts, next_review_date, last_reviewed, retrievability");
    const generationPlan = buildPracticeGenerationPlan({
      topicSlug: data.topicSlug,
      progressRows: progressRows ?? [],
    });

    const workflow = await runJsonAiWorkflow({
      apiKey,
      flowName: "generatePractice",
      systemPrompt: practiceSystemPrompt(),
      userPrompt: practiceUserPrompt(
        generationPlan.aiPromptTopicSlug,
        data.language,
        generationPlan.practicePlan,
      ),
      schema: buildStructuredPracticeProblemSchema(generationPlan),
      malformedError: "AI returned an unexpected response. Please try again.",
      maxAttempts: 1,
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
      .insert(
        buildStructuredPracticeProblemInsert({
          userId,
          language: data.language as PracticeProblemLanguage,
          generationPlan,
          problem: parsed,
        }),
      )
      .select("*")
      .single();
    if (error || !row) {
      console.error("generatePractice insert failed:", error);
      return { ok: false as const, error: "Something went wrong. Please try again." };
    }

    const { error: hiddenTestsError } = await supabase.from("practice_problem_hidden_tests").insert(
      buildStructuredPracticeHiddenTestsInsert({
        userId,
        practiceProblemId: row.id,
        problem: parsed,
      }),
    );
    if (hiddenTestsError) {
      console.error("generatePractice hidden tests insert failed:", hiddenTestsError);
      await supabase.from("practice_problems").delete().eq("id", row.id).eq("user_id", userId);
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
