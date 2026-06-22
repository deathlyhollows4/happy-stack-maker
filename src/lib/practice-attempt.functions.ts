import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getUserPlan, consumeQuota, getPlanQuotas, dayKey } from "@/lib/entitlements.server";
import type { PaymentsEnv } from "@/lib/payments.server";
import { envInput } from "@/lib/codewise.utils";
import {
  buildConservativePracticeAttemptScore,
  summarizePracticeTestResults,
} from "@/lib/practice-attempt-scoring";
import {
  buildPracticeExecutionFailure,
  normalizePracticeExecutionResult,
} from "@/lib/practice-test-execution";
import { normalizePracticeProblemTestCases } from "@/lib/practice-test-harness";
import { buildPracticeTestWrapper, type PracticeTestWrapper } from "@/lib/practice-test-wrappers";
import {
  PracticeProblemFunctionSignatureSchema,
  PracticeProblemLanguageSchema,
  PracticeProblemTestCaseSchema,
  type PracticeProblemLanguage,
  type PracticeProblemTestCase,
} from "@/lib/practice-problem-contract";
import {
  PracticeReviewQualityInputSchema,
  buildPracticeAttemptSubmittedEvent,
  buildPracticeCompletionEvent,
  buildPracticeHiddenTestCheckEvent,
  buildPracticeReviewQualityEvent,
  buildPracticeReviewQualitySignal,
  type PracticeAttemptEventInput,
} from "@/lib/practice-event-model";
import { insertPracticeEvents } from "@/lib/practice-event-log.server";

const PISTON: Record<
  PracticeProblemLanguage,
  { language: string; version: string; filename: string }
> = {
  python: { language: "python", version: "3.10.0", filename: "main.py" },
  javascript: { language: "javascript", version: "18.15.0", filename: "main.js" },
  java: { language: "java", version: "15.0.2", filename: "Main.java" },
  cpp: { language: "c++", version: "10.2.0", filename: "main.cpp" },
  go: { language: "go", version: "1.16.2", filename: "main.go" },
};

const VisibleStoredTestsSchema = z
  .array(PracticeProblemTestCaseSchema.extend({ visibility: z.literal("visible") }))
  .min(1)
  .max(6);

const HiddenStoredTestsSchema = z
  .array(PracticeProblemTestCaseSchema.extend({ visibility: z.literal("hidden") }))
  .max(8);

const SubmitPracticeAttemptInputSchema = z
  .object({
    practiceProblemId: z.string().uuid(),
    code: z.string().min(1).max(20_000),
    language: PracticeProblemLanguageSchema,
    hintCount: z.number().int().min(0).max(5).default(0),
    startedAt: z.string().datetime().optional(),
    reviewQuality: PracticeReviewQualityInputSchema.optional(),
    environment: envInput as z.ZodType<PaymentsEnv>,
  })
  .strict();

function getCallableName(functionSignature: unknown, language: PracticeProblemLanguage) {
  const signature = PracticeProblemFunctionSignatureSchema.parse(functionSignature);
  return (
    signature.languageSignatures.find((item) => item.language === language)?.callableName ??
    signature.functionName
  );
}

async function executePracticeTests(input: {
  code: string;
  language: PracticeProblemLanguage;
  functionName: string;
  tests: PracticeProblemTestCase[];
}) {
  const runtime = PISTON[input.language];
  let wrapper: PracticeTestWrapper;
  try {
    wrapper = buildPracticeTestWrapper({
      language: input.language,
      functionName: input.functionName,
      userCode: input.code,
      testCases: normalizePracticeProblemTestCases(input.tests),
    });
  } catch (e) {
    console.error("submitPracticeAttempt test wrapper failed:", e);
    return {
      ok: true as const,
      execution: buildPracticeExecutionFailure({
        status: "unsupported_signature",
        total: input.tests.length,
        error: "This function signature is not supported by the test runner yet.",
      }),
    };
  }

  const res = await fetch("https://emkc.org/api/v2/piston/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language: runtime.language,
      version: runtime.version,
      files: [{ name: wrapper.filename || runtime.filename, content: wrapper.code }],
      stdin: "",
      run_timeout: 5000,
      compile_timeout: 10000,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Piston practice attempt error:", res.status, text);
    return {
      ok: false as const,
      error: "Code execution service temporarily unavailable. Try again.",
    };
  }

  const json = (await res.json()) as {
    run?: {
      stdout?: unknown;
      stderr?: unknown;
      code?: unknown;
      signal?: unknown;
    };
    compile?: {
      stderr?: unknown;
    };
  };
  const run = json.run ?? {};
  const compile = json.compile ?? {};
  return {
    ok: true as const,
    execution: normalizePracticeExecutionResult({
      stdout: typeof run.stdout === "string" ? run.stdout : "",
      stderr: typeof run.stderr === "string" ? run.stderr : "",
      exitCode: typeof run.code === "number" ? run.code : 0,
      runSignal: typeof run.signal === "string" ? run.signal : null,
      compileStderr: typeof compile.stderr === "string" ? compile.stderr : "",
    }),
  };
}

export const submitPracticeAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SubmitPracticeAttemptInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { plan } = await getUserPlan(userId, data.environment);
    const limit = (await getPlanQuotas())[plan].codeRunsPerDay;
    const allowed = await consumeQuota(userId, "code_run", limit, dayKey());
    if (!allowed) {
      return {
        ok: false as const,
        error: `Daily code-run limit reached (${limit}/day). Resets at UTC midnight.`,
      };
    }

    const { data: problem, error: problemError } = await supabase
      .from("practice_problems")
      .select("id, topic_slug, curriculum_node_id, mastery_band, function_signature, visible_tests")
      .eq("id", data.practiceProblemId)
      .single();
    if (problemError || !problem) {
      console.error("submitPracticeAttempt problem lookup failed:", problemError);
      return { ok: false as const, error: "Practice problem not found." };
    }

    const { data: hiddenRow, error: hiddenError } = await supabaseAdmin
      .from("practice_problem_hidden_tests")
      .select("hidden_tests")
      .eq("practice_problem_id", data.practiceProblemId)
      .eq("user_id", userId)
      .maybeSingle();
    if (hiddenError) {
      console.error("submitPracticeAttempt hidden test lookup failed:", hiddenError);
      return { ok: false as const, error: "Could not prepare hidden checks for this problem." };
    }

    let visibleTests: PracticeProblemTestCase[];
    let hiddenTests: PracticeProblemTestCase[];
    let functionName: string;
    try {
      visibleTests = VisibleStoredTestsSchema.parse(problem.visible_tests);
      hiddenTests = HiddenStoredTestsSchema.parse(hiddenRow?.hidden_tests ?? []);
      functionName = getCallableName(problem.function_signature, data.language);
    } catch (e) {
      console.error("submitPracticeAttempt validation failed:", e);
      return { ok: false as const, error: "Could not prepare tests for this problem." };
    }

    const execution = await executePracticeTests({
      code: data.code,
      language: data.language,
      functionName,
      tests: [...visibleTests, ...hiddenTests],
    });
    if (!execution.ok) return execution;

    const visibleSummary = summarizePracticeTestResults(
      execution.execution.testResults,
      "visible",
      visibleTests.length,
    );
    const hiddenSummary = summarizePracticeTestResults(
      execution.execution.testResults,
      "hidden",
      hiddenTests.length,
    );
    const score = buildConservativePracticeAttemptScore({
      visible: visibleSummary,
      hidden: hiddenSummary,
      hasRunnableResults: Boolean(execution.execution.testResults),
    });

    const completedAt = new Date();
    const now = completedAt.toISOString();
    const speedSeconds = data.startedAt
      ? Math.max(0, Math.round((completedAt.getTime() - Date.parse(data.startedAt)) / 1000))
      : null;
    const reviewQuality = buildPracticeReviewQualitySignal(data.reviewQuality ?? null);
    const { data: attempt, error: attemptError } = await supabase
      .from("practice_attempts")
      .insert({
        user_id: userId,
        practice_problem_id: data.practiceProblemId,
        language: data.language,
        code: data.code,
        status: score.status,
        visible_tests_passed: visibleSummary.passed,
        visible_tests_total: visibleSummary.total,
        hidden_tests_passed: hiddenSummary.passed,
        hidden_tests_total: hiddenSummary.total,
        correctness_score: score.correctnessScore,
        hint_count: data.hintCount,
        review_quality_score: reviewQuality.score,
        speed_seconds: speedSeconds,
        started_at: data.startedAt ?? now,
        completed_at: now,
      })
      .select("id")
      .single();
    if (attemptError || !attempt) {
      console.error("submitPracticeAttempt insert failed:", attemptError);
      return { ok: false as const, error: "Could not save this attempt. Try again." };
    }

    const attemptEventInput: PracticeAttemptEventInput = {
      practiceProblemId: data.practiceProblemId,
      practiceAttemptId: attempt.id,
      topicSlug: problem.topic_slug,
      curriculumNodeId: problem.curriculum_node_id,
      masteryBand: problem.mastery_band,
      language: data.language,
      hintCount: data.hintCount,
      visibleSummary,
      hiddenSummary,
      status: score.status,
      correctnessScore: score.correctnessScore,
      executionStatus: execution.execution.testSummary.status,
      speedSeconds,
      reviewQualityScore: reviewQuality.score,
    };
    const analyticsEvents = [
      buildPracticeHiddenTestCheckEvent(attemptEventInput),
      buildPracticeAttemptSubmittedEvent(attemptEventInput),
      buildPracticeReviewQualityEvent({
        attempt: attemptEventInput,
        reviewQuality,
      }),
    ];
    if (score.status === "completed") {
      analyticsEvents.push(buildPracticeCompletionEvent(attemptEventInput));
    }

    await insertPracticeEvents({
      supabase,
      userId,
      events: analyticsEvents,
      logContext: "submitPracticeAttempt",
    });

    return {
      ok: true as const,
      attemptId: attempt.id,
      status: score.status,
      correctnessScore: score.correctnessScore,
      visibleSummary,
      hiddenSummary,
      executionStatus: execution.execution.testSummary.status,
      reviewQualityScore: reviewQuality.score,
      speedSeconds,
    };
  });
