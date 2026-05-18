import { useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { recordResearchEvent } from "@/lib/codewise.functions";
import { useAuth } from "@/hooks/use-auth";

export function useTelemetry() {
  const { user } = useAuth();
  const record = useServerFn(recordResearchEvent);

  const track = useCallback(
    async (event_type: string, payload: Record<string, unknown> = {}) => {
      if (!user) return;
      try {
        await record({ data: { event_type, payload } });
      } catch {
        // telemetry is best-effort; never throw
      }
    },
    [user, record],
  );

  return { track };
}
