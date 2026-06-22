import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import type { Database } from "@/integrations/supabase/types";
import { updatePracticeMasteryProgress } from "@/lib/practice-mastery-progress.server";

type ProgressRow = Pick<
  Database["public"]["Tables"]["progress"]["Row"],
  "mastery" | "attempts" | "last_reviewed" | "stability" | "difficulty"
>;

type ProgressUpsert = Database["public"]["Tables"]["progress"]["Insert"];

const NOW = new Date("2026-06-23T10:00:00.000Z");

function createProgressClient(initialRows: Record<string, ProgressRow | undefined>) {
  const rows = new Map<string, ProgressRow>();
  const upserts: ProgressUpsert[] = [];

  for (const [topicSlug, row] of Object.entries(initialRows)) {
    if (row) rows.set(topicSlug, row);
  }

  const client = {
    from(tableName: string) {
      expect(tableName).toBe("progress");
      return {
        select() {
          const filters: { topicSlug?: string } = {};
          const query = {
            eq(column: string, value: string) {
              if (column === "topic_slug") filters.topicSlug = value;
              return query;
            },
            async maybeSingle() {
              return {
                data: filters.topicSlug ? (rows.get(filters.topicSlug) ?? null) : null,
                error: null,
              };
            },
          };

          return query;
        },
        async upsert(payload: ProgressUpsert) {
          upserts.push(payload);
          rows.set(payload.topic_slug, {
            mastery: payload.mastery ?? 0,
            attempts: payload.attempts ?? 0,
            last_reviewed: payload.last_reviewed ?? NOW.toISOString(),
            stability: payload.stability ?? null,
            difficulty: payload.difficulty ?? null,
          });

          return { error: null };
        },
      };
    },
  } as unknown as SupabaseClient<Database>;

  return { client, upserts };
}

function baseInput(supabase: SupabaseClient<Database>) {
  return {
    supabase,
    userId: "user-1",
    topicSlug: "arrays",
    correctnessScore: 1,
    status: "completed" as const,
    failedAttemptCount: 0,
    hintCount: 0,
    reviewQualityScore: 1,
    speedSeconds: 600,
    masteryBand: "21-40",
    now: NOW,
  };
}

describe("updatePracticeMasteryProgress", () => {
  it("updates the primary topic when no prerequisite scope is present", async () => {
    const { client, upserts } = createProgressClient({
      arrays: {
        mastery: 0.2,
        attempts: 1,
        last_reviewed: "2026-06-20T10:00:00.000Z",
        stability: 2.5,
        difficulty: 5,
      },
    });

    const result = await updatePracticeMasteryProgress(baseInput(client));

    expect(result.ok).toBe(true);
    expect(result.skipped).toBe(false);
    if (!result.ok || result.skipped) return;
    expect(result.topicSlug).toBe("arrays");
    expect(result.result.signal.nextMastery).toBeGreaterThan(0.2);
    expect(result.prerequisiteUpdates).toEqual([]);
    expect(upserts).toHaveLength(1);
    expect(upserts[0]).toMatchObject({ topic_slug: "arrays", attempts: 2 });
  });

  it("writes smaller prerequisite topic updates from the same derived score", async () => {
    const { client, upserts } = createProgressClient({
      arrays: {
        mastery: 0.2,
        attempts: 1,
        last_reviewed: "2026-06-20T10:00:00.000Z",
        stability: 2.5,
        difficulty: 5,
      },
      complexity: {
        mastery: 0.2,
        attempts: 1,
        last_reviewed: "2026-06-20T10:00:00.000Z",
        stability: 2.5,
        difficulty: 5,
      },
    });

    const result = await updatePracticeMasteryProgress({
      ...baseInput(client),
      curriculumNodeId: "arrays-basics",
    });

    expect(result.ok).toBe(true);
    expect(result.skipped).toBe(false);
    if (!result.ok || result.skipped) return;
    expect(result.prerequisiteUpdates).toHaveLength(1);
    expect(result.prerequisiteUpdates[0].topicSlug).toBe("complexity");
    expect(result.prerequisiteUpdates[0].result.signal.delta).toBeLessThan(
      result.result.signal.delta,
    );
    expect(result.prerequisiteUpdates[0].result.signal.signalScore).toBe(
      result.result.signal.signalScore,
    );
    expect(upserts.map((row) => row.topic_slug)).toEqual(["arrays", "complexity"]);
  });

  it("creates a conservative prerequisite row when prerequisite progress is missing", async () => {
    const { client, upserts } = createProgressClient({
      arrays: {
        mastery: 0.25,
        attempts: 2,
        last_reviewed: "2026-06-20T10:00:00.000Z",
        stability: 2.5,
        difficulty: 5,
      },
    });

    const result = await updatePracticeMasteryProgress({
      ...baseInput(client),
      curriculumNodeId: "arrays-basics",
    });

    expect(result.ok).toBe(true);
    expect(result.skipped).toBe(false);
    if (!result.ok || result.skipped) return;
    const prerequisiteUpsert = upserts.find((row) => row.topic_slug === "complexity");
    expect(prerequisiteUpsert).toMatchObject({
      topic_slug: "complexity",
      attempts: 1,
      user_id: "user-1",
    });
    expect(prerequisiteUpsert?.mastery).toBe(result.prerequisiteUpdates[0].result.signal.delta);
  });

  it("reduces gains for repeated failed attempts while incrementing all touched rows", async () => {
    const firstTryClient = createProgressClient({
      arrays: {
        mastery: 0.2,
        attempts: 4,
        last_reviewed: "2026-06-20T10:00:00.000Z",
        stability: 2.5,
        difficulty: 5,
      },
    });
    const repeatedClient = createProgressClient({
      arrays: {
        mastery: 0.2,
        attempts: 4,
        last_reviewed: "2026-06-20T10:00:00.000Z",
        stability: 2.5,
        difficulty: 5,
      },
      complexity: {
        mastery: 0.2,
        attempts: 2,
        last_reviewed: "2026-06-20T10:00:00.000Z",
        stability: 2.5,
        difficulty: 5,
      },
    });

    const firstTry = await updatePracticeMasteryProgress(baseInput(firstTryClient.client));
    const repeated = await updatePracticeMasteryProgress({
      ...baseInput(repeatedClient.client),
      curriculumNodeId: "arrays-basics",
      failedAttemptCount: 3,
      hintCount: 2,
    });

    expect(firstTry.ok).toBe(true);
    expect(repeated.ok).toBe(true);
    if (!firstTry.ok || firstTry.skipped || !repeated.ok || repeated.skipped) return;
    expect(repeated.result.signal.delta).toBeLessThan(firstTry.result.signal.delta);
    expect(repeated.result.signal.failedAttemptCount).toBe(3);
    expect(repeated.result.signal.components.attempts).toBeLessThan(
      firstTry.result.signal.components.attempts,
    );
    expect(repeatedClient.upserts).toHaveLength(2);
    expect(repeatedClient.upserts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ topic_slug: "arrays", attempts: 5 }),
        expect.objectContaining({ topic_slug: "complexity", attempts: 3 }),
      ]),
    );
  });

  it("confirms spaced review retention through stored progress rows", async () => {
    const sameDayClient = createProgressClient({
      arrays: {
        mastery: 0.42,
        attempts: 4,
        last_reviewed: "2026-06-23T08:00:00.000Z",
        stability: 2.5,
        difficulty: 5,
      },
    });
    const spacedClient = createProgressClient({
      arrays: {
        mastery: 0.42,
        attempts: 4,
        last_reviewed: "2026-06-19T10:00:00.000Z",
        stability: 2.5,
        difficulty: 5,
      },
    });

    const sameDay = await updatePracticeMasteryProgress({
      ...baseInput(sameDayClient.client),
      masteryBand: "41-60",
      correctnessScore: 0.92,
      failedAttemptCount: 1,
      hintCount: 1,
      reviewQualityScore: 1,
      speedSeconds: 900,
    });
    const spaced = await updatePracticeMasteryProgress({
      ...baseInput(spacedClient.client),
      masteryBand: "41-60",
      correctnessScore: 0.92,
      failedAttemptCount: 1,
      hintCount: 1,
      reviewQualityScore: 1,
      speedSeconds: 900,
    });

    expect(sameDay.ok).toBe(true);
    expect(spaced.ok).toBe(true);
    if (!sameDay.ok || sameDay.skipped || !spaced.ok || spaced.skipped) return;
    expect(sameDay.result.signal.components.repeatPerformance).toBe(0.55);
    expect(spaced.result.signal.components.repeatPerformance).toBe(1);
    expect(spaced.result.signal.delta).toBeGreaterThan(sameDay.result.signal.delta);
    expect(spaced.result.update.stability).toBeGreaterThan(sameDay.result.update.stability);
    expect(Date.parse(spaced.result.update.next_review_date)).toBeGreaterThanOrEqual(
      Date.parse(sameDay.result.update.next_review_date),
    );
    expect(spacedClient.upserts[0]).toMatchObject({
      topic_slug: "arrays",
      attempts: 5,
      mastery: spaced.result.signal.nextMastery,
    });
  });
});
