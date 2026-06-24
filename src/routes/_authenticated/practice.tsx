import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { type Lang } from "@/lib/codewise.editor";
import { generatePractice, listPractice } from "@/lib/codewise.functions";
import { getBillingEnvironment } from "@/lib/payments";
import { useTelemetry } from "@/hooks/use-telemetry";
import { toast } from "sonner";
import { Sparkles, ArrowLeft } from "lucide-react";
import { normalizeTopicSlug, topicDisplayName, type TopicSlug } from "@/lib/topics";
import {
  LanguageSelect,
  PracticeWorkspace,
  RecommendationPanel,
  TopicSelect,
  type PracticeProblem,
} from "@/components/practice-workspace";
const practiceSearchSchema = z.object({
  topic: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/practice")({
  head: () => ({ meta: [{ title: "Practice | CodeWise" }] }),
  validateSearch: (search) => practiceSearchSchema.catch({}).parse(search),
  component: Practice,
});

type PracticeStep = "topic" | "language" | "solve";

interface GeneratePracticeResult {
  ok: boolean;
  error?: string;
  problem?: PracticeProblem;
}

function Practice() {
  const gen = useServerFn(generatePractice);
  const list = useServerFn(listPractice);
  const { track } = useTelemetry();
  const search = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [lang, setLang] = useState<Lang>("python");
  const [step, setStep] = useState<PracticeStep>("topic");
  const [showAllOptions, setShowAllOptions] = useState(false);
  const [topicSlug, setTopicSlug] = useState<TopicSlug | null>(normalizeTopicSlug(search.topic));
  const { data, refetch, isLoading } = useQuery({
    queryKey: ["practice", topicSlug],
    queryFn: () => list({ data: { topicSlug } }),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const problems = (data?.problems ?? []) as PracticeProblem[];
  const active = problems.find((p) => p.id === activeId) ?? null;
  const selectedTopicName = topicSlug ? topicDisplayName(topicSlug) : "Weakest Topic (auto)";
  const recommendation = data?.recommendation ?? null;

  useEffect(() => {
    if (!activeId && data?.problems?.[0]) setActiveId(data.problems[0].id);
  }, [data, activeId]);

  const onGen = async () => {
    setBusy(true);
    try {
      const r = await gen({
        data: { language: lang, topicSlug, environment: getBillingEnvironment() },
      });
      const result = r as GeneratePracticeResult;
      if (!result.ok) {
        toast.error(result.error);
        return false;
      }
      toast.success("New problem ready");
      await refetch();
      setActiveId(result.problem?.id ?? null);
      setStep("solve");
      track("practice_generated", {
        topic: result.problem?.topic_slug ?? null,
        language: lang,
      });
      return true;
    } catch (e: unknown) {
      console.error("generatePractice failed:", e);
      toast.error(e instanceof Error ? e.message : "Could not generate a problem. Try again.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const resetFlow = () => {
    setStep("topic");
    setShowAllOptions(false);
    setActiveId(null);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="size-3.5" /> Back to Dashboard
      </Link>

      <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-6 md:mb-8 gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            CodeWise DSA Ladder
          </p>
          <h1 className="mt-2 font-display text-3xl md:text-5xl tracking-tight">Practice</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            {recommendation
              ? `Next: ${recommendation.nextNode.title}, ${recommendation.nextNode.masteryBandLabel}.`
              : topicSlug
                ? `Current target: ${selectedTopicName}.`
                : "Auto mode starts from your weakest open topic."}
          </p>
        </div>
        {showAllOptions && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto">
            <button
              onClick={onGen}
              disabled={busy}
              className="inline-flex items-center justify-center gap-1.5 md:gap-2 rounded-md bg-primary px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
            >
              <Sparkles className="size-4" /> {busy ? "Generating..." : "Generate a problem"}
            </button>
            <TopicSelect topicSlug={topicSlug} onChange={setTopicSlug} />
            <LanguageSelect lang={lang} onChange={setLang} />
          </div>
        )}
      </div>

      {!showAllOptions && step === "topic" && (
        <section className="max-w-xl max-w-full mx-auto rounded-lg border border-border bg-card p-4 md:p-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Step 1 of 3</p>
          <h2 className="font-display text-3xl mt-2 mb-2">Choose topic</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Start with your weakest topic automatically, or pick a specific area.
          </p>
          <div className="rounded-md border border-accent/40 bg-accent/10 p-4 mb-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-accent">Suggested</p>
            <p className="font-medium mt-1">{recommendation?.nextNode.title ?? "Weakest topic"}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {recommendation
                ? `${recommendation.nextNode.masteryBandLabel}. ${recommendation.summary}`
                : "Leave the picker on auto to let CodeWise choose your lowest mastery topic."}
            </p>
          </div>
          <RecommendationPanel recommendation={recommendation} className="mb-4" />
          <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Topic
          </label>
          <TopicSelect topicSlug={topicSlug} onChange={setTopicSlug} className="mt-2 w-full" />
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <button
              type="button"
              onClick={() => setShowAllOptions(true)}
              className="text-xs md:text-sm text-muted-foreground hover:text-foreground"
            >
              Show all options
            </button>
            <button
              type="button"
              onClick={() => setStep("language")}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
            >
              Next: Choose language
            </button>
          </div>
        </section>
      )}

      {!showAllOptions && step === "language" && (
        <section className="max-w-xl max-w-full mx-auto rounded-lg border border-border bg-card p-4 md:p-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Step 2 of 3</p>
          <h2 className="font-display text-3xl mt-2 mb-2">Choose language</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Topic: <span className="text-foreground">{selectedTopicName}</span>
          </p>
          <RecommendationPanel recommendation={recommendation} className="mb-4" />
          <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Language
          </label>
          <LanguageSelect lang={lang} onChange={setLang} className="mt-2 w-full" />
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep("topic")}
              className="inline-flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" /> Back to topic
            </button>
            <button
              type="button"
              onClick={onGen}
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
            >
              <Sparkles className="size-4" /> {busy ? "Generating..." : "Generate problem"}
            </button>
          </div>
        </section>
      )}

      {(showAllOptions || step === "solve") && (
        <PracticeWorkspace
          data={data}
          active={active}
          activeId={activeId}
          isLoading={isLoading}
          onSelect={setActiveId}
          onNewProblem={resetFlow}
          showNewProblem={!showAllOptions}
          recommendation={recommendation}
        />
      )}
    </div>
  );
}
