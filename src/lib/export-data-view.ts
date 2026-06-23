import type { Json } from "@/integrations/supabase/types";
import { PRACTICE_PROBLEM_CONTRACT_VERSION } from "@/lib/practice-problem-contract";

type JsonRecord = Record<string, unknown>;

export interface ExportSubmissionInput {
  id: string;
  user_id?: string | null;
  language: string;
  code: string;
  summary: string | null;
  concepts: string[];
  created_at: string;
  practice_problem_id?: string | null;
  practice_attempt_id?: string | null;
  practice_metadata?: Json | null;
}

export interface ExportPracticeProblemInput {
  id: string;
  user_id?: string | null;
  topic_slug: string | null;
  title: string | null;
  prompt: string | null;
  starter_code: string | null;
  language: string;
  created_at: string;
  contract_version?: string | null;
  curriculum_node_id?: string | null;
  mastery_band?: string | null;
  objective?: string | null;
  statement?: string | null;
  topic_tags?: Json | null;
  prerequisite_tags?: Json | null;
  examples?: Json | null;
  constraints?: Json | null;
  function_signature?: Json | null;
  visible_tests?: Json | null;
  hidden_test_themes?: Json | null;
  hint_ladder?: Json | null;
  success_criteria?: Json | null;
  generation_status?: string | null;
}

export interface ExportPracticeAttemptInput {
  id: string;
  user_id?: string | null;
  practice_problem_id: string;
  language: string;
  status: string;
  visible_tests_passed: number;
  visible_tests_total: number;
  hidden_tests_passed?: number | null;
  hidden_tests_total?: number | null;
  correctness_score: number;
  hint_count: number;
  review_quality_score: number | null;
  speed_seconds: number | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

export interface ExportPracticeEventInput {
  id: string;
  user_id?: string | null;
  event_type: string;
  practice_problem_id: string | null;
  practice_attempt_id: string | null;
  topic_slug: string | null;
  curriculum_node_id: string | null;
  mastery_band: string | null;
  payload: Json;
  created_at: string;
}

function isRecord(input: unknown): input is JsonRecord {
  return Boolean(input) && typeof input === "object" && !Array.isArray(input);
}

function finiteNumber(input: unknown): number | null {
  return typeof input === "number" && Number.isFinite(input) ? input : null;
}

function stringOrNull(input: unknown): string | null {
  return typeof input === "string" && input.trim() ? input : null;
}

function booleanOrNull(input: unknown): boolean | null {
  return typeof input === "boolean" ? input : null;
}

function exportedPracticeGenerationStatus(row: ExportPracticeProblemInput) {
  if (stringOrNull(row.generation_status)) return row.generation_status;
  return row.contract_version === PRACTICE_PROBLEM_CONTRACT_VERSION ? "structured" : "legacy";
}

function summarizeVisibleSummary(input: unknown) {
  if (!isRecord(input)) return null;
  const total = finiteNumber(input.total);
  const passed = finiteNumber(input.passed);
  const failed = finiteNumber(input.failed);
  if (total === null && passed === null && failed === null) return null;
  return { total, passed, failed };
}

function hiddenChecksRunFromPayload(payload: JsonRecord): boolean | null {
  const explicit = booleanOrNull(payload.hiddenChecksRun);
  if (explicit !== null) return explicit;

  if (isRecord(payload.hiddenSummary)) {
    const total = finiteNumber(payload.hiddenSummary.total);
    return total !== null ? total > 0 : true;
  }

  const hiddenTestCount = finiteNumber(payload.hiddenTestCount);
  return hiddenTestCount !== null ? hiddenTestCount > 0 : null;
}

export function summarizePracticeMetadata(input: Json | null | undefined) {
  if (!isRecord(input)) return null;

  const attempt = isRecord(input.attempt) ? input.attempt : null;
  const topicMastery = isRecord(input.topicMastery) ? input.topicMastery : null;

  return {
    source: stringOrNull(input.source),
    practiceProblemTitle: stringOrNull(input.practiceProblemTitle),
    topicSlug: stringOrNull(input.topicSlug),
    curriculumNodeId: stringOrNull(input.curriculumNodeId),
    masteryBand: stringOrNull(input.masteryBand),
    attempt: attempt
      ? {
          status: stringOrNull(attempt.status),
          correctnessScore: finiteNumber(attempt.correctnessScore),
          reviewQualityScore: finiteNumber(attempt.reviewQualityScore),
          hintCount: finiteNumber(attempt.hintCount),
          speedSeconds: finiteNumber(attempt.speedSeconds),
          completedAt: stringOrNull(attempt.completedAt),
          visibleSummary: summarizeVisibleSummary(attempt.visibleSummary),
          hiddenChecksRun: booleanOrNull(attempt.hiddenChecksRun),
        }
      : null,
    topicMastery: topicMastery
      ? {
          topicSlug: stringOrNull(topicMastery.topicSlug),
          mastery: finiteNumber(topicMastery.mastery),
          attempts: finiteNumber(topicMastery.attempts),
          lastReviewed: stringOrNull(topicMastery.lastReviewed),
          nextReviewDate: stringOrNull(topicMastery.nextReviewDate),
          retrievability: finiteNumber(topicMastery.retrievability),
        }
      : null,
  };
}

export function shapeSubmissionExport(row: ExportSubmissionInput) {
  return {
    ...("user_id" in row ? { user_id: row.user_id ?? null } : {}),
    id: row.id,
    language: row.language,
    code: row.code,
    summary: row.summary,
    concepts: row.concepts,
    created_at: row.created_at,
    practice_problem_id: row.practice_problem_id ?? null,
    practice_attempt_id: row.practice_attempt_id ?? null,
    practice_metadata: summarizePracticeMetadata(row.practice_metadata),
  };
}

export function shapePracticeProblemExport(row: ExportPracticeProblemInput) {
  return {
    ...("user_id" in row ? { user_id: row.user_id ?? null } : {}),
    id: row.id,
    topic_slug: row.topic_slug,
    title: row.title,
    prompt: row.prompt,
    starter_code: row.starter_code,
    language: row.language,
    created_at: row.created_at,
    contract_version: row.contract_version ?? null,
    curriculum_node_id: row.curriculum_node_id ?? null,
    mastery_band: row.mastery_band ?? null,
    objective: row.objective ?? null,
    statement: row.statement ?? null,
    topic_tags: row.topic_tags ?? [],
    prerequisite_tags: row.prerequisite_tags ?? [],
    examples: row.examples ?? [],
    constraints: row.constraints ?? [],
    function_signature: row.function_signature ?? null,
    visible_tests: row.visible_tests ?? [],
    hidden_test_themes: row.hidden_test_themes ?? [],
    hint_ladder: row.hint_ladder ?? [],
    success_criteria: row.success_criteria ?? [],
    generation_status: exportedPracticeGenerationStatus(row),
  };
}

export function shapePracticeAttemptExport(row: ExportPracticeAttemptInput) {
  return {
    ...("user_id" in row ? { user_id: row.user_id ?? null } : {}),
    id: row.id,
    practice_problem_id: row.practice_problem_id,
    language: row.language,
    status: row.status,
    visible_tests_passed: row.visible_tests_passed,
    visible_tests_total: row.visible_tests_total,
    hidden_checks_run: (row.hidden_tests_total ?? 0) > 0 || (row.hidden_tests_passed ?? 0) > 0,
    correctness_score: row.correctness_score,
    hint_count: row.hint_count,
    review_quality_score: row.review_quality_score,
    speed_seconds: row.speed_seconds,
    started_at: row.started_at,
    completed_at: row.completed_at,
    created_at: row.created_at,
  };
}

export function shapePracticeEventExport(row: ExportPracticeEventInput) {
  const payload = isRecord(row.payload) ? row.payload : {};
  const payloadKeys = Object.keys(payload)
    .filter((key) => key !== "hiddenSummary")
    .sort();

  return {
    ...("user_id" in row ? { user_id: row.user_id ?? null } : {}),
    id: row.id,
    event_type: row.event_type,
    practice_problem_id: row.practice_problem_id,
    practice_attempt_id: row.practice_attempt_id,
    topic_slug: row.topic_slug,
    curriculum_node_id: row.curriculum_node_id,
    mastery_band: row.mastery_band,
    created_at: row.created_at,
    payload_summary: {
      payload_keys: payloadKeys,
      language: stringOrNull(payload.language),
      status: stringOrNull(payload.status),
      planner_source: stringOrNull(payload.plannerSource),
      requested_topic_slug: stringOrNull(payload.requestedTopicSlug),
      visible_summary: summarizeVisibleSummary(payload.visibleSummary),
      visible_test_count: finiteNumber(payload.visibleTestCount),
      hidden_checks_run: hiddenChecksRunFromPayload(payload),
      hint_count: finiteNumber(payload.hintCount),
      review_quality_score: finiteNumber(payload.reviewQualityScore ?? payload.score),
      correctness_score: finiteNumber(payload.correctnessScore),
      speed_seconds: finiteNumber(payload.speedSeconds),
    },
  };
}
