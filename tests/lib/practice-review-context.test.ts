import { describe, expect, it } from "vitest";
import { buildPracticeReviewSubmissionMetadata } from "@/lib/practice-review-context.server";

describe("practice review context", () => {
  it("propagates practice attempt review quality into review metadata", () => {
    const metadata = buildPracticeReviewSubmissionMetadata({
      problem: {
        id: "11111111-1111-4111-8111-111111111111",
        title: "Count Positive Numbers",
        topic_slug: "arrays",
        curriculum_node_id: "arrays-basics",
        mastery_band: "41-60",
      },
      attempt: {
        id: "22222222-2222-4222-8222-222222222222",
        practice_problem_id: "11111111-1111-4111-8111-111111111111",
        status: "completed",
        visible_tests_passed: 3,
        visible_tests_total: 4,
        hidden_tests_total: 5,
        correctness_score: 0.82,
        hint_count: 1,
        review_quality_score: 0.75,
        speed_seconds: 420,
        completed_at: "2026-06-23T10:20:00.000Z",
      },
      progress: {
        topic_slug: "arrays",
        mastery: 0.57,
        attempts: 6,
        last_reviewed: "2026-06-23T10:20:00.000Z",
        next_review_date: "2026-06-26",
        retrievability: 0.81,
      },
    });

    expect(metadata).toMatchObject({
      source: "practice",
      practiceProblemTitle: "Count Positive Numbers",
      topicSlug: "arrays",
      curriculumNodeId: "arrays-basics",
      masteryBand: "41-60",
      attempt: {
        status: "completed",
        correctnessScore: 0.82,
        reviewQualityScore: 0.75,
        hintCount: 1,
        speedSeconds: 420,
        completedAt: "2026-06-23T10:20:00.000Z",
        visibleSummary: {
          passed: 3,
          total: 4,
          failed: 1,
        },
        hiddenChecksRun: true,
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
    expect(metadata.attempt).not.toHaveProperty("hiddenTestsPassed");
    expect(metadata.attempt).not.toHaveProperty("hiddenTestsTotal");
  });

  it("keeps mastery metadata nullable when progress is not available yet", () => {
    const metadata = buildPracticeReviewSubmissionMetadata({
      problem: {
        id: "11111111-1111-4111-8111-111111111111",
        title: "Return A Value",
        topic_slug: null,
        curriculum_node_id: "foundation-io",
        mastery_band: "0-20",
      },
      attempt: {
        id: "22222222-2222-4222-8222-222222222222",
        practice_problem_id: "11111111-1111-4111-8111-111111111111",
        status: "failed",
        visible_tests_passed: 0,
        visible_tests_total: 2,
        hidden_tests_total: 0,
        correctness_score: -0.25,
        hint_count: 9,
        review_quality_score: null,
        speed_seconds: null,
        completed_at: null,
      },
      progress: null,
    });

    expect(metadata.attempt).toMatchObject({
      status: "failed",
      correctnessScore: 0,
      reviewQualityScore: null,
      hintCount: 9,
      speedSeconds: null,
      visibleSummary: {
        passed: 0,
        total: 2,
        failed: 2,
      },
      hiddenChecksRun: false,
    });
    expect(metadata.topicMastery).toBeNull();
  });
});
