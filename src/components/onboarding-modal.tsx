import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Code2, LineChart, Sparkles, ChevronLeft, ChevronRight, X } from "lucide-react";

const STEPS = [
  {
    icon: Code2,
    title: "Submit code for AI review",
    description:
      "Paste any code snippet and our AI will analyze it for bugs, anti-patterns, and missed edge cases, then map every issue to the CS concept you need to strengthen.",
    cta: "Start a review",
    ctaTo: "/review",
  },
  {
    icon: LineChart,
    title: "See what you're missing",
    description:
      "Every review updates your progress across 20 DSA topics. See which topics are strong and which need work.",
  },
  {
    icon: Sparkles,
    title: "Practice your weakest topics",
    description:
      "Get practice problems targeted at your weakest topics. Solve them, resubmit, and track your improvement over time.",
    cta: "Go to practice",
    ctaTo: "/practice",
  },
];

interface Props {
  open: boolean;
  onDismiss: () => void;
}

export function OnboardingModal({ open, onDismiss }: Props) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const dismiss = () => {
    localStorage.setItem("onboarding_dismissed", "true");
    onDismiss();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) dismiss();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <button
          onClick={dismiss}
          className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Skip tour"
        >
          <X className="size-4" />
        </button>

        <DialogHeader className="gap-2">
          <div className="flex items-center gap-2">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full flex-1 transition-colors ${
                  i <= step ? "bg-primary" : "bg-secondary"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-3 pt-2">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent/15">
              <current.icon className="size-5 text-accent" />
            </div>
            <DialogTitle className="font-display text-xl">{current.title}</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground pt-1">
            {current.description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent/10 disabled:opacity-30"
            >
              <ChevronLeft className="size-3.5" /> Back
            </button>
            <span className="text-xs text-muted-foreground">
              {step + 1} / {STEPS.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={dismiss}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip tour
            </button>
            {isLast && current.ctaTo ? (
              <Link
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                to={current.ctaTo as any}
                onClick={dismiss}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
              >
                {current.cta} <ChevronRight className="size-4" />
              </Link>
            ) : (
              <button
                onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
              >
                Next <ChevronRight className="size-4" />
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
