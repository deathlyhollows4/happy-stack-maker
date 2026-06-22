import { z } from "zod";
import {
  PracticeProblemMasteryBandSchema,
  type PracticeProblemHint,
  type PracticeProblemLanguage,
  type PracticeProblemMasteryBand,
} from "@/lib/practice-problem-contract";
import type { PracticeProblemView } from "@/lib/practice-problem-view";
import type { PracticeExecutionStatus } from "@/lib/practice-test-execution";

export const PRACTICE_PROBLEM_GENERATED_EVENT = "practice_problem_generated";
export const PRACTICE_VISIBLE_TESTS_RUN_EVENT = "practice_visible_tests_run";
export const PRACTICE_HINT_REVEALED_EVENT = "practice_hint_revealed";
export const PRACTICE_HIDDEN_TESTS_CHECKED_EVENT = "practice_hidden_tests_checked";
export const PRACTICE_ATTEMPT_SUBMITTED_EVENT = "practice_attempt_submitted";
export const PRACTICE_PROBLEM_COMPLETED_EVENT = "practice_problem_completed";
export const PRACTICE_REVIEW_QUALITY_RECORDED_EVENT = "practice_review_quality_recorded";

export const PracticeEventTypeSchema = z.enum([
  PRACTICE_PROBLEM_GENERATED_EVENT,
  PRACTICE_VISIBLE_TESTS_RUN_EVENT,
  PRACTICE_HINT_REVEALED_EVENT,
  PRACTICE_HIDDEN_TESTS_CHECKED_EVENT,
  PRACTICE_ATTEMPT_SUBMITTED_EVENT,
  PRACTICE_PROBLEM_COMPLETED_EVENT,
  PRACTICE_REVIEW_QUALITY_RECORDED_EVENT,
]);

export const PracticeReviewQualityInputSchema = z
  .object({
    complexityExplanation: z.string().trim().max(1200).default(""),
    edgeCaseExplanation: z.string().trim().max(1200).default(""),
  })
  .strict();

export const RecordPracticeEventInputSchema = z
  .object({
    eventType: PracticeEventTypeSchema,
    practiceProblemId: z.string().uuid().nullable().optional(),
    practiceAttemptId: z.string().uuid().nullable().optional(),
    topicSlug: z.string().trim().min(1).max(120).nullable().optional(),
    curriculumNodeId: z.string().trim().min(1).max(120).nullable().optional(),
    masteryBand: PracticeProblemMasteryBandSchema.nullable().optional(),
    payload: z.record(z.unknown()).default({}),
  })
  .strict();

export type RecordPracticeEventInput = z.infer<typeof RecordPracticeEventInputSchema>;
export type PracticeReviewQualityInput = z.infer<typeof PracticeReviewQualityInputSchema>;

export interface PracticeHintRevealState {
  revealedHintOrders: number[];
  shouldRecord: boolean;
}

export interface PracticeEventTestSummary {
  total: number;
  passed: number;
  failed: number;
}

export interface PracticeReviewQualitySignal {
  complexityExplanation: string;
  edgeCaseExplanation: string;
  complexityExplained: boolean;
  edgeCasesExplained: boolean;
  score: number | null;
}

export interface PracticeAttemptEventInput {
  practiceProblemId: string;
  practiceAttemptId: string;
  topicSlug: string | null;
  curriculumNodeId: string | null;
  masteryBand: PracticeProblemMasteryBand | string | null | undefined;
  language: PracticeProblemLanguage;
  hintCount: number;
  visibleSummary: PracticeEventTestSummary;
  hiddenSummary: PracticeEventTestSummary;
  status: "completed" | "failed";
  correctnessScore: number;
  executionStatus: PracticeExecutionStatus;
  speedSeconds?: number | null;
  reviewQualityScore?: number | null;
}

const MIN_REVIEW_EXPLANATION_LENGTH = 12;

function roundScore(score: number) {
  return Math.round(score * 10_000) / 10_000;
}

function normalizeMasteryBand(masteryBand: PracticeProblemMasteryBand | string | null | undefined) {
  const parsed = PracticeProblemMasteryBandSchema.safeParse(masteryBand);
  return parsed.success ? parsed.data : null;
}

function serializeSummary(summary: PracticeEventTestSummary) {
  return {
    total: summary.total,
    passed: summary.passed,
    failed: summary.failed,
  };
}

export function markPracticeHintRevealed(
  currentOrders: readonly number[],
  order: number,
): PracticeHintRevealState {
  if (currentOrders.includes(order)) {
    return {
      revealedHintOrders: [...currentOrders],
      shouldRecord: false,
    };
  }

  return {
    revealedHintOrders: [...currentOrders, order].sort((a, b) => a - b),
    shouldRecord: true,
  };
}

export function buildPracticeReviewQualitySignal(
  input?: PracticeReviewQualityInput | null,
): PracticeReviewQualitySignal {
  const parsed = PracticeReviewQualityInputSchema.parse(input ?? {});
  const complexityExplanation = parsed.complexityExplanation.trim();
  const edgeCaseExplanation = parsed.edgeCaseExplanation.trim();
  const complexityExplained = complexityExplanation.length >= MIN_REVIEW_EXPLANATION_LENGTH;
  const edgeCasesExplained = edgeCaseExplanation.length >= MIN_REVIEW_EXPLANATION_LENGTH;
  const hasReviewInput = Boolean(complexityExplanation || edgeCaseExplanation);

  return {
    complexityExplanation,
    edgeCaseExplanation,
    complexityExplained,
    edgeCasesExplained,
    score: hasReviewInput
      ? roundScore((complexityExplained ? 0.5 : 0) + (edgeCasesExplained ? 0.5 : 0))
      : null,
  };
}

export function buildPracticeProblemGeneratedEvent(input: {
  practiceProblemId: string;
  topicSlug: string | null;
  curriculumNodeId: string | null;
  masteryBand: PracticeProblemMasteryBand | string | null | undefined;
  language: PracticeProblemLanguage;
  requestedTopicSlug: string | null;
  plannerSource: string;
  visibleTestCount: number;
  hiddenTestCount: number;
  hintCount: number;
  hasBridgePreview: boolean;
}): RecordPracticeEventInput {
  return {
    eventType: PRACTICE_PROBLEM_GENERATED_EVENT,
    practiceProblemId: input.practiceProblemId,
    topicSlug: input.topicSlug,
    curriculumNodeId: input.curriculumNodeId,
    masteryBand: normalizeMasteryBand(input.masteryBand),
    payload: {
      language: input.language,
      requestedTopicSlug: input.requestedTopicSlug,
      plannerSource: input.plannerSource,
      visibleTestCount: input.visibleTestCount,
      hiddenTestCount: input.hiddenTestCount,
      hintCount: input.hintCount,
      hasBridgePreview: input.hasBridgePreview,
    },
  };
}

export function buildPracticeVisibleTestRunEvent(input: {
  practiceProblemId: string;
  topicSlug: string | null;
  view: PracticeProblemView;
  language: PracticeProblemLanguage;
  testSummary?: (PracticeEventTestSummary & { status: PracticeExecutionStatus }) | null;
  resultCount?: number | null;
  durationMs?: number | null;
}): RecordPracticeEventInput {
  return {
    eventType: PRACTICE_VISIBLE_TESTS_RUN_EVENT,
    practiceProblemId: input.practiceProblemId,
    topicSlug: input.topicSlug,
    curriculumNodeId: input.view.curriculumNodeId,
    masteryBand: input.view.masteryBand,
    payload: {
      language: input.language,
      visibleTestCount: input.view.visibleTests.length,
      resultCount: input.resultCount ?? null,
      durationMs: input.durationMs ?? null,
      executionStatus: input.testSummary?.status ?? null,
      total: input.testSummary?.total ?? null,
      passed: input.testSummary?.passed ?? null,
      failed: input.testSummary?.failed ?? null,
    },
  };
}

export function buildPracticeHintUsageEvent(input: {
  practiceProblemId: string;
  topicSlug: string | null;
  view: PracticeProblemView;
  hint: PracticeProblemHint;
  revealedHintOrders: readonly number[];
}): RecordPracticeEventInput {
  const revealState = markPracticeHintRevealed(input.revealedHintOrders, input.hint.order);

  return {
    eventType: PRACTICE_HINT_REVEALED_EVENT,
    practiceProblemId: input.practiceProblemId,
    topicSlug: input.topicSlug,
    curriculumNodeId: input.view.curriculumNodeId,
    masteryBand: input.view.masteryBand,
    payload: {
      hintOrder: input.hint.order,
      hintTitle: input.hint.title,
      revealedHintCount: revealState.revealedHintOrders.length,
      totalHintCount: input.view.hintLadder.length,
    },
  };
}

export function buildPracticeHiddenTestCheckEvent(
  input: PracticeAttemptEventInput,
): RecordPracticeEventInput {
  return {
    eventType: PRACTICE_HIDDEN_TESTS_CHECKED_EVENT,
    practiceProblemId: input.practiceProblemId,
    practiceAttemptId: input.practiceAttemptId,
    topicSlug: input.topicSlug,
    curriculumNodeId: input.curriculumNodeId,
    masteryBand: normalizeMasteryBand(input.masteryBand),
    payload: {
      language: input.language,
      executionStatus: input.executionStatus,
      hiddenSummary: serializeSummary(input.hiddenSummary),
      visibleSummary: serializeSummary(input.visibleSummary),
      correctnessScore: input.correctnessScore,
    },
  };
}

export function buildPracticeAttemptSubmittedEvent(
  input: PracticeAttemptEventInput,
): RecordPracticeEventInput {
  return {
    eventType: PRACTICE_ATTEMPT_SUBMITTED_EVENT,
    practiceProblemId: input.practiceProblemId,
    practiceAttemptId: input.practiceAttemptId,
    topicSlug: input.topicSlug,
    curriculumNodeId: input.curriculumNodeId,
    masteryBand: normalizeMasteryBand(input.masteryBand),
    payload: {
      language: input.language,
      status: input.status,
      hintCount: input.hintCount,
      speedSeconds: input.speedSeconds ?? null,
      correctnessScore: input.correctnessScore,
      visibleSummary: serializeSummary(input.visibleSummary),
      hiddenSummary: serializeSummary(input.hiddenSummary),
      reviewQualityScore: input.reviewQualityScore ?? null,
    },
  };
}

export function buildPracticeCompletionEvent(
  input: PracticeAttemptEventInput,
): RecordPracticeEventInput {
  return {
    eventType: PRACTICE_PROBLEM_COMPLETED_EVENT,
    practiceProblemId: input.practiceProblemId,
    practiceAttemptId: input.practiceAttemptId,
    topicSlug: input.topicSlug,
    curriculumNodeId: input.curriculumNodeId,
    masteryBand: normalizeMasteryBand(input.masteryBand),
    payload: {
      language: input.language,
      correctnessScore: input.correctnessScore,
      visibleSummary: serializeSummary(input.visibleSummary),
      hiddenSummary: serializeSummary(input.hiddenSummary),
      hintCount: input.hintCount,
      speedSeconds: input.speedSeconds ?? null,
    },
  };
}

export function buildPracticeReviewQualityEvent(input: {
  attempt: PracticeAttemptEventInput;
  reviewQuality: PracticeReviewQualitySignal;
}): RecordPracticeEventInput {
  return {
    eventType: PRACTICE_REVIEW_QUALITY_RECORDED_EVENT,
    practiceProblemId: input.attempt.practiceProblemId,
    practiceAttemptId: input.attempt.practiceAttemptId,
    topicSlug: input.attempt.topicSlug,
    curriculumNodeId: input.attempt.curriculumNodeId,
    masteryBand: normalizeMasteryBand(input.attempt.masteryBand),
    payload: {
      language: input.attempt.language,
      score: input.reviewQuality.score,
      complexityExplained: input.reviewQuality.complexityExplained,
      edgeCasesExplained: input.reviewQuality.edgeCasesExplained,
      complexityExplanationLength: input.reviewQuality.complexityExplanation.length,
      edgeCaseExplanationLength: input.reviewQuality.edgeCaseExplanation.length,
      complexityExplanation: input.reviewQuality.complexityExplanation || null,
      edgeCaseExplanation: input.reviewQuality.edgeCaseExplanation || null,
    },
  };
}
