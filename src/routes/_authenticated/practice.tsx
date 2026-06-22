import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { type ReactNode, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { type Lang, LANG_LABELS } from "@/lib/codewise.editor";
import {
  CodeWorkspace,
  loadEditorSettings,
  type EditorSettings,
} from "@/components/code-workspace";
import {
  generatePractice,
  listPractice,
  reviewCode,
  submitPracticeAttempt,
} from "@/lib/codewise.functions";
import {
  recordPracticeEvent,
  type RecordPracticeEventResult,
} from "@/lib/practice-event.functions";
import { Markdown } from "@/components/markdown";
import { useTelemetry } from "@/hooks/use-telemetry";
import { runCode } from "@/lib/code-exec.functions";
import { getBillingEnvironment } from "@/lib/payments";
import { toast } from "sonner";
import {
  Sparkles,
  ArrowLeft,
  Play,
  Send,
  CheckCircle2,
  XCircle,
  Target,
  ListChecks,
  FlaskConical,
  Lightbulb,
  BadgeCheck,
  BookOpen,
  Route as RouteIcon,
  Code2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  normalizeTopicSlug,
  TOPICS,
  TOPIC_CATEGORIES,
  topicDisplayName,
  type TopicSlug,
} from "@/lib/topics";
import {
  buildPracticeVisibleTestRunInput,
  buildPracticeProblemView,
  getPracticeProblemBody,
  getPracticeLanguageSignature,
  type PracticeProblemListItem,
  type PracticeProblemView,
} from "@/lib/practice-problem-view";
import type { PracticeRecommendationView } from "@/lib/practice-recommendation-view";
import {
  buildPracticeRunOutputState,
  formatPracticeTestValue,
  type PracticeRunOutput,
  type PracticeRunOutputState,
  type PracticeRunOutputTone,
} from "@/lib/practice-run-output-view";
import {
  buildPracticeHintUsageEvent,
  buildPracticeVisibleTestRunEvent,
  markPracticeHintRevealed,
  type PracticeReviewQualityInput,
  type RecordPracticeEventInput,
} from "@/lib/practice-event-model";
import type { PracticeProblemHint } from "@/lib/practice-problem-contract";

const practiceSearchSchema = z.object({
  topic: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/practice")({
  head: () => ({ meta: [{ title: "Practice | CodeWise" }] }),
  validateSearch: (search) => practiceSearchSchema.catch({}).parse(search),
  component: Practice,
});

type PracticeStep = "topic" | "language" | "solve";

interface PracticeProblem {
  id: string;
  title: string;
  prompt: string;
  starter_code: string | null;
  language: string | null;
  topic_slug: string | null;
  planning_context?: unknown;
  contract_version?: string | null;
  curriculum_node_id?: string | null;
  mastery_band?: string | null;
  objective?: string | null;
  statement?: string | null;
  topic_tags?: unknown;
  prerequisite_tags?: unknown;
  examples?: unknown;
  constraints?: unknown;
  function_signature?: unknown;
  visible_tests?: unknown;
  hidden_test_themes?: unknown;
  hint_ladder?: unknown;
  success_criteria?: unknown;
  generation_status?: string | null;
}

interface PracticeData {
  problems: PracticeProblem[];
  practiceHistory?: PracticeProblemListItem[];
  recommendation?: PracticeRecommendationView | null;
}

interface GeneratePracticeResult {
  ok: boolean;
  error?: string;
  problem?: PracticeProblem;
}

interface PracticeAttemptResult {
  ok: boolean;
  error?: string;
  attemptId?: string;
  status?: "completed" | "failed";
  correctnessScore?: number;
  visibleSummary?: {
    total: number;
    passed: number;
    failed: number;
  };
  hiddenSummary?: {
    total: number;
    passed: number;
    failed: number;
  };
  reviewQualityScore?: number | null;
  speedSeconds?: number | null;
}

function getDisplayTopic(problem: PracticeProblem) {
  return problem.topic_slug ? topicDisplayName(normalizeTopicSlug(problem.topic_slug)) : null;
}

function formatAttemptSpeed(seconds: number | null) {
  if (seconds === null) return null;
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
}

function Pill({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "accent" | "success";
}) {
  const toneClass =
    tone === "accent"
      ? "border-accent/30 bg-accent/10 text-accent"
      : tone === "success"
        ? "border-success/30 bg-success/10 text-success"
        : "border-border bg-background text-muted-foreground";

  return (
    <span
      className={`inline-flex max-w-full items-center rounded-sm border px-2 py-0.5 text-[11px] font-medium ${toneClass}`}
    >
      <span className="truncate">{children}</span>
    </span>
  );
}

function SectionHeader({
  icon: Icon,
  eyebrow,
  title,
}: {
  icon: typeof Target;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="mb-3 flex items-start gap-2">
      <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground">
        <Icon className="size-3.5" />
      </span>
      <div className="min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {eyebrow}
        </p>
        <h3 className="text-base font-semibold leading-snug">{title}</h3>
      </div>
    </div>
  );
}

function TagList({ tags }: { tags: PracticeProblemView["topicTags"] }) {
  if (!tags.length) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <Pill key={`${tag.slug}-${tag.label}`}>{tag.label}</Pill>
      ))}
    </div>
  );
}

function BridgePreviewCallout({ view }: { view: PracticeProblemView }) {
  if (!view.bridgePreview) return null;

  return (
    <div className="mb-4 rounded-md border border-accent/40 bg-accent/10 p-3">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-md border border-accent/30 bg-background/60 text-accent">
          <RouteIcon className="size-3.5" />
        </span>
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
            Bridge preview
          </p>
          <h4 className="mt-1 text-sm font-semibold leading-snug">
            Bridge before {view.bridgePreview.targetTopicLabel}
          </h4>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            CodeWise selected {view.bridgePreview.currentNodeTitle} before{" "}
            {view.bridgePreview.targetNodeTitle}. Finish this prerequisite step first, then continue
            toward {view.bridgePreview.targetTopicLabel}.
          </p>
        </div>
      </div>
      <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
        <div className="min-w-0">
          <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Current step
          </dt>
          <dd className="mt-1 truncate font-medium">{view.bridgePreview.currentNodeTitle}</dd>
        </div>
        <div className="min-w-0">
          <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Target preview
          </dt>
          <dd className="mt-1 truncate font-medium">{view.bridgePreview.targetNodeTitle}</dd>
        </div>
      </dl>
    </div>
  );
}

function WorkflowStrip({ view }: { view: PracticeProblemView }) {
  const steps = [
    {
      label: "Learn",
      value: view.masteryBandLabel ?? "Problem brief",
    },
    {
      label: "Solve",
      value: `${view.visibleTests.length} visible ${view.visibleTests.length === 1 ? "test" : "tests"}`,
    },
    {
      label: "Review",
      value: view.hiddenTestThemes.length
        ? `${view.hiddenTestThemes.length} hidden themes`
        : "Submit review",
    },
    {
      label: "Adapt",
      value: view.successCriteria.length
        ? `${view.successCriteria.length} criteria`
        : "Next recommendation",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
      {steps.map((step, index) => (
        <div key={step.label} className="rounded-md border border-border bg-card p-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-sm bg-primary text-[10px] font-semibold text-primary-foreground">
              {index + 1}
            </span>
            <span className="text-sm font-medium">{step.label}</span>
          </div>
          <p className="mt-2 truncate text-xs text-muted-foreground">{step.value}</p>
        </div>
      ))}
    </div>
  );
}

function ProblemBrief({ problem, view }: { problem: PracticeProblem; view: PracticeProblemView }) {
  const displayTopic = getDisplayTopic(problem);
  const problemBody = getPracticeProblemBody(view);

  return (
    <section className="rounded-lg border border-border bg-card p-4 md:p-5">
      <SectionHeader icon={Target} eyebrow="Learn" title={problem.title} />

      <div className="mb-4 flex flex-wrap gap-1.5">
        {view.curriculumNodeId && <Pill tone="accent">{view.curriculumNodeId}</Pill>}
        {view.bridgePreview && <Pill tone="accent">Bridge</Pill>}
        {view.masteryBand && (
          <Pill tone="success">
            {view.masteryBand}
            {view.masteryBandLabel ? `, ${view.masteryBandLabel}` : ""}
          </Pill>
        )}
        {displayTopic && <Pill>{displayTopic}</Pill>}
        {view.generationStatus && <Pill>{view.generationStatus}</Pill>}
      </div>

      <BridgePreviewCallout view={view} />

      {view.objective && (
        <div className="mb-4 rounded-md border border-border bg-background/60 p-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Objective
          </p>
          <p className="mt-1 text-sm leading-6">{view.objective}</p>
        </div>
      )}

      {problemBody.kind === "legacy" ? (
        <Markdown className="text-muted-foreground">{problemBody.text}</Markdown>
      ) : (
        <p
          className={`text-sm leading-6 ${
            problemBody.kind === "missing" ? "text-muted-foreground" : "text-foreground"
          }`}
        >
          {problemBody.text}
        </p>
      )}

      {(view.topicTags.length > 0 || view.prerequisiteTags.length > 0) && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {view.topicTags.length > 0 && (
            <div>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Topic tags
              </p>
              <TagList tags={view.topicTags} />
            </div>
          )}
          {view.prerequisiteTags.length > 0 && (
            <div>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Prerequisites
              </p>
              <TagList tags={view.prerequisiteTags} />
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function ExamplesSection({ view }: { view: PracticeProblemView }) {
  if (!view.examples.length) return null;

  return (
    <section className="rounded-lg border border-border bg-card p-4 md:p-5">
      <SectionHeader icon={BookOpen} eyebrow="Read" title="Examples" />
      <div className="space-y-3">
        {view.examples.map((example, index) => (
          <div key={`${example.input}-${index}`} className="rounded-md border border-border p-3">
            <p className="text-xs font-medium">Example {index + 1}</p>
            <dl className="mt-2 space-y-2 text-sm">
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Input
                </dt>
                <dd className="mt-1 whitespace-pre-wrap break-words font-mono text-xs">
                  {example.input}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Output
                </dt>
                <dd className="mt-1 whitespace-pre-wrap break-words font-mono text-xs">
                  {example.output}
                </dd>
              </div>
              {example.explanation && (
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Why
                  </dt>
                  <dd className="mt-1 text-xs leading-5 text-muted-foreground">
                    {example.explanation}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        ))}
      </div>
    </section>
  );
}

function FunctionSignatureSection({
  view,
  language,
}: {
  view: PracticeProblemView;
  language: Lang;
}) {
  const languageSignature = getPracticeLanguageSignature(view, language);

  if (!view.functionSignature) return null;

  return (
    <section className="rounded-lg border border-border bg-card p-4 md:p-5">
      <SectionHeader icon={Code2} eyebrow="Contract" title="Expected function" />
      {languageSignature ? (
        <pre className="overflow-x-auto rounded-md border border-border bg-background p-3 text-xs">
          <code>{languageSignature.signature}</code>
        </pre>
      ) : (
        <p className="text-sm text-muted-foreground">
          No stored signature for {LANG_LABELS[language]}.
        </p>
      )}
      <dl className="mt-3 grid gap-2 text-xs">
        <div className="flex flex-wrap gap-2">
          <dt className="font-mono uppercase tracking-widest text-muted-foreground">Returns</dt>
          <dd className="font-mono">{view.functionSignature.returnType}</dd>
        </div>
        {view.functionSignature.parameters.length > 0 && (
          <div>
            <dt className="font-mono uppercase tracking-widest text-muted-foreground">
              Parameters
            </dt>
            <dd className="mt-1 flex flex-wrap gap-1.5">
              {view.functionSignature.parameters.map((parameter) => (
                <Pill key={`${parameter.name}-${parameter.type}`}>
                  {parameter.name}: {parameter.type}
                </Pill>
              ))}
            </dd>
          </div>
        )}
      </dl>
    </section>
  );
}

function VisibleTestsSection({ view }: { view: PracticeProblemView }) {
  if (!view.visibleTests.length) return null;

  return (
    <section className="rounded-lg border border-border bg-card p-4 md:p-5">
      <SectionHeader icon={FlaskConical} eyebrow="Solve" title="Visible tests" />
      <ul className="space-y-2">
        {view.visibleTests.map((test, index) => (
          <li key={`${test.name}-${index}`} className="rounded-md border border-border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">{test.name}</p>
              <Pill>{test.theme}</Pill>
            </div>
            <dl className="mt-2 grid gap-2 text-xs">
              <div>
                <dt className="font-mono uppercase tracking-widest text-muted-foreground">
                  Arguments
                </dt>
                <dd className="mt-1 break-words font-mono">
                  {formatPracticeTestValue(test.arguments)}
                </dd>
              </div>
              <div>
                <dt className="font-mono uppercase tracking-widest text-muted-foreground">
                  Expected
                </dt>
                <dd className="mt-1 break-words font-mono">
                  {formatPracticeTestValue(test.expected)}
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </section>
  );
}

function HintsSection({
  view,
  revealedHintOrders,
  onHintReveal,
}: {
  view: PracticeProblemView;
  revealedHintOrders: number[];
  onHintReveal: (hint: PracticeProblemHint) => void;
}) {
  const [openHints, setOpenHints] = useState<number[]>([]);

  if (!view.hintLadder.length) return null;

  const toggleHint = (hint: PracticeProblemHint) => {
    const willOpen = !openHints.includes(hint.order);
    setOpenHints((current) =>
      current.includes(hint.order)
        ? current.filter((item) => item !== hint.order)
        : [...current, hint.order],
    );
    if (willOpen && !revealedHintOrders.includes(hint.order)) {
      onHintReveal(hint);
    }
  };

  return (
    <section className="rounded-lg border border-border bg-card p-4 md:p-5">
      <SectionHeader icon={Lightbulb} eyebrow="Support" title="Hint ladder" />
      <div className="space-y-2">
        {view.hintLadder.map((hint) => {
          const isOpen = openHints.includes(hint.order);
          const isRevealed = revealedHintOrders.includes(hint.order);
          return (
            <div key={hint.order} className="rounded-md border border-border">
              <button
                type="button"
                onClick={() => toggleHint(hint)}
                className="flex w-full items-center justify-between gap-3 p-3 text-left"
              >
                <span className="min-w-0">
                  <span className="block text-xs font-medium">
                    Hint {hint.order}: {hint.title}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  {isRevealed && (
                    <span className="hidden font-mono text-[10px] uppercase tracking-widest text-muted-foreground sm:inline">
                      Revealed
                    </span>
                  )}
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {isOpen ? "Hide" : "Show"}
                  </span>
                </span>
              </button>
              {isOpen && (
                <p className="border-t border-border px-3 py-3 text-xs leading-5 text-muted-foreground">
                  {hint.body}
                </p>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        {revealedHintOrders.length} of {view.hintLadder.length} hints revealed.
      </p>
    </section>
  );
}

function emptyPracticeReviewQuality(): PracticeReviewQualityInput {
  return {
    complexityExplanation: "",
    edgeCaseExplanation: "",
  };
}

function ReviewQualitySection({
  value,
  onChange,
}: {
  value: PracticeReviewQualityInput;
  onChange: (value: PracticeReviewQualityInput) => void;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 md:p-5">
      <SectionHeader icon={BadgeCheck} eyebrow="Review" title="Review notes" />
      <div className="grid gap-3">
        <label className="text-xs font-medium">
          Complexity
          <textarea
            value={value.complexityExplanation}
            onChange={(e) =>
              onChange({
                ...value,
                complexityExplanation: e.target.value,
              })
            }
            maxLength={1200}
            rows={3}
            className="mt-1 w-full rounded-md border border-border bg-input p-2 text-xs leading-5"
            placeholder="Example: O(n) time and O(1) extra space."
          />
        </label>
        <label className="text-xs font-medium">
          Edge cases
          <textarea
            value={value.edgeCaseExplanation}
            onChange={(e) =>
              onChange({
                ...value,
                edgeCaseExplanation: e.target.value,
              })
            }
            maxLength={1200}
            rows={3}
            className="mt-1 w-full rounded-md border border-border bg-input p-2 text-xs leading-5"
            placeholder="Example: Empty arrays, single item inputs, and repeated values."
          />
        </label>
      </div>
    </section>
  );
}

function RecommendationPanel({
  recommendation,
  className = "",
}: {
  recommendation: PracticeRecommendationView | null | undefined;
  className?: string;
}) {
  if (!recommendation) return null;

  return (
    <section className={`rounded-lg border border-border bg-card p-4 ${className}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
            Recommended path
          </p>
          <h3 className="mt-1 text-base font-semibold leading-snug">
            {recommendation.nextNode.title}
          </h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {recommendation.nextNode.objective}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-1.5">
          <Pill tone="success">
            {recommendation.nextNode.masteryBandId}, {recommendation.nextNode.masteryBandLabel}
          </Pill>
          <Pill tone="accent">{recommendation.sourceLabel}</Pill>
        </div>
      </div>

      <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Current mastery
          </dt>
          <dd className="mt-1">
            {recommendation.currentMastery
              ? `${recommendation.currentMastery.topicLabel}: ${recommendation.currentMastery.masteryPercent}% (${recommendation.currentMastery.bandLabel})`
              : "No mastery record yet."}
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Next node
          </dt>
          <dd className="mt-1">
            {recommendation.nextNode.curriculumNodeId} - {recommendation.nextNode.topicLabel}
          </dd>
        </div>
      </dl>

      {recommendation.bridgePreview && (
        <p className="mt-3 rounded-md border border-accent/30 bg-accent/10 p-2 text-xs leading-5 text-muted-foreground">
          Bridge preview: finish {recommendation.nextNode.title} before{" "}
          {recommendation.bridgePreview.title}.
        </p>
      )}
    </section>
  );
}

function ChecklistSection({
  icon,
  eyebrow,
  title,
  items,
}: {
  icon: typeof Target;
  eyebrow: string;
  title: string;
  items: string[];
}) {
  if (!items.length) return null;

  const Icon = icon;

  return (
    <section className="rounded-lg border border-border bg-card p-4 md:p-5">
      <SectionHeader icon={Icon} eyebrow={eyebrow} title={title} />
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-5">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
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

function TopicSelect({
  topicSlug,
  onChange,
  className = "",
}: {
  topicSlug: string | null;
  onChange: (slug: TopicSlug | null) => void;
  className?: string;
}) {
  return (
    <select
      value={topicSlug ?? ""}
      onChange={(e) => onChange(normalizeTopicSlug(e.target.value))}
      className={`rounded-md border border-border bg-input px-3 py-2 text-sm ${className}`}
    >
      <option value="">Weakest Topic (auto)</option>
      {TOPIC_CATEGORIES.map((cat) => (
        <optgroup key={cat} label={cat}>
          {TOPICS.filter((t) => t.category === cat).map((t) => (
            <option key={t.slug} value={t.slug}>
              {t.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

function LanguageSelect({
  lang,
  onChange,
  className = "",
}: {
  lang: Lang;
  onChange: (lang: Lang) => void;
  className?: string;
}) {
  return (
    <select
      value={lang}
      onChange={(e) => onChange(e.target.value as Lang)}
      className={`rounded-md border border-border bg-input px-3 py-2 text-sm font-mono ${className}`}
    >
      {(Object.keys(LANG_LABELS) as Lang[]).map((l) => (
        <option key={l} value={l}>
          {LANG_LABELS[l]}
        </option>
      ))}
    </select>
  );
}

function PracticeWorkspace({
  data,
  active,
  activeId,
  isLoading,
  onSelect,
  onNewProblem,
  showNewProblem,
  recommendation,
}: {
  data: PracticeData | undefined;
  active: PracticeProblem | null;
  activeId: string | null;
  isLoading: boolean;
  onSelect: (id: string) => void;
  onNewProblem: () => void;
  showNewProblem: boolean;
  recommendation: PracticeRecommendationView | null | undefined;
}) {
  return (
    <div className="space-y-4">
      {showNewProblem && (
        <button
          type="button"
          onClick={onNewProblem}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> New problem
        </button>
      )}

      {isLoading && (
        <div className="grid lg:grid-cols-[260px_1fr] gap-6">
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      )}
      {data && data.problems.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No problems yet. Click "Generate a problem" to get one.
        </p>
      )}

      {data && data.problems.length > 0 && <RecommendationPanel recommendation={recommendation} />}

      {data && data.problems.length > 0 && (
        <div className="grid lg:grid-cols-[260px_1fr] gap-4 md:gap-6 min-w-0">
          <aside className="space-y-2 w-full overflow-hidden min-w-0">
            {data.problems.map((p) => {
              const view = buildPracticeProblemView(p);
              const historyItem = data.practiceHistory?.find((item) => item.id === p.id) ?? null;
              const latestAttempt = historyItem?.latestAttempt ?? null;
              const attemptSpeed = formatAttemptSpeed(latestAttempt?.speedSeconds ?? null);
              return (
                <button
                  key={p.id}
                  onClick={() => onSelect(p.id)}
                  className={`w-full min-w-0 text-left rounded-md border p-3 transition ${
                    activeId === p.id
                      ? "border-accent bg-accent/10"
                      : "border-border bg-card hover:border-accent/40"
                  }`}
                >
                  <div className="text-sm font-medium truncate min-w-0 max-w-full">{p.title}</div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {historyItem?.masteryBand ? (
                      <Pill tone="success">{historyItem.masteryBand}</Pill>
                    ) : (
                      view.masteryBand && <Pill tone="success">{view.masteryBand}</Pill>
                    )}
                    {historyItem?.curriculumNodeId ? (
                      <Pill tone="accent">{historyItem.curriculumNodeId}</Pill>
                    ) : (
                      view.curriculumNodeId && <Pill tone="accent">{view.curriculumNodeId}</Pill>
                    )}
                    {!historyItem?.masteryBand && !view.masteryBand && p.topic_slug && (
                      <Pill>{p.topic_slug}</Pill>
                    )}
                  </div>
                  {historyItem?.objective && (
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
                      {historyItem.objective}
                    </p>
                  )}
                  {historyItem && (
                    <div className="mt-2 space-y-1 text-[11px] leading-4 text-muted-foreground">
                      <p>
                        {historyItem.visibleTestCount} visible{" "}
                        {historyItem.visibleTestCount === 1 ? "test" : "tests"},{" "}
                        {historyItem.hintCount} {historyItem.hintCount === 1 ? "hint" : "hints"}
                      </p>
                      {latestAttempt ? (
                        <p>
                          Last: {latestAttempt.status}, {latestAttempt.visible.passed}/
                          {latestAttempt.visible.total} visible, {latestAttempt.correctnessPercent}%
                          score
                          {attemptSpeed ? `, ${attemptSpeed}` : ""}
                        </p>
                      ) : (
                        <p>No attempts yet.</p>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </aside>

          {active ? <ProblemWorkspace problem={active} /> : null}
        </div>
      )}
    </div>
  );
}

function getRunOutputToneClass(tone: PracticeRunOutputTone) {
  switch (tone) {
    case "success":
      return "border-success/30 bg-success/10 text-success";
    case "destructive":
      return "border-destructive/30 bg-destructive/10 text-destructive";
    case "muted":
      return "border-border bg-background text-muted-foreground";
  }
}

function PracticeRunOutputPanel({ state }: { state: PracticeRunOutputState }) {
  const toneClass = getRunOutputToneClass(state.tone);

  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Output
          </p>
          <h3 className="text-sm font-semibold leading-snug">{state.title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{state.statusDetail}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {state.exitCode !== null && (
            <span className="font-mono text-[10px] text-muted-foreground">
              exit {state.exitCode}
            </span>
          )}
          <span
            className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest ${toneClass}`}
          >
            {state.statusLabel}
          </span>
        </div>
      </div>

      {state.mode === "visible-tests" && state.testResults.length > 0 && (
        <ul className="space-y-2">
          {state.testResults.map((result) => (
            <li
              key={result.id}
              className={`rounded-md border p-3 ${
                result.passed
                  ? "border-success/25 bg-success/5"
                  : "border-destructive/25 bg-destructive/5"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex min-w-0 items-start gap-2">
                  {result.passed ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                  ) : (
                    <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                  )}
                  <p className="min-w-0 break-words text-xs font-medium">{result.name}</p>
                </div>
                <span
                  className={`font-mono text-[10px] uppercase tracking-widest ${
                    result.passed ? "text-success" : "text-destructive"
                  }`}
                >
                  {result.passed ? "Passed" : "Failed"}
                </span>
              </div>
              <dl className="mt-3 grid gap-2 text-[11px] sm:grid-cols-2">
                <div className="min-w-0 rounded-sm border border-border/70 bg-background/70 p-2">
                  <dt className="font-mono uppercase tracking-widest text-muted-foreground">
                    Expected
                  </dt>
                  <dd className="mt-1 break-words font-mono">
                    {formatPracticeTestValue(result.expected)}
                  </dd>
                </div>
                <div className="min-w-0 rounded-sm border border-border/70 bg-background/70 p-2">
                  <dt className="font-mono uppercase tracking-widest text-muted-foreground">
                    Actual
                  </dt>
                  <dd className="mt-1 break-words font-mono">
                    {formatPracticeTestValue(result.actual)}
                  </dd>
                </div>
              </dl>
              {result.error && (
                <p className="mt-2 rounded-sm border border-destructive/20 bg-destructive/5 p-2 text-[11px] text-destructive">
                  {result.error}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {state.emptyMessage && (
        <p className="rounded-md border border-border bg-background/60 p-3 text-xs text-muted-foreground">
          {state.emptyMessage}
        </p>
      )}

      {state.rawOutput && (
        <div className="mt-3 border-t border-border pt-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Program output
          </p>
          <pre className="mt-2 min-h-[72px] whitespace-pre-wrap break-words rounded-md border border-border bg-background/70 p-3 font-mono text-xs">
            {state.rawOutput}
          </pre>
        </div>
      )}
    </section>
  );
}

function ProblemWorkspace({ problem }: { problem: PracticeProblem }) {
  const lang = (problem.language as Lang) ?? "python";
  const nav = useNavigate();
  const [code, setCode] = useState<string>(problem.starter_code || "");
  const [stdin, setStdin] = useState("");
  const [running, setRunning] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [editorLang, setEditorLang] = useState<Lang>(lang);
  const [output, setOutput] = useState<PracticeRunOutput | null>(null);
  const [editorSettings, setEditorSettings] = useState<EditorSettings>(loadEditorSettings);
  const [fullscreen, setFullscreen] = useState(false);
  const [revealedHintOrders, setRevealedHintOrders] = useState<number[]>([]);
  const [reviewQuality, setReviewQuality] = useState<PracticeReviewQualityInput>(
    emptyPracticeReviewQuality,
  );
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString());

  const runFn = useServerFn(runCode);
  const submitAttemptFn = useServerFn(submitPracticeAttempt);
  const recordPracticeEventFn = useServerFn(recordPracticeEvent);
  const reviewFn = useServerFn(reviewCode);
  const { track } = useTelemetry();
  const view = buildPracticeProblemView(problem);
  const visibleTestRunInput = buildPracticeVisibleTestRunInput(view, editorLang);
  const runnerState = buildPracticeRunOutputState({
    output,
    running,
    visibleTestCount: view.visibleTests.length,
    canRunVisibleTests: Boolean(visibleTestRunInput),
  });

  useEffect(() => {
    setCode(problem.starter_code || "");
    setEditorLang(lang);
    setOutput(null);
    setRevealedHintOrders([]);
    setReviewQuality(emptyPracticeReviewQuality());
    setStartedAt(new Date().toISOString());
  }, [problem.id, problem.starter_code, lang]);

  const trackPracticeEventFallback = (event: RecordPracticeEventInput) => {
    void track(event.eventType, {
      practiceProblemId: event.practiceProblemId ?? null,
      practiceAttemptId: event.practiceAttemptId ?? null,
      topic: event.topicSlug ?? null,
      curriculumNodeId: event.curriculumNodeId ?? null,
      masteryBand: event.masteryBand ?? null,
      ...event.payload,
    });
  };

  const recordPracticeEventWithFallback = (event: RecordPracticeEventInput) => {
    void recordPracticeEventFn({ data: event })
      .then((result) => {
        const practiceEvent = result as RecordPracticeEventResult;
        if (!practiceEvent.ok) trackPracticeEventFallback(event);
      })
      .catch((error: unknown) => {
        console.error("recordPracticeEvent failed:", error);
        trackPracticeEventFallback(event);
      });
  };

  const onHintReveal = (hint: PracticeProblemHint) => {
    const revealState = markPracticeHintRevealed(revealedHintOrders, hint.order);
    if (!revealState.shouldRecord) return;

    const event = buildPracticeHintUsageEvent({
      practiceProblemId: problem.id,
      topicSlug: problem.topic_slug,
      view,
      hint,
      revealedHintOrders,
    });
    setRevealedHintOrders(revealState.revealedHintOrders);
    recordPracticeEventWithFallback(event);
  };

  const onRun = async () => {
    if (!code.trim()) {
      toast.error("Write some code first.");
      return;
    }
    setRunning(true);
    setOutput(null);
    const runStartedAt = performance.now();
    try {
      const r = await runFn({
        data: {
          code,
          language: editorLang,
          stdin,
          testRun: visibleTestRunInput,
          environment: getBillingEnvironment(),
        },
      });
      const durationMs = Math.round(performance.now() - runStartedAt);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      setOutput({
        stdout: r.stdout || r.compileStderr || "",
        stderr: r.stderr || "",
        exit: r.exitCode ?? 0,
        testResults: r.testResults,
        testSummary: r.testSummary,
      });
      if (visibleTestRunInput) {
        recordPracticeEventWithFallback(
          buildPracticeVisibleTestRunEvent({
            practiceProblemId: problem.id,
            topicSlug: problem.topic_slug,
            view,
            language: editorLang,
            testSummary: r.testSummary ?? null,
            resultCount: r.testResults?.length ?? null,
            durationMs,
          }),
        );
      }
    } finally {
      setRunning(false);
    }
  };

  const onSubmit = async () => {
    if (!code.trim()) {
      toast.error("Write some code first.");
      return;
    }
    setReviewing(true);
    try {
      const attemptResponse = await submitAttemptFn({
        data: {
          practiceProblemId: problem.id,
          code,
          language: editorLang,
          hintCount: revealedHintOrders.length,
          startedAt,
          reviewQuality,
          environment: getBillingEnvironment(),
        },
      });
      const attempt = attemptResponse as PracticeAttemptResult;
      if (!attempt.ok) {
        toast.error(attempt.error);
        return;
      }

      const r = await reviewFn({
        data: { code, language: editorLang, environment: getBillingEnvironment() },
      });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success("Review complete");
      track("practice_solved", {
        topic: problem.topic_slug ?? null,
        language: editorLang,
        attemptId: attempt.attemptId ?? null,
        correctnessScore: attempt.correctnessScore ?? null,
        reviewQualityScore: attempt.reviewQualityScore ?? null,
        hiddenTestsPassed: attempt.hiddenSummary?.passed ?? null,
        hiddenTestsTotal: attempt.hiddenSummary?.total ?? null,
      });
      nav({ to: "/submission/$submissionId", params: { submissionId: r.submissionId! } });
    } finally {
      setReviewing(false);
    }
  };

  return (
    <article className="grid min-w-0 items-start gap-4 md:gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)]">
      <div className="min-w-0 space-y-4">
        <WorkflowStrip view={view} />
        <ProblemBrief problem={problem} view={view} />
        <ExamplesSection view={view} />
        <div className="grid gap-4 md:grid-cols-2">
          <FunctionSignatureSection view={view} language={editorLang} />
          <VisibleTestsSection view={view} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <ChecklistSection
            icon={ListChecks}
            eyebrow="Limits"
            title="Constraints"
            items={view.constraints}
          />
          <ChecklistSection
            icon={BadgeCheck}
            eyebrow="Adapt"
            title="Success criteria"
            items={view.successCriteria}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <HintsSection
            key={problem.id}
            view={view}
            revealedHintOrders={revealedHintOrders}
            onHintReveal={onHintReveal}
          />
          <ChecklistSection
            icon={RouteIcon}
            eyebrow="Review"
            title="Hidden-test themes"
            items={view.hiddenTestThemes}
          />
        </div>
        <ReviewQualitySection value={reviewQuality} onChange={setReviewQuality} />
      </div>

      <div className="min-w-0 space-y-4 xl:sticky xl:top-4">
        <CodeWorkspace
          value={code}
          language={editorLang}
          onChange={setCode}
          settings={editorSettings}
          onSettingsChange={setEditorSettings}
          fullscreen={fullscreen}
          onFullscreenChange={setFullscreen}
          resetLabel="Reset to starter code"
          onReset={() => setCode(problem.starter_code || "")}
          height="42vh"
          label="Editor"
          showLanguageLabel={false}
          rightControls={
            <>
              <select
                value={editorLang}
                onChange={(e) => setEditorLang(e.target.value as Lang)}
                className="rounded-md border border-border bg-input px-2 py-1 text-xs font-mono"
              >
                {(Object.keys(LANG_LABELS) as Lang[]).map((l) => (
                  <option key={l} value={l}>
                    {LANG_LABELS[l]}
                  </option>
                ))}
              </select>
              <div className="flex gap-1 ml-1 pl-1 border-l border-border">
                <button
                  onClick={onRun}
                  disabled={running || reviewing}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[10px] hover:bg-accent/10 disabled:opacity-50"
                >
                  <Play className="size-3" />{" "}
                  {running ? "Running..." : visibleTestRunInput ? "Run tests" : "Run"}
                </button>
                <button
                  onClick={onSubmit}
                  disabled={running || reviewing}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2 py-1 text-[10px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  <Send className="size-3" /> {reviewing ? "Reviewing..." : "Submit"}
                </button>
              </div>
            </>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
          <div className="rounded-lg border border-border bg-card p-4">
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Stdin (optional)
            </label>
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              rows={4}
              className="mt-2 w-full rounded-md border border-border bg-input p-2 text-xs font-mono"
              placeholder="Lines passed to your program's standard input"
            />
            {view.visibleTests.length > 0 && visibleTestRunInput && (
              <p className="mt-2 text-xs text-muted-foreground">
                Visible tests use the function signature. Stdin is used when no visible test data is
                stored.
              </p>
            )}
            {view.visibleTests.length > 0 && !visibleTestRunInput && (
              <p className="mt-2 text-xs text-muted-foreground">
                Visible tests need a supported function signature for this language.
              </p>
            )}
          </div>
          <PracticeRunOutputPanel state={runnerState} />
        </div>
      </div>
    </article>
  );
}
