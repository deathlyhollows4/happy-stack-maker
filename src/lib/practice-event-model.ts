import { z } from "zod";
import {
  PracticeProblemMasteryBandSchema,
  type PracticeProblemHint,
} from "@/lib/practice-problem-contract";
import type { PracticeProblemView } from "@/lib/practice-problem-view";

export const PRACTICE_HINT_REVEALED_EVENT = "practice_hint_revealed";

export const PracticeEventTypeSchema = z.enum([PRACTICE_HINT_REVEALED_EVENT]);

export const RecordPracticeEventInputSchema = z
  .object({
    eventType: PracticeEventTypeSchema,
    practiceProblemId: z.string().uuid().nullable().optional(),
    practiceAttemptId: z.string().uuid().nullable().optional(),
    topicSlug: z.string().trim().min(1).max(120).nullable().optional(),
    curriculumNodeId: z.string().trim().min(1).max(120).nullable().optional(),
    masteryBand: PracticeProblemMasteryBandSchema.nullable().optional(),
    payload: z.record(z.unknown()).default({}),
  })
  .strict();

export type RecordPracticeEventInput = z.infer<typeof RecordPracticeEventInputSchema>;

export interface PracticeHintRevealState {
  revealedHintOrders: number[];
  shouldRecord: boolean;
}

export function markPracticeHintRevealed(
  currentOrders: readonly number[],
  order: number,
): PracticeHintRevealState {
  if (currentOrders.includes(order)) {
    return {
      revealedHintOrders: [...currentOrders],
      shouldRecord: false,
    };
  }

  return {
    revealedHintOrders: [...currentOrders, order].sort((a, b) => a - b),
    shouldRecord: true,
  };
}

export function buildPracticeHintUsageEvent(input: {
  practiceProblemId: string;
  topicSlug: string | null;
  view: PracticeProblemView;
  hint: PracticeProblemHint;
  revealedHintOrders: readonly number[];
}): RecordPracticeEventInput {
  const revealState = markPracticeHintRevealed(input.revealedHintOrders, input.hint.order);

  return {
    eventType: PRACTICE_HINT_REVEALED_EVENT,
    practiceProblemId: input.practiceProblemId,
    topicSlug: input.topicSlug,
    curriculumNodeId: input.view.curriculumNodeId,
    masteryBand: input.view.masteryBand,
    payload: {
      hintOrder: input.hint.order,
      hintTitle: input.hint.title,
      revealedHintCount: revealState.revealedHintOrders.length,
      totalHintCount: input.view.hintLadder.length,
    },
  };
}
