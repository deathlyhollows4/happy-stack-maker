import { describe, expect, it } from "vitest";
import { buildConservativePracticeAttemptScore } from "@/lib/practice-attempt-scoring";
import {
  PRACTICE_ATTEMPT_SUBMITTED_EVENT,
  PRACTICE_HIDDEN_TESTS_CHECKED_EVENT,
  PRACTICE_HINT_REVEALED_EVENT,
  PRACTICE_PROBLEM_COMPLETED_EVENT,
  PRACTICE_VISIBLE_TESTS_RUN_EVENT,
  RecordPracticeEventInputSchema,
  buildPracticeAttemptSubmittedEvent,
  buildPracticeCompletionEvent,
  buildPracticeHiddenTestCheckEvent,
  buildPracticeHintUsageEvent,
  buildPracticeVisibleTestRunEvent,
  type PracticeAttemptEventInput,
} from "@/lib/practice-event-model";
import { buildPracticeMasteryProgressUpdate } from "@/lib/practice-mastery-scoring";
import type { PracticeProblemView } from "@/lib/practice-problem-view";

const NOW = new Date("2026-06-24T10:00:00.000Z");

const beginnerView: PracticeProblemView = {
  isStructured: true,
  promptFallback: "",
  contractVersion: "codewise.practice.problem.v1",
  curriculumNodeId: "foundation-loops",
  masteryBand: "0-20",
  masteryBandLabel: "Concept drill",
  objective: "Count values with a simple loop.",
  statement: "Given a list of integers, return how many values are greater than zero.",
  topicTags: [{ slug: "loops", label: "Loops" }],
  prerequisiteTags: [{ slug: "functions", label: "Functions" }],
  bridgePreview: null,
  examples: [],
  constraints: [],
  functionSignature: null,
  visibleTests: [
    {
      name: "mixed values",
      arguments: [[1, -2, 3, 0]],
      expected: 2,
      theme: "positive and non-positive values",
      comparator: "deepEqual",
      visibility: "visible",
    },
    {
      name: "empty array",
      arguments: [[]],
      expected: 0,
      theme: "empty input",
      comparator: "deepEqual",
      visibility: "visible",
    },
  ],
  hiddenTestThemes: ["all negative values", "single positive value"],
  hintLadder: [
    {
      order: 1,
      title: "Track a count",
      body: "Create a count before the loop.",
    },
  ],
  successCriteria: [],
  generationStatus: "structured",
};

function attemptInput(input: {
  hiddenPassed: number;
  hiddenTotal: number;
  status: "completed" | "failed";
  correctnessScore: number;
  hintCount: number;
}): PracticeAttemptEventInput {
  return {
    practiceProblemId: "11111111-1111-4111-8111-111111111111",
    practiceAttemptId: "22222222-2222-4222-8222-222222222222",
    topicSlug: "loops",
    curriculumNodeId: "foundation-loops",
    masteryBand: "0-20",
    language: "python",
    hintCount: input.hintCount,
    visibleSummary: { total: 2, passed: 2, failed: 0 },
    hiddenSummary: {
      total: input.hiddenTotal,
      passed: input.hiddenPassed,
      failed: input.hiddenTotal - input.hiddenPassed,
    },
    status: input.status,
    correctnessScore: input.correctnessScore,
    executionStatus: "passed",
    speedSeconds: 900,
    reviewQualityScore: 1,
  };
}

describe("practice analytics lifecycle", () => {
  it("keeps visible tests, hint events, hidden checks, attempt events, and mastery deltas aligned", () => {
    const visibleRunEvent = buildPracticeVisibleTestRunEvent({
      practiceProblemId: "11111111-1111-4111-8111-111111111111",
      topicSlug: "loops",
      view: beginnerView,
      language: "python",
      testSummary: { total: 2, passed: 2, failed: 0, status: "passed" },
      resultCount: 2,
      durationMs: 510,
    });
    const hintEvent = buildPracticeHintUsageEvent({
      practiceProblemId: "11111111-1111-4111-8111-111111111111",
      topicSlug: "loops",
      view: beginnerView,
      hint: beginnerView.hintLadder[0],
      revealedHintOrders: [],
    });
    const score = buildConservativePracticeAttemptScore({
      visible: { total: 2, passed: 2, failed: 0 },
      hidden: { total: 2, passed: 1, failed: 1 },
      hasRunnableResults: true,
    });
    const attempt = attemptInput({
      hiddenPassed: 1,
      hiddenTotal: 2,
      status: score.status,
      correctnessScore: score.correctnessScore,
      hintCount: 1,
    });
    const hiddenEvent = buildPracticeHiddenTestCheckEvent(attempt);
    const submittedEvent = buildPracticeAttemptSubmittedEvent(attempt);
    const completionEvent = buildPracticeCompletionEvent(attempt);
    const mastery = buildPracticeMasteryProgressUpdate({
      correctnessScore: score.correctnessScore,
      status: score.status,
      failedAttemptCount: 1,
      hintCount: 1,
      reviewQualityScore: 1,
      speedSeconds: 900,
      masteryBand: "0-20",
      previousProgress: { mastery: 0.1, attempts: 1, stability: 2.5, difficulty: 5 },
      now: NOW,
    });
    const idealMastery = buildPracticeMasteryProgressUpdate({
      correctnessScore: 1,
      status: "completed",
      failedAttemptCount: 0,
      hintCount: 0,
      reviewQualityScore: 1,
      speedSeconds: 900,
      masteryBand: "0-20",
      previousProgress: { mastery: 0.1, attempts: 1, stability: 2.5, difficulty: 5 },
      now: NOW,
    });

    expect(visibleRunEvent).toMatchObject({
      eventType: PRACTICE_VISIBLE_TESTS_RUN_EVENT,
      payload: { total: 2, passed: 2, failed: 0, executionStatus: "passed" },
    });
    expect(hintEvent).toMatchObject({
      eventType: PRACTICE_HINT_REVEALED_EVENT,
      payload: { hintOrder: 1, revealedHintCount: 1, totalHintCount: 1 },
    });
    expect(score).toMatchObject({
      status: "completed",
      correctnessScore: 0.875,
      hiddenContribution: 0.125,
    });
    expect(hiddenEvent).toMatchObject({
      eventType: PRACTICE_HIDDEN_TESTS_CHECKED_EVENT,
      payload: {
        hiddenSummary: { total: 2, passed: 1, failed: 1 },
        visibleSummary: { total: 2, passed: 2, failed: 0 },
      },
    });
    expect(submittedEvent).toMatchObject({
      eventType: PRACTICE_ATTEMPT_SUBMITTED_EVENT,
      payload: {
        status: "completed",
        hintCount: 1,
        correctnessScore: 0.875,
      },
    });
    expect(completionEvent.eventType).toBe(PRACTICE_PROBLEM_COMPLETED_EVENT);
    expect(mastery.signal.delta).toBeGreaterThan(0);
    expect(mastery.signal.delta).toBeLessThan(idealMastery.signal.delta);
    expect(mastery.update.mastery).toBe(mastery.signal.nextMastery);
    expect(
      [visibleRunEvent, hintEvent, hiddenEvent, submittedEvent, completionEvent].every(
        (event) => RecordPracticeEventInputSchema.safeParse(event).success,
      ),
    ).toBe(true);
    expect(JSON.stringify([hiddenEvent, submittedEvent, completionEvent])).not.toContain(
      "all negative values",
    );
  });

  it("keeps severe hidden failures from completing attempts or increasing mastery", () => {
    const score = buildConservativePracticeAttemptScore({
      visible: { total: 2, passed: 2, failed: 0 },
      hidden: { total: 2, passed: 0, failed: 2 },
      hasRunnableResults: true,
    });
    const attempt = attemptInput({
      hiddenPassed: 0,
      hiddenTotal: 2,
      status: score.status,
      correctnessScore: score.correctnessScore,
      hintCount: 0,
    });
    const hiddenEvent = buildPracticeHiddenTestCheckEvent(attempt);
    const submittedEvent = buildPracticeAttemptSubmittedEvent(attempt);
    const emittedAttemptEvents = [
      hiddenEvent,
      submittedEvent,
      ...(score.status === "completed" ? [buildPracticeCompletionEvent(attempt)] : []),
    ];
    const mastery = buildPracticeMasteryProgressUpdate({
      correctnessScore: score.correctnessScore,
      status: score.status,
      failedAttemptCount: 1,
      hintCount: 0,
      reviewQualityScore: 1,
      speedSeconds: 900,
      masteryBand: "0-20",
      previousProgress: { mastery: 0.1, attempts: 1, stability: 2.5, difficulty: 5 },
      now: NOW,
    });

    expect(score).toMatchObject({
      status: "failed",
      correctnessScore: 0.75,
      hiddenContribution: 0,
    });
    expect(hiddenEvent).toMatchObject({
      eventType: PRACTICE_HIDDEN_TESTS_CHECKED_EVENT,
      payload: { hiddenSummary: { total: 2, passed: 0, failed: 2 } },
    });
    expect(submittedEvent).toMatchObject({
      eventType: PRACTICE_ATTEMPT_SUBMITTED_EVENT,
      payload: { status: "failed", correctnessScore: 0.75 },
    });
    expect(mastery.signal.delta).toBe(0);
    expect(mastery.signal.nextMastery).toBe(0.1);
    expect(emittedAttemptEvents.map((event) => event.eventType)).not.toContain(
      PRACTICE_PROBLEM_COMPLETED_EVENT,
    );
  });
});
