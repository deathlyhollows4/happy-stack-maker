import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/integrations/supabase/types";
import {
  RecordPracticeEventInputSchema,
  type RecordPracticeEventInput,
} from "@/lib/practice-event-model";

type PracticeEventSupabase = SupabaseClient<Database>;
type PracticeEventInsert = Database["public"]["Tables"]["practice_events"]["Insert"];

export type InsertPracticeEventResult =
  | { ok: true; eventId: string }
  | { ok: false; error: string };

export type InsertPracticeEventsResult =
  | { ok: true; eventIds: string[] }
  | { ok: false; error: string };

function toPracticeEventRow(userId: string, event: RecordPracticeEventInput): PracticeEventInsert {
  return {
    user_id: userId,
    event_type: event.eventType,
    practice_problem_id: event.practiceProblemId ?? null,
    practice_attempt_id: event.practiceAttemptId ?? null,
    topic_slug: event.topicSlug ?? null,
    curriculum_node_id: event.curriculumNodeId ?? null,
    mastery_band: event.masteryBand ?? null,
    payload: event.payload as Json,
  };
}

export async function insertPracticeEvents(input: {
  supabase: PracticeEventSupabase;
  userId: string;
  events: RecordPracticeEventInput[];
  logContext: string;
}): Promise<InsertPracticeEventsResult> {
  if (!input.events.length) return { ok: true, eventIds: [] };

  const rows = input.events.map((event) =>
    toPracticeEventRow(input.userId, RecordPracticeEventInputSchema.parse(event)),
  );
  const { data, error } = await input.supabase.from("practice_events").insert(rows).select("id");

  if (error || !data) {
    console.error(`${input.logContext} practice event insert failed:`, error);
    return { ok: false, error: "Could not record practice analytics." };
  }

  return { ok: true, eventIds: data.map((event) => event.id) };
}

export async function insertPracticeEvent(input: {
  supabase: PracticeEventSupabase;
  userId: string;
  event: RecordPracticeEventInput;
  logContext: string;
}): Promise<InsertPracticeEventResult> {
  const result = await insertPracticeEvents({
    supabase: input.supabase,
    userId: input.userId,
    events: [input.event],
    logContext: input.logContext,
  });

  if (!result.ok) return result;
  return { ok: true, eventId: result.eventIds[0] ?? "" };
}
