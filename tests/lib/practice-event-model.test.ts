import { describe, expect, it } from "vitest";
import {
  PRACTICE_ATTEMPT_SUBMITTED_EVENT,
  PRACTICE_HIDDEN_TESTS_CHECKED_EVENT,
  PRACTICE_HINT_REVEALED_EVENT,
  PRACTICE_PROBLEM_COMPLETED_EVENT,
  PRACTICE_PROBLEM_GENERATED_EVENT,
  PRACTICE_REVIEW_QUALITY_RECORDED_EVENT,
  PRACTICE_VISIBLE_TESTS_RUN_EVENT,
  RecordPracticeEventInputSchema,
  buildPracticeAttemptSubmittedEvent,
  buildPracticeCompletionEvent,
  buildPracticeHiddenTestCheckEvent,
  buildPracticeHintUsageEvent,
  buildPracticeProblemGeneratedEvent,
  buildPracticeReviewQualityEvent,
  buildPracticeReviewQualitySignal,
  buildPracticeVisibleTestRunEvent,
  markPracticeHintRevealed,
  type PracticeAttemptEventInput,
} from "@/lib/practice-event-model";
import type { PracticeProblemView } from "@/lib/practice-problem-view";

const practiceView: PracticeProblemView = {
  isStructured: true,
  promptFallback: "",
  contractVersion: "codewise.practice.problem.v1",
  curriculumNodeId: "foundation-loops",
  masteryBand: "0-20",
  masteryBandLabel: "Concept drill",
  objective: "Count matching values.",
  statement: "Given a list of integers, return how many values are greater than zero.",
  topicTags: [{ slug: "loops", label: "Loops" }],
  prerequisiteTags: [{ slug: "functions", label: "Functions" }],
  bridgePreview: null,
  examples: [],
  constraints: [],
  functionSignature: null,
  visibleTests: [],
  hiddenTestThemes: [],
  hintLadder: [
    {
      order: 1,
      title: "Track a count",
      body: "Start a counter before the loop.",
    },
    {
      order: 2,
      title: "Inspect each number",
      body: "Compare the current number with zero.",
    },
  ],
  successCriteria: [],
  generationStatus: "structured",
};

const attemptEventInput: PracticeAttemptEventInput = {
  practiceProblemId: "11111111-1111-4111-8111-111111111111",
  practiceAttemptId: "22222222-2222-4222-8222-222222222222",
  topicSlug: "loops",
  curriculumNodeId: "foundation-loops",
  masteryBand: "0-20",
  language: "python",
  hintCount: 1,
  visibleSummary: { total: 2, passed: 2, failed: 0 },
  hiddenSummary: { total: 2, passed: 1, failed: 1 },
  status: "completed",
  correctnessScore: 0.875,
  executionStatus: "passed",
  speedSeconds: 180,
  reviewQualityScore: 1,
};

describe("practice event model", () => {
  it("marks a hint reveal once and keeps orders sorted", () => {
    expect(markPracticeHintRevealed([2], 1)).toEqual({
      revealedHintOrders: [1, 2],
      shouldRecord: true,
    });

    expect(markPracticeHintRevealed([1, 2], 2)).toEqual({
      revealedHintOrders: [1, 2],
      shouldRecord: false,
    });
  });

  it("builds a hint usage event for the practice event log", () => {
    const event = buildPracticeHintUsageEvent({
      practiceProblemId: "11111111-1111-4111-8111-111111111111",
      topicSlug: "loops",
      view: practiceView,
      hint: practiceView.hintLadder[1],
      revealedHintOrders: [1],
    });

    expect(event).toEqual({
      eventType: PRACTICE_HINT_REVEALED_EVENT,
      practiceProblemId: "11111111-1111-4111-8111-111111111111",
      topicSlug: "loops",
      curriculumNodeId: "foundation-loops",
      masteryBand: "0-20",
      payload: {
        hintOrder: 2,
        hintTitle: "Inspect each number",
        revealedHintCount: 2,
        totalHintCount: 2,
      },
    });
  });

  it("builds a generation event with planner and test-count metadata", () => {
    const event = buildPracticeProblemGeneratedEvent({
      practiceProblemId: "11111111-1111-4111-8111-111111111111",
      topicSlug: "loops",
      curriculumNodeId: "foundation-loops",
      masteryBand: "0-20",
      language: "python",
      requestedTopicSlug: null,
      plannerSource: "beginner-start",
      visibleTestCount: 2,
      hiddenTestCount: 3,
      hintCount: 2,
      hasBridgePreview: false,
    });

    expect(event).toEqual({
      eventType: PRACTICE_PROBLEM_GENERATED_EVENT,
      practiceProblemId: "11111111-1111-4111-8111-111111111111",
      topicSlug: "loops",
      curriculumNodeId: "foundation-loops",
      masteryBand: "0-20",
      payload: {
        language: "python",
        requestedTopicSlug: null,
        plannerSource: "beginner-start",
        visibleTestCount: 2,
        hiddenTestCount: 3,
        hintCount: 2,
        hasBridgePreview: false,
      },
    });
    expect(RecordPracticeEventInputSchema.safeParse(event).success).toBe(true);
  });

  it("builds a visible-test run event from a practice view", () => {
    const event = buildPracticeVisibleTestRunEvent({
      practiceProblemId: "11111111-1111-4111-8111-111111111111",
      topicSlug: "loops",
      view: {
        ...practiceView,
        visibleTests: [
          {
            name: "counts positives",
            arguments: [[1, -2, 3]],
            expected: 2,
            theme: "positive values",
            comparator: "deepEqual",
            visibility: "visible",
          },
        ],
      },
      language: "python",
      testSummary: { total: 1, passed: 1, failed: 0, status: "passed" },
      resultCount: 1,
      durationMs: 420,
    });

    expect(event).toMatchObject({
      eventType: PRACTICE_VISIBLE_TESTS_RUN_EVENT,
      masteryBand: "0-20",
      payload: {
        language: "python",
        visibleTestCount: 1,
        resultCount: 1,
        durationMs: 420,
        executionStatus: "passed",
        total: 1,
        passed: 1,
        failed: 0,
      },
    });
    expect(RecordPracticeEventInputSchema.safeParse(event).success).toBe(true);
  });

  it("builds submitted-attempt analytics events without hidden test content", () => {
    const hiddenEvent = buildPracticeHiddenTestCheckEvent(attemptEventInput);
    const submitEvent = buildPracticeAttemptSubmittedEvent(attemptEventInput);
    const completionEvent = buildPracticeCompletionEvent(attemptEventInput);

    expect(hiddenEvent).toMatchObject({
      eventType: PRACTICE_HIDDEN_TESTS_CHECKED_EVENT,
      payload: {
        hiddenSummary: { total: 2, passed: 1, failed: 1 },
        visibleSummary: { total: 2, passed: 2, failed: 0 },
      },
    });
    expect(hiddenEvent.payload).not.toHaveProperty("hiddenTests");
    expect(submitEvent).toMatchObject({
      eventType: PRACTICE_ATTEMPT_SUBMITTED_EVENT,
      payload: {
        hintCount: 1,
        speedSeconds: 180,
        correctnessScore: 0.875,
        reviewQualityScore: 1,
      },
    });
    expect(completionEvent.eventType).toBe(PRACTICE_PROBLEM_COMPLETED_EVENT);
    expect(
      [hiddenEvent, submitEvent, completionEvent].every(
        (event) => RecordPracticeEventInputSchema.safeParse(event).success,
      ),
    ).toBe(true);
  });

  it("scores and logs review quality signals", () => {
    const reviewQuality = buildPracticeReviewQualitySignal({
      complexityExplanation: "O(n) time and O(1) extra space.",
      edgeCaseExplanation: "Handles empty arrays and repeated values.",
    });
    const event = buildPracticeReviewQualityEvent({
      attempt: attemptEventInput,
      reviewQuality,
    });

    expect(reviewQuality).toMatchObject({
      complexityExplained: true,
      edgeCasesExplained: true,
      score: 1,
    });
    expect(event).toMatchObject({
      eventType: PRACTICE_REVIEW_QUALITY_RECORDED_EVENT,
      payload: {
        score: 1,
        complexityExplained: true,
        edgeCasesExplained: true,
        complexityExplanationLength: 31,
        edgeCaseExplanationLength: 41,
      },
    });
    expect(RecordPracticeEventInputSchema.safeParse(event).success).toBe(true);
  });

  it("keeps review quality unscored when the learner leaves notes blank", () => {
    expect(buildPracticeReviewQualitySignal()).toMatchObject({
      complexityExplained: false,
      edgeCasesExplained: false,
      score: null,
    });
  });

  it("validates the record-practice-event input contract", () => {
    const event = buildPracticeHintUsageEvent({
      practiceProblemId: "11111111-1111-4111-8111-111111111111",
      topicSlug: "loops",
      view: practiceView,
      hint: practiceView.hintLadder[0],
      revealedHintOrders: [],
    });

    expect(RecordPracticeEventInputSchema.safeParse(event).success).toBe(true);
    expect(
      RecordPracticeEventInputSchema.safeParse({
        ...event,
        practiceProblemId: "not-a-uuid",
      }).success,
    ).toBe(false);
  });
});
