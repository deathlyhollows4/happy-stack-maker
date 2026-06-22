import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { RecordPracticeEventInputSchema } from "@/lib/practice-event-model";
import { insertPracticeEvent } from "@/lib/practice-event-log.server";

export type RecordPracticeEventResult =
  | { ok: true; eventId: string }
  | { ok: false; error: string };

export const recordPracticeEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => RecordPracticeEventInputSchema.parse(input))
  .handler(async ({ data, context }): Promise<RecordPracticeEventResult> => {
    const { userId, supabase } = context;
    const result = await insertPracticeEvent({
      supabase,
      userId,
      event: data,
      logContext: "recordPracticeEvent",
    });

    if (!result.ok) {
      return { ok: false, error: "Could not record practice event." };
    }

    return { ok: true, eventId: result.eventId };
  });
