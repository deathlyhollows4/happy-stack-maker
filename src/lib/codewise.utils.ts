import { z, type ZodType } from "zod";
import type { PaddleEnv } from "@/lib/paddle.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const envInput = z.enum(["sandbox", "live"]).default("sandbox") as z.ZodType<PaddleEnv>;

export function extractJson(raw: string): string {
  const trimmed = raw.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence?.[1]) return fence[1].trim();
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }
  return trimmed;
}

export async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin.rpc("has_role", {
    p_user_id: userId,
    p_role: "admin",
  });
  return !!data;
}

export const FSRS_WEIGHTS = [0.4, 0.6, 2.4, 5.8, 4.9, 0.9, 0.8, 0.7, 1.5, 0.1];

export function computeFSRSGrade(
  issues: { severity: string; [key: string]: unknown }[],
): 1 | 2 | 3 | 4 {
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");

  if (errors.length >= 2) return 1;
  if (errors.length === 1 || warnings.length >= 3) return 2;
  if (warnings.length >= 1) return 3;
  return 4;
}

export async function updateFSRS(
  userId: string,
  topicSlug: string,
  grade: 1 | 2 | 3 | 4,
): Promise<void> {
  const { data: row } = await supabaseAdmin
    .from("progress")
    .select("stability, difficulty, retrievability, last_reviewed, attempts")
    .eq("user_id", userId)
    .eq("topic_slug", topicSlug)
    .single();

  const w = FSRS_WEIGHTS;

  const D = row?.difficulty ?? 5.0;
  const S = row?.stability ?? 2.5;

  // Compute actual retrieval probability from elapsed time since last review
  const now = Date.now();
  const lastReviewMs = row?.last_reviewed ? new Date(row.last_reviewed).getTime() : now;
  const elapsedDays = Math.max(0, (now - lastReviewMs) / 86400000);
  const currentR = row ? (1 + elapsedDays / (9 * Math.max(0.1, S))) ** (-1) : 0.9;

  const newDifficulty = Math.max(1, Math.min(10, D - w[2] * (grade - 3)));

  let newStability: number;
  if (grade === 1) {
    newStability = Math.max(0.1, S * 0.5);
  } else {
    newStability =
      S *
      (1 +
        w[3] *
          Math.pow(newDifficulty, -w[4]) *
          Math.pow(S, -w[5]) *
          (Math.exp(1 - currentR) - 1));
    newStability = Math.max(0.1, newStability);
  }

  // Proper interval: stability = days until R drops to 90%
  const intervalDays = Math.max(1, Math.round(newStability));
  // Track actual retrievability after interval
  const newR = grade === 1 ? 0 : (1 + intervalDays / (9 * Math.max(0.1, newStability))) ** (-1);
  const nextReview = new Date(Date.now() + intervalDays * 86400000);

  await supabaseAdmin.from("progress").upsert(
    {
      user_id: userId,
      topic_slug: topicSlug,
      stability: newStability,
      difficulty: newDifficulty,
      retrievability: newR,
      next_review_date: nextReview.toISOString(),
      mastery: grade >= 3 ? 0.9 : grade === 2 ? 0.6 : 0.3,
      attempts: (row?.attempts ?? 0) + 1,
      last_reviewed: new Date().toISOString(),
    },
    { onConflict: "user_id,topic_slug" },
  );
}
