import { describe, expect, it } from "vitest";
import {
  buildConservativePracticeAttemptScore,
  summarizePracticeTestResults,
} from "@/lib/practice-attempt-scoring";
import type { PracticeTestRunResult } from "@/lib/practice-test-execution";

const RESULTS: PracticeTestRunResult[] = [
  {
    id: "visible-1-basic",
    name: "basic",
    visibility: "visible",
    passed: true,
    actual: 3,
    expected: 3,
    error: null,
  },
  {
    id: "visible-2-zero",
    name: "zero",
    visibility: "visible",
    passed: true,
    actual: 0,
    expected: 0,
    error: null,
  },
  {
    id: "hidden-3-negative",
    name: "negative",
    visibility: "hidden",
    passed: false,
    actual: 1,
    expected: 2,
    error: null,
  },
];

describe("summarizePracticeTestResults", () => {
  it("summarizes results by visibility", () => {
    expect(summarizePracticeTestResults(RESULTS, "visible")).toEqual({
      total: 2,
      passed: 2,
      failed: 0,
    });
    expect(summarizePracticeTestResults(RESULTS, "hidden")).toEqual({
      total: 1,
      passed: 0,
      failed: 1,
    });
  });

  it("uses fallback totals when execution produced no runnable result payload", () => {
    expect(summarizePracticeTestResults(undefined, "hidden", 3)).toEqual({
      total: 3,
      passed: 0,
      failed: 3,
    });
  });
});

describe("buildConservativePracticeAttemptScore", () => {
  it("marks visible-pass attempts complete even when hidden checks reduce the score", () => {
    const score = buildConservativePracticeAttemptScore({
      visible: { total: 2, passed: 2, failed: 0 },
      hidden: { total: 2, passed: 1, failed: 1 },
      hasRunnableResults: true,
    });

    expect(score).toEqual({
      status: "completed",
      correctnessScore: 0.875,
      visibleScore: 1,
      hiddenScore: 0.5,
      hiddenContribution: 0.125,
    });
  });

  it("does not let hidden passes complete a failed visible attempt", () => {
    const score = buildConservativePracticeAttemptScore({
      visible: { total: 2, passed: 1, failed: 1 },
      hidden: { total: 2, passed: 2, failed: 0 },
      hasRunnableResults: true,
    });

    expect(score.status).toBe("failed");
    expect(score.correctnessScore).toBe(0.625);
  });

  it("returns zero for compile or runtime failures without test payloads", () => {
    const score = buildConservativePracticeAttemptScore({
      visible: { total: 2, passed: 0, failed: 2 },
      hidden: { total: 2, passed: 0, failed: 2 },
      hasRunnableResults: false,
    });

    expect(score.status).toBe("failed");
    expect(score.correctnessScore).toBe(0);
  });
});
