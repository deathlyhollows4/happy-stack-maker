import { useState, useEffect, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  getUserConsent as getUserConsentFn,
  setUserConsent as setUserConsentFn,
} from "@/lib/codewise.functions";
import { Beaker, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function ConsentBanner() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const getUserConsent = useServerFn(getUserConsentFn);
  const setUserConsent = useServerFn(setUserConsentFn);

  useEffect(() => {
    if (!user) return;
    getUserConsent()
      .then((r: any) => {
        if (!r?.consent?.consent_given) setVisible(true);
      })
      .catch(() => {
        setVisible(true);
      });
  }, [user, getUserConsent]);

  const respond = useCallback(
    async (consent_given: boolean) => {
      setBusy(true);
      try {
        await setUserConsent({ data: { consent_given } });
      } catch {
        // best-effort; dismiss banner even if server fails
      }
      setVisible(false);
      setBusy(false);
    },
    [setUserConsent],
  );

  if (!visible) return null;

  return (
    <div className="border-b border-accent/30 bg-accent/5 px-6 py-3 text-sm">
      <div className="mx-auto max-w-6xl flex items-start gap-3">
        <Beaker className="size-4 mt-0.5 text-accent shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium">Help improve CS education</p>
          <p className="text-muted-foreground mt-0.5">
            CodeWise is part of an academic study. Allow anonymous usage data collection to support
            research in AI-assisted computer science education. No personal data is shared. You can
            change this anytime in Settings.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => respond(true)}
            disabled={busy}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            Yes, help research
          </button>
          <button
            onClick={() => respond(false)}
            disabled={busy}
            className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/10 disabled:opacity-50"
          >
            No thanks
          </button>
          <button
            onClick={() => setVisible(false)}
            className="p-1 text-muted-foreground hover:text-foreground"
            aria-label="Dismiss"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
