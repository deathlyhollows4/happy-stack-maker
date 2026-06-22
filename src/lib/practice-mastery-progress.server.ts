import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import {
  buildPracticeMasteryProgressUpdate,
  type BuildPracticeMasterySignalInput,
  type PracticeMasteryProgressResult,
  type PracticeMasteryProgressSnapshot,
} from "@/lib/practice-mastery-scoring";

type ProgressRow = Pick<
  Database["public"]["Tables"]["progress"]["Row"],
  "mastery" | "attempts" | "last_reviewed" | "stability" | "difficulty"
>;

export interface UpdatePracticeMasteryProgressInput extends Omit<
  BuildPracticeMasterySignalInput,
  "previousProgress"
> {
  supabase: SupabaseClient<Database>;
  userId: string;
  topicSlug: string | null;
}

export type UpdatePracticeMasteryProgressResult =
  | {
      ok: true;
      skipped: false;
      topicSlug: string;
      result: PracticeMasteryProgressResult;
    }
  | {
      ok: true;
      skipped: true;
      topicSlug: null;
      result: null;
    }
  | {
      ok: false;
      skipped: false;
      topicSlug: string;
      error: string;
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

export async function updatePracticeMasteryProgress(
  input: UpdatePracticeMasteryProgressInput,
): Promise<UpdatePracticeMasteryProgressResult> {
  if (!input.topicSlug) {
    return {
      ok: true,
      skipped: true,
      topicSlug: null,
      result: null,
    };
  }

  const { data: progressRow, error: progressError } = await input.supabase
    .from("progress")
    .select("mastery, attempts, last_reviewed, stability, difficulty")
    .eq("user_id", input.userId)
    .eq("topic_slug", input.topicSlug)
    .maybeSingle();

  if (progressError) {
    console.error("updatePracticeMasteryProgress progress lookup failed:", progressError);
    return {
      ok: false,
      skipped: false,
      topicSlug: input.topicSlug,
      error: "Could not load mastery progress.",
    };
  }

  const result = buildPracticeMasteryProgressUpdate({
    ...input,
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
      ok: false,
      skipped: false,
      topicSlug: input.topicSlug,
      error: "Could not update mastery progress.",
    };
  }

  return {
    ok: true,
    skipped: false,
    topicSlug: input.topicSlug,
    result,
  };
}
