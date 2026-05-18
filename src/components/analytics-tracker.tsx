import { useEffect, useRef } from "react";
import { useRouter } from "@tanstack/react-router";

declare global {
  interface Window {
    plausible: ((
      event: string,
      options?: { u?: string; props?: Record<string, unknown> },
    ) => void) & { q?: unknown[][] };
  }
}

export function AnalyticsTracker() {
  const router = useRouter();
  const isFirst = useRef(true);

  useEffect(() => {
    // Track the initial pageview
    if (isFirst.current && typeof window !== "undefined") {
      isFirst.current = false;
      schedulePageview();
    }

    const unsub = router.subscribe("onResolved", () => {
      schedulePageview();
    });

    return () => {
      unsub?.();
    };
  }, [router]);

  return null;
}

function schedulePageview() {
  if (typeof window === "undefined" || import.meta.env.DEV) return;
  requestAnimationFrame(() => {
    window.plausible?.("pageview", { u: window.location.href });
  });
}
