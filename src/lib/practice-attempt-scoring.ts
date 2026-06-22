import type { PracticeTestRunResult } from "@/lib/practice-test-execution";

export const HIDDEN_TEST_SCORING_WEIGHT = 0.25;
export const VISIBLE_TEST_SCORING_WEIGHT = 1 - HIDDEN_TEST_SCORING_WEIGHT;
export const PRACTICE_COMPLETION_SCORE_THRESHOLD = 0.875;

export interface PracticeAttemptTestSummary {
  total: number;
  passed: number;
  failed: number;
}

export interface BuildConservativePracticeAttemptScoreInput {
  visible: PracticeAttemptTestSummary;
  hidden: PracticeAttemptTestSummary;
  hasRunnableResults: boolean;
}

export interface ConservativePracticeAttemptScore {
  status: "completed" | "failed";
  correctnessScore: number;
  visibleScore: number;
  hiddenScore: number;
  hiddenContribution: number;
}

function roundScore(score: number) {
  return Math.round(score * 10_000) / 10_000;
}

export function summarizePracticeTestResults(
  results: PracticeTestRunResult[] | undefined,
  visibility: "visible" | "hidden",
  fallbackTotal = 0,
): PracticeAttemptTestSummary {
  const scopedResults = (results ?? []).filter((result) => result.visibility === visibility);
  const total = scopedResults.length || fallbackTotal;
  const passed = scopedResults.filter((result) => result.passed).length;

  return {
    total,
    passed,
    failed: Math.max(total - passed, 0),
  };
}

export function buildConservativePracticeAttemptScore(
  input: BuildConservativePracticeAttemptScoreInput,
): ConservativePracticeAttemptScore {
  if (!input.hasRunnableResults || input.visible.total === 0) {
    return {
      status: "failed",
      correctnessScore: 0,
      visibleScore: 0,
      hiddenScore: 0,
      hiddenContribution: 0,
    };
  }

  const hasHiddenTests = input.hidden.total > 0;
  const visibleWeight = hasHiddenTests ? VISIBLE_TEST_SCORING_WEIGHT : 1;
  const hiddenWeight = hasHiddenTests ? HIDDEN_TEST_SCORING_WEIGHT : 0;
  const visibleScore = input.visible.passed / input.visible.total;
  const hiddenScore = hasHiddenTests ? input.hidden.passed / input.hidden.total : 0;
  const hiddenContribution = hiddenScore * hiddenWeight;
  const correctnessScore = visibleScore * visibleWeight + hiddenContribution;
  const meetsCompletionThreshold =
    visibleScore === 1 && correctnessScore >= PRACTICE_COMPLETION_SCORE_THRESHOLD;

  return {
    status: meetsCompletionThreshold ? "completed" : "failed",
    correctnessScore: roundScore(correctnessScore),
    visibleScore: roundScore(visibleScore),
    hiddenScore: roundScore(hiddenScore),
    hiddenContribution: roundScore(hiddenContribution),
  };
}
