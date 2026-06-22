import { describe, expect, it } from "vitest";
import {
  PRACTICE_HINT_REVEALED_EVENT,
  RecordPracticeEventInputSchema,
  buildPracticeHintUsageEvent,
  markPracticeHintRevealed,
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
