import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";
import { RecordPracticeEventInputSchema } from "@/lib/practice-event-model";

export type RecordPracticeEventResult =
  | { ok: true; eventId: string }
  | { ok: false; error: string };

export const recordPracticeEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => RecordPracticeEventInputSchema.parse(input))
  .handler(async ({ data, context }): Promise<RecordPracticeEventResult> => {
    const { userId, supabase } = context;
    const { data: event, error } = await supabase
      .from("practice_events")
      .insert({
        user_id: userId,
        event_type: data.eventType,
        practice_problem_id: data.practiceProblemId ?? null,
        practice_attempt_id: data.practiceAttemptId ?? null,
        topic_slug: data.topicSlug ?? null,
        curriculum_node_id: data.curriculumNodeId ?? null,
        mastery_band: data.masteryBand ?? null,
        payload: data.payload as Json,
      })
      .select("id")
      .single();

    if (error || !event) {
      console.error("recordPracticeEvent insert failed:", error);
      return { ok: false, error: "Could not record practice event." };
    }

    return { ok: true, eventId: event.id };
  });
