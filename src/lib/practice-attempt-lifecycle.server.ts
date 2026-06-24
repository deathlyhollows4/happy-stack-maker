import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  buildConservativePracticeAttemptScore,
  summarizePracticeTestResults,
} from "@/lib/practice-attempt-scoring";
import { updatePracticeMasteryProgress } from "@/lib/practice-mastery-progress.server";
import {
  buildPracticeExecutionFailure,
  normalizePracticeExecutionResult,
  type PracticeTestRunResult,
} from "@/lib/practice-test-execution";
import { normalizePracticeProblemTestCases } from "@/lib/practice-test-harness";
import { buildPracticeTestWrapper, type PracticeTestWrapper } from "@/lib/practice-test-wrappers";
import {
  PracticeProblemFunctionSignatureSchema,
  PracticeProblemTestCaseSchema,
  type PracticeProblemLanguage,
  type PracticeProblemTestCase,
} from "@/lib/practice-problem-contract";
import {
  buildPracticeAttemptSubmittedEvent,
  buildPracticeCompletionEvent,
  buildPracticeHiddenTestCheckEvent,
  buildPracticeReviewQualityEvent,
  buildPracticeReviewQualitySignal,
  type PracticeAttemptEventInput,
  type PracticeReviewQualityInput,
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

type PracticeSupabase = SupabaseClient<Database>;

export interface PracticeAttemptLifecycleInput {
  supabase: PracticeSupabase;
  hiddenTestClient?: PracticeSupabase;
  userId: string;
  practiceProblemId: string;
  code: string;
  language: PracticeProblemLanguage;
  hintCount: number;
  startedAt?: string;
  reviewQuality?: PracticeReviewQualityInput;
  now?: Date;
  executeTests?: typeof executePracticeTests;
  insertEvents?: typeof insertPracticeEvents;
  updateMasteryProgress?: typeof updatePracticeMasteryProgress;
}

export function getCallableName(functionSignature: unknown, language: PracticeProblemLanguage) {
  const signature = PracticeProblemFunctionSignatureSchema.parse(functionSignature);
  return (
    signature.languageSignatures.find((item) => item.language === language)?.callableName ??
    signature.functionName
  );
}

export async function executePracticeTests(input: {
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

function buildMasteryUpdateView(
  masteryProgress: Awaited<ReturnType<typeof updatePracticeMasteryProgress>>,
) {
  if (!masteryProgress.ok || masteryProgress.skipped) return null;

  return {
    topicSlug: masteryProgress.topicSlug,
    previousMastery: masteryProgress.result.signal.previousMastery,
    nextMastery: masteryProgress.result.signal.nextMastery,
    delta: masteryProgress.result.signal.delta,
    signalScore: masteryProgress.result.signal.signalScore,
    failedAttemptCount: masteryProgress.result.signal.failedAttemptCount,
    prerequisiteUpdates: masteryProgress.prerequisiteUpdates.map((update) => ({
      topicSlug: update.topicSlug,
      previousMastery: update.result.signal.previousMastery,
      nextMastery: update.result.signal.nextMastery,
      delta: update.result.signal.delta,
      signalScore: update.result.signal.signalScore,
      failedAttemptCount: update.result.signal.failedAttemptCount,
    })),
  };
}

function buildRunnableExecution(testResults: PracticeTestRunResult[]) {
  return {
    testResults,
    testSummary: {
      total: testResults.length,
      passed: testResults.filter((result) => result.passed).length,
      failed: testResults.filter((result) => !result.passed).length,
      status: "completed" as const,
    },
  };
}

export async function runPracticeAttemptLifecycle(input: PracticeAttemptLifecycleInput) {
  const hiddenTestClient = input.hiddenTestClient ?? (supabaseAdmin as PracticeSupabase);
  const executeTests = input.executeTests ?? executePracticeTests;
  const insertEvents = input.insertEvents ?? insertPracticeEvents;
  const updateMasteryProgress = input.updateMasteryProgress ?? updatePracticeMasteryProgress;

  const { data: problem, error: problemError } = await input.supabase
    .from("practice_problems")
    .select("id, topic_slug, curriculum_node_id, mastery_band, function_signature, visible_tests")
    .eq("id", input.practiceProblemId)
    .single();
  if (problemError || !problem) {
    console.error("submitPracticeAttempt problem lookup failed:", problemError);
    return { ok: false as const, error: "Practice problem not found." };
  }

  const { data: hiddenRow, error: hiddenError } = await hiddenTestClient
    .from("practice_problem_hidden_tests")
    .select("hidden_tests")
    .eq("practice_problem_id", input.practiceProblemId)
    .eq("user_id", input.userId)
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
    functionName = getCallableName(problem.function_signature, input.language);
  } catch (e) {
    console.error("submitPracticeAttempt validation failed:", e);
    return { ok: false as const, error: "Could not prepare tests for this problem." };
  }

  const execution = await executeTests({
    code: input.code,
    language: input.language,
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
  const { count: previousFailedAttemptCount, error: previousFailedAttemptCountError } =
    await input.supabase
      .from("practice_attempts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", input.userId)
      .eq("practice_problem_id", input.practiceProblemId)
      .eq("status", "failed");
  if (previousFailedAttemptCountError) {
    console.error(
      "submitPracticeAttempt failed attempt count failed:",
      previousFailedAttemptCountError,
    );
  }

  const completedAt = input.now ?? new Date();
  const now = completedAt.toISOString();
  const speedSeconds = input.startedAt
    ? Math.max(0, Math.round((completedAt.getTime() - Date.parse(input.startedAt)) / 1000))
    : null;
  const reviewQuality = buildPracticeReviewQualitySignal(input.reviewQuality ?? null);
  const { data: attempt, error: attemptError } = await input.supabase
    .from("practice_attempts")
    .insert({
      user_id: input.userId,
      practice_problem_id: input.practiceProblemId,
      language: input.language,
      code: input.code,
      status: score.status,
      visible_tests_passed: visibleSummary.passed,
      visible_tests_total: visibleSummary.total,
      hidden_tests_passed: hiddenSummary.passed,
      hidden_tests_total: hiddenSummary.total,
      correctness_score: score.correctnessScore,
      hint_count: input.hintCount,
      review_quality_score: reviewQuality.score,
      speed_seconds: speedSeconds,
      started_at: input.startedAt ?? now,
      completed_at: now,
    })
    .select("id")
    .single();
  if (attemptError || !attempt) {
    console.error("submitPracticeAttempt insert failed:", attemptError);
    return { ok: false as const, error: "Could not save this attempt. Try again." };
  }

  const attemptEventInput: PracticeAttemptEventInput = {
    practiceProblemId: input.practiceProblemId,
    practiceAttemptId: attempt.id,
    topicSlug: problem.topic_slug,
    curriculumNodeId: problem.curriculum_node_id,
    masteryBand: problem.mastery_band,
    language: input.language,
    hintCount: input.hintCount,
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

  await insertEvents({
    supabase: input.supabase,
    userId: input.userId,
    events: analyticsEvents,
    logContext: "submitPracticeAttempt",
  });

  const masteryProgress = await updateMasteryProgress({
    supabase: input.supabase,
    userId: input.userId,
    topicSlug: problem.topic_slug,
    curriculumNodeId: problem.curriculum_node_id,
    correctnessScore: score.correctnessScore,
    status: score.status,
    failedAttemptCount: (previousFailedAttemptCount ?? 0) + (score.status === "failed" ? 1 : 0),
    hintCount: input.hintCount,
    reviewQualityScore: reviewQuality.score,
    speedSeconds,
    masteryBand: problem.mastery_band,
    now: completedAt,
  });
  if (!masteryProgress.ok) {
    console.error("submitPracticeAttempt mastery update failed:", masteryProgress.error);
  } else if (masteryProgress.prerequisiteErrors.length > 0) {
    console.error(
      "submitPracticeAttempt prerequisite mastery updates failed:",
      masteryProgress.prerequisiteErrors,
    );
  }

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
    masteryUpdate: buildMasteryUpdateView(masteryProgress),
  };
}

export function buildPracticeAttemptLifecycleTestExecution(testResults: PracticeTestRunResult[]) {
  return {
    ok: true as const,
    execution: buildRunnableExecution(testResults),
  };
}
