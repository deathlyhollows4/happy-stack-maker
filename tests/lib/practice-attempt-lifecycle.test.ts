import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import {
  buildPracticeAttemptLifecycleTestExecution,
  runPracticeAttemptLifecycle,
} from "@/lib/practice-attempt-lifecycle.server";
import type { updatePracticeMasteryProgress } from "@/lib/practice-mastery-progress.server";

const problemId = "22222222-2222-4222-8222-222222222222";
const userId = "11111111-1111-4111-8111-111111111111";

const problemRow = {
  id: problemId,
  topic_slug: "arrays",
  curriculum_node_id: "arrays-counting-001",
  mastery_band: "0-20",
  function_signature: {
    functionName: "count_positive",
    parameters: [{ name: "nums", type: "number[]" }],
    returnType: "number",
    languageSignatures: [
      {
        language: "python",
        signature: "def count_positive(nums: list[int]) -> int:",
        callableName: "count_positive",
        starterCode: "def count_positive(nums):\n    return 0\n",
      },
    ],
  },
  visible_tests: [
    {
      id: "visible-1",
      name: "counts positives",
      arguments: [[-1, 2]],
      expected: 1,
      theme: "mixed values",
      comparator: "deepEqual",
      visibility: "visible",
    },
  ],
};

const hiddenRow = {
  hidden_tests: [
    {
      id: "hidden-1",
      name: "all negatives",
      arguments: [[-3, -2]],
      expected: 0,
      theme: "all non-positive values",
      comparator: "deepEqual",
      visibility: "hidden",
    },
  ],
};

function masteryResult(): Awaited<ReturnType<typeof updatePracticeMasteryProgress>> {
  return {
    ok: true,
    skipped: false,
    topicSlug: "arrays",
    result: {
      signal: {
        previousMastery: 0.2,
        nextMastery: 0.34,
        delta: 0.14,
        signalScore: 0.9,
        failedAttemptCount: 0,
      },
      update: {
        mastery: 0.34,
        attempts: 3,
        last_reviewed: "2026-06-25T00:00:00.000Z",
        next_review_date: "2026-06-26T00:00:00.000Z",
        retrievability: 0.8,
        difficulty: 2,
        stability: 3,
      },
    },
    prerequisiteUpdates: [
      {
        topicSlug: "loops",
        scope: "prerequisite",
        result: {
          signal: {
            previousMastery: 0.4,
            nextMastery: 0.45,
            delta: 0.05,
            signalScore: 0.9,
            failedAttemptCount: 0,
          },
          update: {
            mastery: 0.45,
            attempts: 2,
            last_reviewed: "2026-06-25T00:00:00.000Z",
            next_review_date: "2026-06-26T00:00:00.000Z",
            retrievability: 0.85,
            difficulty: 2,
            stability: 3,
          },
        },
      },
    ],
    prerequisiteErrors: [],
  };
}

function createClientDouble(input: {
  problem?: typeof problemRow | null;
  hidden?: typeof hiddenRow | null;
  previousFailedCount?: number;
  attemptInsertError?: unknown;
}) {
  const inserts: Record<string, unknown[]> = {
    practice_attempts: [],
  };

  class QueryDouble {
    private selectOptions: unknown = null;

    constructor(private table: string) {}

    select(_columns: string, options?: unknown) {
      this.selectOptions = options ?? null;
      return this;
    }

    eq() {
      return this;
    }

    insert(payload: unknown) {
      inserts[this.table] = [...(inserts[this.table] ?? []), payload];
      return this;
    }

    single() {
      if (this.table === "practice_problems") {
        return Promise.resolve({
          data: input.problem ?? null,
          error: input.problem === null ? { message: "not found" } : null,
        });
      }

      if (this.table === "practice_attempts") {
        return Promise.resolve({
          data: input.attemptInsertError ? null : { id: "attempt-1" },
          error: input.attemptInsertError ?? null,
        });
      }

      return Promise.resolve({ data: null, error: null });
    }

    maybeSingle() {
      if (this.table === "practice_problem_hidden_tests") {
        return Promise.resolve({ data: input.hidden ?? null, error: null });
      }

      return Promise.resolve({ data: null, error: null });
    }

    then(resolve: (value: unknown) => void) {
      if (this.table === "practice_attempts" && this.selectOptions) {
        resolve({ count: input.previousFailedCount ?? 0, error: null });
        return;
      }

      resolve({ data: null, error: null });
    }
  }

  return {
    inserts,
    client: {
      from(table: string) {
        return new QueryDouble(table);
      },
    } as unknown as SupabaseClient<Database>,
  };
}

describe("practice attempt lifecycle", () => {
  it("runs the full lifecycle and returns mastery update output", async () => {
    const primaryClient = createClientDouble({
      problem: problemRow,
      hidden: null,
      previousFailedCount: 0,
    });
    const hiddenClient = createClientDouble({
      hidden: hiddenRow,
    });
    const insertEvents = vi.fn().mockResolvedValue({ ok: true });
    const updateMasteryProgress = vi.fn().mockResolvedValue(masteryResult());

    const result = await runPracticeAttemptLifecycle({
      supabase: primaryClient.client,
      hiddenTestClient: hiddenClient.client,
      userId,
      practiceProblemId: problemId,
      code: "def count_positive(nums):\n    return sum(1 for n in nums if n > 0)",
      language: "python",
      hintCount: 1,
      startedAt: "2026-06-25T00:00:00.000Z",
      now: new Date("2026-06-25T00:05:00.000Z"),
      reviewQuality: {
        complexityExplanation: "The solution scans the list once.",
        edgeCaseExplanation: "It handles empty input and zeros.",
      },
      executeTests: vi.fn().mockResolvedValue(
        buildPracticeAttemptLifecycleTestExecution([
          {
            id: "visible-1",
            name: "counts positives",
            visibility: "visible",
            passed: true,
            expected: 1,
            actual: 1,
          },
          {
            id: "hidden-1",
            name: "all negatives",
            visibility: "hidden",
            passed: true,
            expected: 0,
            actual: 0,
          },
        ]),
      ),
      insertEvents,
      updateMasteryProgress,
    });

    expect(result).toMatchObject({
      ok: true,
      attemptId: "attempt-1",
      status: "completed",
      visibleSummary: { total: 1, passed: 1, failed: 0 },
      hiddenSummary: { total: 1, passed: 1, failed: 0 },
      speedSeconds: 300,
      masteryUpdate: {
        topicSlug: "arrays",
        previousMastery: 0.2,
        nextMastery: 0.34,
        prerequisiteUpdates: [{ topicSlug: "loops", nextMastery: 0.45 }],
      },
    });
    expect(primaryClient.inserts.practice_attempts[0]).toMatchObject({
      user_id: userId,
      status: "completed",
      visible_tests_passed: 1,
      hidden_tests_passed: 1,
      review_quality_score: 1,
    });
    expect(insertEvents).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        events: expect.arrayContaining([
          expect.objectContaining({ eventType: "practice_hidden_tests_checked" }),
          expect.objectContaining({ eventType: "practice_attempt_submitted" }),
          expect.objectContaining({ eventType: "practice_review_quality_recorded" }),
          expect.objectContaining({ eventType: "practice_problem_completed" }),
        ]),
      }),
    );
    expect(updateMasteryProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        topicSlug: "arrays",
        curriculumNodeId: "arrays-counting-001",
        failedAttemptCount: 0,
      }),
    );
  });

  it("uses a no-hidden-test fallback without blocking completion", async () => {
    const primaryClient = createClientDouble({
      problem: problemRow,
      hidden: null,
    });
    const updateMasteryProgress = vi.fn().mockResolvedValue(masteryResult());

    const result = await runPracticeAttemptLifecycle({
      supabase: primaryClient.client,
      hiddenTestClient: createClientDouble({ hidden: null }).client,
      userId,
      practiceProblemId: problemId,
      code: "def count_positive(nums):\n    return 1",
      language: "python",
      hintCount: 0,
      executeTests: vi.fn().mockResolvedValue(
        buildPracticeAttemptLifecycleTestExecution([
          {
            id: "visible-1",
            name: "counts positives",
            visibility: "visible",
            passed: true,
            expected: 1,
            actual: 1,
          },
        ]),
      ),
      insertEvents: vi.fn().mockResolvedValue({ ok: true }),
      updateMasteryProgress,
    });

    expect(result).toMatchObject({
      ok: true,
      status: "completed",
      hiddenSummary: { total: 0, passed: 0, failed: 0 },
      correctnessScore: 1,
    });
  });

  it("returns execution service failures before writing attempts", async () => {
    const primaryClient = createClientDouble({
      problem: problemRow,
      hidden: null,
    });
    const insertEvents = vi.fn();
    const updateMasteryProgress = vi.fn();

    const result = await runPracticeAttemptLifecycle({
      supabase: primaryClient.client,
      hiddenTestClient: createClientDouble({ hidden: hiddenRow }).client,
      userId,
      practiceProblemId: problemId,
      code: "bad",
      language: "python",
      hintCount: 0,
      executeTests: vi.fn().mockResolvedValue({
        ok: false,
        error: "Code execution service temporarily unavailable. Try again.",
      }),
      insertEvents,
      updateMasteryProgress,
    });

    expect(result).toEqual({
      ok: false,
      error: "Code execution service temporarily unavailable. Try again.",
    });
    expect(primaryClient.inserts.practice_attempts).toEqual([]);
    expect(insertEvents).not.toHaveBeenCalled();
    expect(updateMasteryProgress).not.toHaveBeenCalled();
  });

  it("counts repeated failed attempts in mastery writes", async () => {
    const primaryClient = createClientDouble({
      problem: problemRow,
      hidden: null,
      previousFailedCount: 2,
    });
    const updateMasteryProgress = vi.fn().mockResolvedValue(masteryResult());

    await runPracticeAttemptLifecycle({
      supabase: primaryClient.client,
      hiddenTestClient: createClientDouble({ hidden: null }).client,
      userId,
      practiceProblemId: problemId,
      code: "def count_positive(nums):\n    return 0",
      language: "python",
      hintCount: 0,
      executeTests: vi.fn().mockResolvedValue(
        buildPracticeAttemptLifecycleTestExecution([
          {
            id: "visible-1",
            name: "counts positives",
            visibility: "visible",
            passed: false,
            expected: 1,
            actual: 0,
          },
        ]),
      ),
      insertEvents: vi.fn().mockResolvedValue({ ok: true }),
      updateMasteryProgress,
    });

    expect(updateMasteryProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "failed",
        failedAttemptCount: 3,
      }),
    );
  });
});
