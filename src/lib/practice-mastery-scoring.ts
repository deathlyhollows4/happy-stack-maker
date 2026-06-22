import {
  PracticeProblemMasteryBandSchema,
  type PracticeProblemMasteryBand,
} from "@/lib/practice-problem-contract";

export type PracticeMasteryAttemptStatus = "completed" | "failed";

export interface PracticeMasteryProgressSnapshot {
  mastery?: number | null;
  attempts?: number | null;
  lastReviewed?: string | null;
  stability?: number | null;
  difficulty?: number | null;
}

export interface BuildPracticeMasterySignalInput {
  correctnessScore: number;
  status: PracticeMasteryAttemptStatus;
  failedAttemptCount: number;
  hintCount: number;
  reviewQualityScore?: number | null;
  speedSeconds?: number | null;
  masteryBand?: PracticeProblemMasteryBand | string | null;
  previousProgress?: PracticeMasteryProgressSnapshot | null;
  now?: Date;
}

export interface BuildPracticeMasteryProgressUpdateInput extends BuildPracticeMasterySignalInput {
  masteryDeltaMultiplier?: number;
}

export interface PracticeMasterySignalComponents {
  correctness: number;
  attempts: number;
  hints: number;
  reviewQuality: number;
  repeatPerformance: number;
  speed: number;
}

export interface PracticeMasterySignal {
  status: PracticeMasteryAttemptStatus;
  masteryBand: PracticeProblemMasteryBand | null;
  signalScore: number;
  delta: number;
  previousMastery: number;
  nextMastery: number;
  failedAttemptCount: number;
  components: PracticeMasterySignalComponents;
}

export interface PracticeMasteryProgressUpdate {
  mastery: number;
  attempts: number;
  last_reviewed: string;
  stability: number;
  difficulty: number;
  retrievability: number;
  next_review_date: string;
}

export interface PracticeMasteryProgressResult {
  signal: PracticeMasterySignal;
  update: PracticeMasteryProgressUpdate;
}

const MASTERY_SIGNAL_WEIGHTS: PracticeMasterySignalComponents = {
  correctness: 0.58,
  attempts: 0.12,
  hints: 0.1,
  reviewQuality: 0.1,
  repeatPerformance: 0.07,
  speed: 0.03,
};

const MASTERY_BAND_GAIN_CAP: Record<PracticeProblemMasteryBand, number> = {
  "0-20": 0.08,
  "21-40": 0.07,
  "41-60": 0.06,
  "61-80": 0.05,
  "81-100": 0.035,
};

const DAY_MS = 86_400_000;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function clamp01(value: number) {
  return clamp(value, 0, 1);
}

function roundScore(value: number) {
  return Math.round(value * 10_000) / 10_000;
}

function normalizeMasteryBand(masteryBand: PracticeProblemMasteryBand | string | null | undefined) {
  const parsed = PracticeProblemMasteryBandSchema.safeParse(masteryBand);
  return parsed.success ? parsed.data : null;
}

function normalizeFailedAttemptCount(failedAttemptCount: number) {
  return Math.max(0, Math.floor(Number.isFinite(failedAttemptCount) ? failedAttemptCount : 0));
}

function scoreFailedAttemptCount(failedAttemptCount: number) {
  const normalized = normalizeFailedAttemptCount(failedAttemptCount);
  if (normalized === 0) return 1;
  if (normalized === 1) return 0.82;
  if (normalized === 2) return 0.66;
  if (normalized === 3) return 0.52;
  return 0.38;
}

function scoreHintUsage(hintCount: number) {
  const normalized = clamp(Math.floor(Number.isFinite(hintCount) ? hintCount : 0), 0, 5);
  return roundScore(Math.max(0.25, 1 - normalized * 0.16));
}

function scoreReviewQuality(reviewQualityScore: number | null | undefined) {
  if (reviewQualityScore === null || reviewQualityScore === undefined) return 0.55;
  return clamp01(reviewQualityScore);
}

function scoreSpeed(speedSeconds: number | null | undefined) {
  if (speedSeconds === null || speedSeconds === undefined) return 0.6;
  if (!Number.isFinite(speedSeconds) || speedSeconds < 0) return 0.6;
  if (speedSeconds <= 30) return 0.65;
  if (speedSeconds <= 45 * 60) return 0.75;
  if (speedSeconds <= 90 * 60) return 0.65;
  return 0.55;
}

function daysSinceLastReview(lastReviewed: string | null | undefined, now: Date): number | null {
  if (!lastReviewed) return null;
  const reviewedAt = Date.parse(lastReviewed);
  if (!Number.isFinite(reviewedAt)) return null;
  return Math.max(0, (now.getTime() - reviewedAt) / DAY_MS);
}

function scoreRepeatPerformance(input: BuildPracticeMasterySignalInput, now: Date) {
  const attempts = input.previousProgress?.attempts ?? 0;
  const elapsedDays = daysSinceLastReview(input.previousProgress?.lastReviewed, now);
  if (!attempts || elapsedDays === null) return 0.55;

  if (input.status === "completed") {
    if (elapsedDays >= 3) return 1;
    if (elapsedDays >= 1) return 0.8;
    return 0.55;
  }

  if (elapsedDays >= 1) return 0.25;
  return 0.35;
}

function getGainCap(masteryBand: PracticeProblemMasteryBand | null) {
  return masteryBand ? MASTERY_BAND_GAIN_CAP[masteryBand] : MASTERY_BAND_GAIN_CAP["0-20"];
}

function buildWeightedSignal(components: PracticeMasterySignalComponents) {
  return roundScore(
    components.correctness * MASTERY_SIGNAL_WEIGHTS.correctness +
      components.attempts * MASTERY_SIGNAL_WEIGHTS.attempts +
      components.hints * MASTERY_SIGNAL_WEIGHTS.hints +
      components.reviewQuality * MASTERY_SIGNAL_WEIGHTS.reviewQuality +
      components.repeatPerformance * MASTERY_SIGNAL_WEIGHTS.repeatPerformance +
      components.speed * MASTERY_SIGNAL_WEIGHTS.speed,
  );
}

function buildMasteryDelta(input: {
  status: PracticeMasteryAttemptStatus;
  correctnessScore: number;
  signalScore: number;
  masteryBand: PracticeProblemMasteryBand | null;
}) {
  if (input.status === "completed") {
    const gainCap = getGainCap(input.masteryBand);
    return roundScore(gainCap * (0.35 + input.signalScore * 0.65));
  }

  if (input.correctnessScore >= 0.5) return 0;
  return -roundScore(Math.min(0.03, 0.005 + (0.5 - input.correctnessScore) * 0.05));
}

function normalizeMasteryDeltaMultiplier(multiplier: number | null | undefined) {
  if (multiplier === null || multiplier === undefined) return 1;
  if (!Number.isFinite(multiplier)) return 1;
  return clamp(multiplier, 0, 1);
}

function scalePracticeMasterySignal(
  signal: PracticeMasterySignal,
  masteryDeltaMultiplier: number | null | undefined,
): PracticeMasterySignal {
  const multiplier = normalizeMasteryDeltaMultiplier(masteryDeltaMultiplier);
  if (multiplier === 1) return signal;

  const delta = roundScore(signal.delta * multiplier);
  return {
    ...signal,
    delta,
    nextMastery: roundScore(clamp01(signal.previousMastery + delta)),
  };
}

function buildStability(input: BuildPracticeMasterySignalInput, signal: PracticeMasterySignal) {
  const previousStability = input.previousProgress?.stability ?? 2.5;
  if (input.status === "completed") {
    return roundScore(clamp(previousStability + 0.35 + signal.signalScore, 1, 30));
  }

  return roundScore(clamp(previousStability * 0.82, 0.5, 30));
}

function buildDifficulty(input: BuildPracticeMasterySignalInput, signal: PracticeMasterySignal) {
  const previousDifficulty = input.previousProgress?.difficulty ?? 5;
  const hintPenalty = Math.min(input.hintCount, 5) * 0.08;
  if (input.status === "completed") {
    return roundScore(clamp(previousDifficulty - signal.signalScore * 0.45 + hintPenalty, 1, 10));
  }

  return roundScore(clamp(previousDifficulty + 0.35 + (1 - signal.signalScore) * 0.35, 1, 10));
}

function buildRetrievability(
  input: BuildPracticeMasterySignalInput,
  signal: PracticeMasterySignal,
) {
  if (input.status === "completed") {
    return roundScore(clamp(0.72 + signal.signalScore * 0.2, 0, 0.95));
  }

  return roundScore(clamp(0.35 + signal.components.correctness * 0.35, 0, 0.8));
}

export function buildPracticeMasterySignal(
  input: BuildPracticeMasterySignalInput,
): PracticeMasterySignal {
  const now = input.now ?? new Date();
  const masteryBand = normalizeMasteryBand(input.masteryBand);
  const previousMastery = clamp01(input.previousProgress?.mastery ?? 0);
  const correctnessScore = clamp01(input.correctnessScore);
  const failedAttemptCount = normalizeFailedAttemptCount(input.failedAttemptCount);
  const components: PracticeMasterySignalComponents = {
    correctness: correctnessScore,
    attempts: scoreFailedAttemptCount(failedAttemptCount),
    hints: scoreHintUsage(input.hintCount),
    reviewQuality: scoreReviewQuality(input.reviewQualityScore),
    repeatPerformance: scoreRepeatPerformance(input, now),
    speed: scoreSpeed(input.speedSeconds),
  };
  const signalScore = buildWeightedSignal(components);
  const delta = buildMasteryDelta({
    status: input.status,
    correctnessScore,
    signalScore,
    masteryBand,
  });

  return {
    status: input.status,
    masteryBand,
    signalScore,
    delta,
    previousMastery: roundScore(previousMastery),
    nextMastery: roundScore(clamp01(previousMastery + delta)),
    failedAttemptCount,
    components,
  };
}

export function buildPracticeMasteryProgressUpdate(
  input: BuildPracticeMasteryProgressUpdateInput,
): PracticeMasteryProgressResult {
  const now = input.now ?? new Date();
  const signal = scalePracticeMasterySignal(
    buildPracticeMasterySignal({ ...input, now }),
    input.masteryDeltaMultiplier,
  );
  const stability = buildStability(input, signal);
  const difficulty = buildDifficulty(input, signal);
  const intervalDays = input.status === "completed" ? Math.max(1, Math.round(stability)) : 1;
  const nextReview = new Date(now.getTime() + intervalDays * DAY_MS);

  return {
    signal,
    update: {
      mastery: signal.nextMastery,
      attempts: Math.max(0, input.previousProgress?.attempts ?? 0) + 1,
      last_reviewed: now.toISOString(),
      stability,
      difficulty,
      retrievability: buildRetrievability(input, signal),
      next_review_date: nextReview.toISOString(),
    },
  };
}
