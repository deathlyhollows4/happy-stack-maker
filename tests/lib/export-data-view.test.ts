import { describe, expect, it } from "vitest";
import {
  shapePracticeAttemptExport,
  shapePracticeEventExport,
  shapePracticeProblemExport,
  shapeSubmissionExport,
  summarizePracticeMetadata,
} from "@/lib/export-data-view";

describe("export data view", () => {
  it("keeps review submission links and sanitizes practice metadata", () => {
    const metadata = summarizePracticeMetadata({
      source: "practice",
      practiceProblemTitle: "Count Positive Numbers",
      topicSlug: "arrays",
      curriculumNodeId: "foundation-arrays",
      masteryBand: "0-20",
      attempt: {
        status: "completed",
        correctnessScore: 0.82,
        reviewQualityScore: 0.75,
        hintCount: 1,
        speedSeconds: 420,
        completedAt: "2026-06-23T10:20:00.000Z",
        visibleSummary: { passed: 3, total: 4, failed: 1 },
        hiddenChecksRun: true,
        hiddenTestsPassed: 4,
        hiddenTestsTotal: 5,
      },
      topicMastery: {
        topicSlug: "arrays",
        mastery: 0.57,
        attempts: 6,
        lastReviewed: "2026-06-23T10:20:00.000Z",
        nextReviewDate: "2026-06-26",
        retrievability: 0.81,
      },
    });

    expect(metadata?.attempt).toMatchObject({
      status: "completed",
      hiddenChecksRun: true,
      visibleSummary: { passed: 3, total: 4, failed: 1 },
    });
    expect(metadata?.attempt).not.toHaveProperty("hiddenTestsPassed");
    expect(metadata?.attempt).not.toHaveProperty("hiddenTestsTotal");

    const submission = shapeSubmissionExport({
      id: "sub-1",
      user_id: "user-1",
      language: "python",
      code: "def solve():\n    return 1",
      summary: "Good visible-test coverage.",
      concepts: ["arrays"],
      created_at: "2026-06-23T10:21:00.000Z",
      practice_problem_id: "problem-1",
      practice_attempt_id: "attempt-1",
      practice_metadata: metadata,
    });

    expect(submission).toMatchObject({
      user_id: "user-1",
      practice_problem_id: "problem-1",
      practice_attempt_id: "attempt-1",
      practice_metadata: {
        source: "practice",
        topicSlug: "arrays",
      },
    });
  });

  it("exports structured practice problem fields without hidden test rows", () => {
    const row = shapePracticeProblemExport({
      id: "problem-1",
      user_id: "user-1",
      topic_slug: "arrays",
      title: "Count Positive Numbers",
      prompt: "Legacy prompt",
      starter_code: "def count_positive(nums):\n    pass",
      language: "python",
      created_at: "2026-06-23T10:00:00.000Z",
      contract_version: "practice-problem.v1",
      curriculum_node_id: "foundation-arrays",
      mastery_band: "0-20",
      objective: "Use one loop to count positives.",
      statement: "Given integers, return the count of positive values.",
      topic_tags: [{ slug: "arrays", label: "Arrays" }],
      prerequisite_tags: [{ slug: "loops", label: "Loops" }],
      visible_tests: [{ name: "mixed", arguments: [[-1, 2]], expected: 1 }],
      hidden_test_themes: ["empty input"],
      hint_ladder: [{ order: 1, title: "Loop", body: "Inspect each value." }],
      success_criteria: ["Returns a count"],
      generation_status: "structured",
    });

    expect(row).toMatchObject({
      user_id: "user-1",
      curriculum_node_id: "foundation-arrays",
      mastery_band: "0-20",
      visible_tests: [{ name: "mixed", arguments: [[-1, 2]], expected: 1 }],
      hidden_test_themes: ["empty input"],
    });
    expect(row).not.toHaveProperty("hidden_tests");
  });

  it("exports attempt summaries without hidden pass or total counts", () => {
    const row = shapePracticeAttemptExport({
      id: "attempt-1",
      user_id: "user-1",
      practice_problem_id: "problem-1",
      language: "python",
      status: "failed",
      visible_tests_passed: 2,
      visible_tests_total: 3,
      hidden_tests_passed: 4,
      hidden_tests_total: 5,
      correctness_score: 0.62,
      hint_count: 2,
      review_quality_score: 0.5,
      speed_seconds: 360,
      started_at: "2026-06-23T10:00:00.000Z",
      completed_at: "2026-06-23T10:06:00.000Z",
      created_at: "2026-06-23T10:00:00.000Z",
    });

    expect(row).toMatchObject({
      user_id: "user-1",
      visible_tests_passed: 2,
      visible_tests_total: 3,
      hidden_checks_run: true,
      correctness_score: 0.62,
    });
    expect(row).not.toHaveProperty("hidden_tests_passed");
    expect(row).not.toHaveProperty("hidden_tests_total");
  });

  it("exports event logs with payload summaries instead of raw hidden summaries", () => {
    const row = shapePracticeEventExport({
      id: "event-1",
      user_id: "user-1",
      event_type: "practice_attempt_submitted",
      practice_problem_id: "problem-1",
      practice_attempt_id: "attempt-1",
      topic_slug: "arrays",
      curriculum_node_id: "foundation-arrays",
      mastery_band: "0-20",
      payload: {
        language: "python",
        status: "failed",
        visibleSummary: { passed: 2, total: 3, failed: 1 },
        hiddenSummary: { passed: 4, total: 5, failed: 1 },
        correctnessScore: 0.62,
        speedSeconds: 360,
      },
      created_at: "2026-06-23T10:06:00.000Z",
    });

    expect(row.payload_summary).toMatchObject({
      language: "python",
      status: "failed",
      visible_summary: { passed: 2, total: 3, failed: 1 },
      hidden_checks_run: true,
      correctness_score: 0.62,
      speed_seconds: 360,
    });
    expect(row.payload_summary.payload_keys).not.toContain("hiddenSummary");
    expect(row.payload_summary).not.toHaveProperty("hiddenSummary");
  });
});
