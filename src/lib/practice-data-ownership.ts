import {
  shapePracticeAttemptExport,
  shapePracticeEventExport,
  shapePracticeProblemExport,
  shapeSubmissionExport,
  type ExportPracticeAttemptInput,
  type ExportPracticeEventInput,
  type ExportPracticeProblemInput,
  type ExportSubmissionInput,
} from "@/lib/export-data-view";

export const PRACTICE_SUBMISSION_EXPORT_COLUMNS = [
  "id",
  "language",
  "code",
  "summary",
  "concepts",
  "created_at",
  "practice_problem_id",
  "practice_attempt_id",
  "practice_metadata",
] as const;

export const ADMIN_PRACTICE_SUBMISSION_EXPORT_COLUMNS = [
  "id",
  "user_id",
  ...PRACTICE_SUBMISSION_EXPORT_COLUMNS.filter((column) => column !== "id"),
] as const;

export const PRACTICE_PROBLEM_EXPORT_COLUMNS = [
  "id",
  "topic_slug",
  "title",
  "prompt",
  "starter_code",
  "language",
  "created_at",
  "contract_version",
  "curriculum_node_id",
  "mastery_band",
  "objective",
  "statement",
  "topic_tags",
  "prerequisite_tags",
  "examples",
  "constraints",
  "function_signature",
  "visible_tests",
  "hidden_test_themes",
  "hint_ladder",
  "success_criteria",
  "generation_status",
] as const;

export const ADMIN_PRACTICE_PROBLEM_EXPORT_COLUMNS = [
  "id",
  "user_id",
  ...PRACTICE_PROBLEM_EXPORT_COLUMNS.filter((column) => column !== "id"),
] as const;

export const PRACTICE_ATTEMPT_EXPORT_COLUMNS = [
  "id",
  "practice_problem_id",
  "language",
  "status",
  "visible_tests_passed",
  "visible_tests_total",
  "hidden_tests_passed",
  "hidden_tests_total",
  "correctness_score",
  "hint_count",
  "review_quality_score",
  "speed_seconds",
  "started_at",
  "completed_at",
  "created_at",
] as const;

export const ADMIN_PRACTICE_ATTEMPT_EXPORT_COLUMNS = [
  "id",
  "user_id",
  ...PRACTICE_ATTEMPT_EXPORT_COLUMNS.filter((column) => column !== "id"),
] as const;

export const PRACTICE_EVENT_EXPORT_COLUMNS = [
  "id",
  "event_type",
  "practice_problem_id",
  "practice_attempt_id",
  "topic_slug",
  "curriculum_node_id",
  "mastery_band",
  "payload",
  "created_at",
] as const;

export const ADMIN_PRACTICE_EVENT_EXPORT_COLUMNS = [
  "id",
  "user_id",
  ...PRACTICE_EVENT_EXPORT_COLUMNS.filter((column) => column !== "id"),
] as const;

export const ACCOUNT_DELETE_TABLES = [
  "review_issues",
  "submissions",
  "practice_events",
  "practice_attempts",
  "practice_problem_hidden_tests",
  "practice_problems",
  "progress",
  "usage_counters",
  "subscriptions",
  "user_roles",
] as const;

function columns(columns: readonly string[]) {
  return columns.join(", ");
}

export function practiceSubmissionExportColumns(options: { includeUserId?: boolean } = {}) {
  return columns(
    options.includeUserId
      ? ADMIN_PRACTICE_SUBMISSION_EXPORT_COLUMNS
      : PRACTICE_SUBMISSION_EXPORT_COLUMNS,
  );
}

export function practiceProblemExportColumns(options: { includeUserId?: boolean } = {}) {
  return columns(
    options.includeUserId ? ADMIN_PRACTICE_PROBLEM_EXPORT_COLUMNS : PRACTICE_PROBLEM_EXPORT_COLUMNS,
  );
}

export function practiceAttemptExportColumns(options: { includeUserId?: boolean } = {}) {
  return columns(
    options.includeUserId ? ADMIN_PRACTICE_ATTEMPT_EXPORT_COLUMNS : PRACTICE_ATTEMPT_EXPORT_COLUMNS,
  );
}

export function practiceEventExportColumns(options: { includeUserId?: boolean } = {}) {
  return columns(
    options.includeUserId ? ADMIN_PRACTICE_EVENT_EXPORT_COLUMNS : PRACTICE_EVENT_EXPORT_COLUMNS,
  );
}

export function shapePracticeExportRows(input: {
  submissions: ExportSubmissionInput[];
  practiceProblems: ExportPracticeProblemInput[];
  practiceAttempts: ExportPracticeAttemptInput[];
  practiceEvents: ExportPracticeEventInput[];
}) {
  return {
    submissions: input.submissions.map(shapeSubmissionExport),
    practice_problems: input.practiceProblems.map(shapePracticeProblemExport),
    practice_attempts: input.practiceAttempts.map(shapePracticeAttemptExport),
    practice_events: input.practiceEvents.map(shapePracticeEventExport),
  };
}
