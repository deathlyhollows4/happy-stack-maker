import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { getCurriculumNodeById, type CurriculumNode } from "@/lib/dsa-curriculum";
import {
  buildPracticeMasteryProgressUpdate,
  type BuildPracticeMasterySignalInput,
  type BuildPracticeMasteryProgressUpdateInput,
  type PracticeMasteryProgressResult,
  type PracticeMasteryProgressSnapshot,
} from "@/lib/practice-mastery-scoring";
import { normalizeTopicSlug, type TopicSlug } from "@/lib/topics";

type ProgressRow = Pick<
  Database["public"]["Tables"]["progress"]["Row"],
  "mastery" | "attempts" | "last_reviewed" | "stability" | "difficulty"
>;

const PREREQUISITE_MASTERY_DELTA_MULTIPLIER = 0.35;

export interface UpdatePracticeMasteryProgressInput extends Omit<
  BuildPracticeMasterySignalInput,
  "previousProgress"
> {
  supabase: SupabaseClient<Database>;
  userId: string;
  topicSlug: string | null;
  curriculumNodeId?: string | null;
  prerequisiteTopicSlugs?: readonly (string | null | undefined)[];
}

export interface PracticeMasteryTopicProgressUpdate {
  topicSlug: TopicSlug;
  scope: "primary" | "prerequisite";
  result: PracticeMasteryProgressResult;
}

export type UpdatePracticeMasteryProgressResult =
  | {
      ok: true;
      skipped: false;
      topicSlug: TopicSlug;
      result: PracticeMasteryProgressResult;
      prerequisiteUpdates: PracticeMasteryTopicProgressUpdate[];
      prerequisiteErrors: Array<{ topicSlug: TopicSlug; error: string }>;
    }
  | {
      ok: true;
      skipped: true;
      topicSlug: null;
      result: null;
      prerequisiteUpdates: [];
      prerequisiteErrors: [];
    }
  | {
      ok: false;
      skipped: false;
      topicSlug: TopicSlug;
      error: string;
      prerequisiteUpdates: PracticeMasteryTopicProgressUpdate[];
      prerequisiteErrors: Array<{ topicSlug: TopicSlug; error: string }>;
    };

function mapProgressRow(row: ProgressRow | null): PracticeMasteryProgressSnapshot | null {
  if (!row) return null;
  return {
    mastery: row.mastery,
    attempts: row.attempts,
    lastReviewed: row.last_reviewed,
    stability: row.stability,
    difficulty: row.difficulty,
  };
}

function resolveCurriculumPrerequisiteTopics(node: CurriculumNode | null) {
  const topicSlugs = new Set<TopicSlug>();
  if (!node) return topicSlugs;

  for (const topicSlug of node.prerequisiteTopicSlugs) {
    const normalized = normalizeTopicSlug(topicSlug);
    if (normalized) topicSlugs.add(normalized);
  }

  for (const nodeId of node.prerequisiteNodeIds) {
    const prerequisiteNode = getCurriculumNodeById(nodeId);
    const normalized = normalizeTopicSlug(prerequisiteNode?.primaryTopicSlug);
    if (normalized) topicSlugs.add(normalized);
  }

  return topicSlugs;
}

function resolvePrerequisiteTopicSlugs(input: UpdatePracticeMasteryProgressInput) {
  const primaryTopicSlug = normalizeTopicSlug(input.topicSlug);
  const curriculumNode = input.curriculumNodeId
    ? getCurriculumNodeById(input.curriculumNodeId)
    : null;
  const prerequisiteTopicSlugs = resolveCurriculumPrerequisiteTopics(curriculumNode);

  for (const topicSlug of input.prerequisiteTopicSlugs ?? []) {
    const normalized = normalizeTopicSlug(topicSlug);
    if (normalized) prerequisiteTopicSlugs.add(normalized);
  }

  if (primaryTopicSlug) prerequisiteTopicSlugs.delete(primaryTopicSlug);
  return [...prerequisiteTopicSlugs];
}

async function writeTopicProgress(input: {
  supabase: SupabaseClient<Database>;
  userId: string;
  topicSlug: TopicSlug;
  progressInput: BuildPracticeMasteryProgressUpdateInput;
}) {
  const { data: progressRow, error: progressError } = await input.supabase
    .from("progress")
    .select("mastery, attempts, last_reviewed, stability, difficulty")
    .eq("user_id", input.userId)
    .eq("topic_slug", input.topicSlug)
    .maybeSingle();

  if (progressError) {
    console.error("updatePracticeMasteryProgress progress lookup failed:", progressError);
    return {
      ok: false as const,
      error: "Could not load mastery progress.",
      result: null,
    };
  }

  const result = buildPracticeMasteryProgressUpdate({
    ...input.progressInput,
    previousProgress: mapProgressRow(progressRow),
  });

  const { error: upsertError } = await input.supabase.from("progress").upsert(
    {
      user_id: input.userId,
      topic_slug: input.topicSlug,
      ...result.update,
    },
    { onConflict: "user_id,topic_slug" },
  );

  if (upsertError) {
    console.error("updatePracticeMasteryProgress upsert failed:", upsertError);
    return {
      ok: false as const,
      error: "Could not update mastery progress.",
      result: null,
    };
  }

  return {
    ok: true as const,
    error: null,
    result,
  };
}

export async function updatePracticeMasteryProgress(
  input: UpdatePracticeMasteryProgressInput,
): Promise<UpdatePracticeMasteryProgressResult> {
  const primaryTopicSlug = normalizeTopicSlug(input.topicSlug);
  if (!primaryTopicSlug) {
    return {
      ok: true,
      skipped: true,
      topicSlug: null,
      result: null,
      prerequisiteUpdates: [],
      prerequisiteErrors: [],
    };
  }

  const baseProgressInput: BuildPracticeMasterySignalInput = {
    correctnessScore: input.correctnessScore,
    status: input.status,
    failedAttemptCount: input.failedAttemptCount,
    hintCount: input.hintCount,
    reviewQualityScore: input.reviewQualityScore,
    speedSeconds: input.speedSeconds,
    masteryBand: input.masteryBand,
    now: input.now,
  };
  const primaryProgress = await writeTopicProgress({
    supabase: input.supabase,
    userId: input.userId,
    topicSlug: primaryTopicSlug,
    progressInput: baseProgressInput,
  });

  if (!primaryProgress.ok) {
    return {
      ok: false,
      skipped: false,
      topicSlug: primaryTopicSlug,
      error: primaryProgress.error,
      prerequisiteUpdates: [],
      prerequisiteErrors: [],
    };
  }

  const prerequisiteUpdates: PracticeMasteryTopicProgressUpdate[] = [];
  const prerequisiteErrors: Array<{ topicSlug: TopicSlug; error: string }> = [];
  for (const topicSlug of resolvePrerequisiteTopicSlugs(input)) {
    const prerequisiteProgress = await writeTopicProgress({
      supabase: input.supabase,
      userId: input.userId,
      topicSlug,
      progressInput: {
        ...baseProgressInput,
        masteryDeltaMultiplier: PREREQUISITE_MASTERY_DELTA_MULTIPLIER,
      },
    });

    if (prerequisiteProgress.ok) {
      prerequisiteUpdates.push({
        topicSlug,
        scope: "prerequisite",
        result: prerequisiteProgress.result,
      });
    } else {
      prerequisiteErrors.push({ topicSlug, error: prerequisiteProgress.error });
    }
  }

  return {
    ok: true,
    skipped: false,
    topicSlug: primaryTopicSlug,
    result: primaryProgress.result,
    prerequisiteUpdates,
    prerequisiteErrors,
  };
}
