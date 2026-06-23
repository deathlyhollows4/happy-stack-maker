import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/integrations/supabase/types";

type PracticeAttemptRow = Pick<
  Database["public"]["Tables"]["practice_attempts"]["Row"],
  | "id"
  | "practice_problem_id"
  | "status"
  | "visible_tests_passed"
  | "visible_tests_total"
  | "hidden_tests_total"
  | "correctness_score"
  | "hint_count"
  | "review_quality_score"
  | "speed_seconds"
  | "completed_at"
>;

type PracticeProblemRow = Pick<
  Database["public"]["Tables"]["practice_problems"]["Row"],
  "id" | "title" | "topic_slug" | "curriculum_node_id" | "mastery_band"
>;

type ProgressRow = Pick<
  Database["public"]["Tables"]["progress"]["Row"],
  "topic_slug" | "mastery" | "attempts" | "last_reviewed" | "next_review_date" | "retrievability"
>;

export interface PracticeReviewContextInput {
  practiceProblemId: string;
  practiceAttemptId: string;
}

export interface PracticeReviewSubmissionMetadata {
  source: "practice";
  practiceProblemTitle: string;
  topicSlug: string | null;
  curriculumNodeId: string | null;
  masteryBand: string | null;
  attempt: {
    status: string;
    correctnessScore: number;
    reviewQualityScore: number | null;
    hintCount: number;
    speedSeconds: number | null;
    completedAt: string | null;
    visibleSummary: {
      passed: number;
      total: number;
      failed: number;
    };
    hiddenChecksRun: boolean;
  };
  topicMastery: {
    topicSlug: string;
    mastery: number;
    attempts: number;
    lastReviewed: string | null;
    nextReviewDate: string | null;
    retrievability: number | null;
  } | null;
}

export type ResolvePracticeReviewContextResult =
  | {
      ok: true;
      practiceProblemId: string;
      practiceAttemptId: string;
      metadata: Json;
    }
  | {
      ok: false;
      error: string;
    };

function nonNegativeInteger(input: number | null | undefined) {
  if (!Number.isFinite(input)) return 0;
  return Math.max(0, Math.floor(input ?? 0));
}

function scoreOrZero(input: number | null | undefined) {
  if (!Number.isFinite(input)) return 0;
  return Math.min(1, Math.max(0, input ?? 0));
}

function nullableScore(input: number | null | undefined) {
  if (!Number.isFinite(input)) return null;
  return Math.min(1, Math.max(0, input ?? 0));
}

export function buildPracticeReviewSubmissionMetadata(input: {
  attempt: PracticeAttemptRow;
  problem: PracticeProblemRow;
  progress: ProgressRow | null;
}): PracticeReviewSubmissionMetadata {
  const visibleTotal = nonNegativeInteger(input.attempt.visible_tests_total);
  const visiblePassed = Math.min(
    nonNegativeInteger(input.attempt.visible_tests_passed),
    visibleTotal,
  );

  return {
    source: "practice",
    practiceProblemTitle: input.problem.title,
    topicSlug: input.problem.topic_slug,
    curriculumNodeId: input.problem.curriculum_node_id,
    masteryBand: input.problem.mastery_band,
    attempt: {
      status: input.attempt.status,
      correctnessScore: scoreOrZero(input.attempt.correctness_score),
      reviewQualityScore: nullableScore(input.attempt.review_quality_score),
      hintCount: nonNegativeInteger(input.attempt.hint_count),
      speedSeconds: Number.isFinite(input.attempt.speed_seconds)
        ? nonNegativeInteger(input.attempt.speed_seconds)
        : null,
      completedAt: input.attempt.completed_at,
      visibleSummary: {
        passed: visiblePassed,
        total: visibleTotal,
        failed: Math.max(0, visibleTotal - visiblePassed),
      },
      hiddenChecksRun: nonNegativeInteger(input.attempt.hidden_tests_total) > 0,
    },
    topicMastery: input.progress
      ? {
          topicSlug: input.progress.topic_slug,
          mastery: input.progress.mastery,
          attempts: input.progress.attempts,
          lastReviewed: input.progress.last_reviewed,
          nextReviewDate: input.progress.next_review_date,
          retrievability: input.progress.retrievability,
        }
      : null,
  };
}

export async function resolvePracticeReviewSubmissionContext(input: {
  supabase: SupabaseClient<Database>;
  userId: string;
  practiceContext?: PracticeReviewContextInput | null;
}): Promise<ResolvePracticeReviewContextResult | null> {
  if (!input.practiceContext) return null;

  const { data: attempt, error: attemptError } = await input.supabase
    .from("practice_attempts")
    .select(
      [
        "id",
        "practice_problem_id",
        "status",
        "visible_tests_passed",
        "visible_tests_total",
        "hidden_tests_total",
        "correctness_score",
        "hint_count",
        "review_quality_score",
        "speed_seconds",
        "completed_at",
      ].join(", "),
    )
    .eq("id", input.practiceContext.practiceAttemptId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (attemptError) {
    console.error("resolvePracticeReviewSubmissionContext attempt lookup failed:", attemptError);
    return { ok: false, error: "Could not load the practice attempt for this review." };
  }
  if (!attempt || attempt.practice_problem_id !== input.practiceContext.practiceProblemId) {
    return { ok: false, error: "Practice attempt not found for this review." };
  }

  const { data: problem, error: problemError } = await input.supabase
    .from("practice_problems")
    .select("id, title, topic_slug, curriculum_node_id, mastery_band")
    .eq("id", input.practiceContext.practiceProblemId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (problemError) {
    console.error("resolvePracticeReviewSubmissionContext problem lookup failed:", problemError);
    return { ok: false, error: "Could not load the practice problem for this review." };
  }
  if (!problem) {
    return { ok: false, error: "Practice problem not found for this review." };
  }

  let progress: ProgressRow | null = null;
  if (problem.topic_slug) {
    const { data: progressRow, error: progressError } = await input.supabase
      .from("progress")
      .select("topic_slug, mastery, attempts, last_reviewed, next_review_date, retrievability")
      .eq("user_id", input.userId)
      .eq("topic_slug", problem.topic_slug)
      .maybeSingle();
    if (progressError) {
      console.error(
        "resolvePracticeReviewSubmissionContext progress lookup failed:",
        progressError,
      );
    } else {
      progress = progressRow;
    }
  }

  return {
    ok: true,
    practiceProblemId: input.practiceContext.practiceProblemId,
    practiceAttemptId: input.practiceContext.practiceAttemptId,
    metadata: buildPracticeReviewSubmissionMetadata({
      attempt,
      problem,
      progress,
    }) as unknown as Json,
  };
}
