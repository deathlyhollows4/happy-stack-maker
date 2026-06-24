import { describe, expect, it } from "vitest";
import {
  ACCOUNT_DELETE_TABLES,
  practiceAttemptExportColumns,
  practiceEventExportColumns,
  practiceProblemExportColumns,
  practiceSubmissionExportColumns,
  shapePracticeExportRows,
} from "@/lib/practice-data-ownership";

describe("practice data ownership", () => {
  it("owns user and admin practice export column lists", () => {
    expect(practiceSubmissionExportColumns()).toContain("practice_metadata");
    expect(practiceSubmissionExportColumns()).not.toContain("user_id");
    expect(practiceSubmissionExportColumns({ includeUserId: true })).toContain("user_id");

    expect(practiceProblemExportColumns()).toContain("hidden_test_themes");
    expect(practiceProblemExportColumns()).not.toContain("hidden_tests");
    expect(practiceAttemptExportColumns()).toContain("hidden_tests_total");
    expect(practiceEventExportColumns()).toContain("payload");
  });

  it("shapes practice rows without exposing hidden test content", () => {
    const shaped = shapePracticeExportRows({
      submissions: [],
      practiceProblems: [
        {
          id: "problem-1",
          topic_slug: "arrays",
          title: "Count Positive Numbers",
          prompt: "Count positive values.",
          starter_code: null,
          language: "python",
          created_at: "2026-06-25T00:00:00.000Z",
          hidden_test_themes: ["all non-positive values"],
        },
      ],
      practiceAttempts: [
        {
          id: "attempt-1",
          practice_problem_id: "problem-1",
          language: "python",
          status: "failed",
          visible_tests_passed: 1,
          visible_tests_total: 2,
          hidden_tests_passed: 3,
          hidden_tests_total: 4,
          correctness_score: 0.55,
          hint_count: 1,
          review_quality_score: null,
          speed_seconds: null,
          started_at: "2026-06-25T00:00:00.000Z",
          completed_at: "2026-06-25T00:05:00.000Z",
          created_at: "2026-06-25T00:00:00.000Z",
        },
      ],
      practiceEvents: [
        {
          id: "event-1",
          event_type: "practice_attempt_submitted",
          practice_problem_id: "problem-1",
          practice_attempt_id: "attempt-1",
          topic_slug: "arrays",
          curriculum_node_id: "arrays-counting-001",
          mastery_band: "0-20",
          payload: {
            hiddenSummary: { total: 4, passed: 3, failed: 1 },
            visibleSummary: { total: 2, passed: 1, failed: 1 },
          },
          created_at: "2026-06-25T00:05:00.000Z",
        },
      ],
    });

    expect(shaped.practice_problems[0]).not.toHaveProperty("hidden_tests");
    expect(shaped.practice_attempts[0]).toMatchObject({
      hidden_checks_run: true,
    });
    expect(shaped.practice_attempts[0]).not.toHaveProperty("hidden_tests_passed");
    expect(shaped.practice_events[0]?.payload_summary.payload_keys).not.toContain("hiddenSummary");
  });

  it("keeps account deletion in dependent-table order", () => {
    expect(ACCOUNT_DELETE_TABLES.slice(0, 6)).toEqual([
      "review_issues",
      "submissions",
      "practice_events",
      "practice_attempts",
      "practice_problem_hidden_tests",
      "practice_problems",
    ]);
  });
});
