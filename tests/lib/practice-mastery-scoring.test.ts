import { describe, expect, it } from "vitest";
import {
  buildPracticeMasteryProgressUpdate,
  buildPracticeMasterySignal,
} from "@/lib/practice-mastery-scoring";

const NOW = new Date("2026-06-23T10:00:00.000Z");

describe("buildPracticeMasterySignal", () => {
  it("builds a strong beginner gain from correct first-attempt work", () => {
    const signal = buildPracticeMasterySignal({
      correctnessScore: 1,
      status: "completed",
      failedAttemptCount: 0,
      hintCount: 0,
      reviewQualityScore: 1,
      speedSeconds: 600,
      masteryBand: "0-20",
      previousProgress: { mastery: 0.1, attempts: 0 },
      now: NOW,
    });

    expect(signal.components).toEqual({
      correctness: 1,
      attempts: 1,
      hints: 1,
      reviewQuality: 1,
      repeatPerformance: 0.55,
      speed: 0.75,
    });
    expect(signal.signalScore).toBe(0.961);
    expect(signal.delta).toBe(0.078);
    expect(signal.nextMastery).toBe(0.178);
  });

  it("reduces mastery gain for repeated attempts and hint-heavy submissions", () => {
    const firstTry = buildPracticeMasterySignal({
      correctnessScore: 1,
      status: "completed",
      failedAttemptCount: 0,
      hintCount: 0,
      reviewQualityScore: 1,
      speedSeconds: 600,
      masteryBand: "21-40",
      previousProgress: { mastery: 0.3, attempts: 2 },
      now: NOW,
    });
    const assistedRetry = buildPracticeMasterySignal({
      correctnessScore: 1,
      status: "completed",
      failedAttemptCount: 3,
      hintCount: 3,
      reviewQualityScore: null,
      speedSeconds: 600,
      masteryBand: "21-40",
      previousProgress: { mastery: 0.3, attempts: 2 },
      now: NOW,
    });

    expect(assistedRetry.components.attempts).toBeLessThan(firstTry.components.attempts);
    expect(assistedRetry.components.hints).toBeLessThan(firstTry.components.hints);
    expect(assistedRetry.delta).toBeLessThan(firstTry.delta);
  });

  it("keeps speed as a secondary signal", () => {
    const normalPace = buildPracticeMasterySignal({
      correctnessScore: 0.9,
      status: "completed",
      failedAttemptCount: 1,
      hintCount: 1,
      reviewQualityScore: 0.5,
      speedSeconds: 20 * 60,
      masteryBand: "41-60",
      previousProgress: { mastery: 0.45, attempts: 3 },
      now: NOW,
    });
    const slowPace = buildPracticeMasterySignal({
      correctnessScore: 0.9,
      status: "completed",
      failedAttemptCount: 1,
      hintCount: 1,
      reviewQualityScore: 0.5,
      speedSeconds: 2 * 60 * 60,
      masteryBand: "41-60",
      previousProgress: { mastery: 0.45, attempts: 3 },
      now: NOW,
    });

    expect(normalPace.signalScore - slowPace.signalScore).toBeLessThanOrEqual(0.01);
    expect(normalPace.delta - slowPace.delta).toBeLessThanOrEqual(0.001);
  });

  it("confirms retention when repeat performance is spaced out", () => {
    const sameDay = buildPracticeMasterySignal({
      correctnessScore: 0.92,
      status: "completed",
      failedAttemptCount: 1,
      hintCount: 1,
      reviewQualityScore: 1,
      speedSeconds: 900,
      masteryBand: "41-60",
      previousProgress: {
        mastery: 0.44,
        attempts: 4,
        lastReviewed: "2026-06-23T08:00:00.000Z",
      },
      now: NOW,
    });
    const spaced = buildPracticeMasterySignal({
      correctnessScore: 0.92,
      status: "completed",
      failedAttemptCount: 1,
      hintCount: 1,
      reviewQualityScore: 1,
      speedSeconds: 900,
      masteryBand: "41-60",
      previousProgress: {
        mastery: 0.44,
        attempts: 4,
        lastReviewed: "2026-06-19T10:00:00.000Z",
      },
      now: NOW,
    });

    expect(sameDay.components.repeatPerformance).toBe(0.55);
    expect(spaced.components.repeatPerformance).toBe(1);
    expect(spaced.delta).toBeGreaterThan(sameDay.delta);
  });

  it("scores failed attempts conservatively without erasing beginner progress", () => {
    const signal = buildPracticeMasterySignal({
      correctnessScore: 0.25,
      status: "failed",
      failedAttemptCount: 2,
      hintCount: 2,
      reviewQualityScore: 0,
      speedSeconds: 1800,
      masteryBand: "0-20",
      previousProgress: { mastery: 0.3, attempts: 1 },
      now: NOW,
    });

    expect(signal.delta).toBe(-0.0175);
    expect(signal.nextMastery).toBe(0.2825);
  });

  it("does not penalize near-pass visible failures", () => {
    const signal = buildPracticeMasterySignal({
      correctnessScore: 0.5,
      status: "failed",
      failedAttemptCount: 1,
      hintCount: 0,
      reviewQualityScore: null,
      speedSeconds: null,
      masteryBand: "0-20",
      previousProgress: { mastery: 0.12, attempts: 0 },
      now: NOW,
    });

    expect(signal.delta).toBe(0);
    expect(signal.nextMastery).toBe(0.12);
  });
});

describe("buildPracticeMasteryProgressUpdate", () => {
  it("returns progress columns with attempts and review scheduling", () => {
    const result = buildPracticeMasteryProgressUpdate({
      correctnessScore: 1,
      status: "completed",
      failedAttemptCount: 0,
      hintCount: 0,
      reviewQualityScore: 1,
      speedSeconds: 600,
      masteryBand: "0-20",
      previousProgress: {
        mastery: 0.1,
        attempts: 2,
        stability: 2.5,
        difficulty: 5,
      },
      now: NOW,
    });

    expect(result.update.attempts).toBe(3);
    expect(result.update.mastery).toBe(result.signal.nextMastery);
    expect(result.update.last_reviewed).toBe("2026-06-23T10:00:00.000Z");
    expect(result.update.next_review_date).toBe("2026-06-27T10:00:00.000Z");
    expect(result.update.stability).toBe(3.811);
    expect(result.update.difficulty).toBe(4.5676);
    expect(result.update.retrievability).toBe(0.9122);
  });
});
