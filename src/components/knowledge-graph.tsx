import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3-force";

interface TopicRow {
  slug: string;
  name: string;
  category: string;
}

interface ProgressRow {
  topic_slug: string;
  mastery: number;
  attempts: number;
}

interface Props {
  topics: TopicRow[];
  progress: ProgressRow[];
}

const PREREQUISITE_EDGES: Array<{ source: string; target: string }> = [
  { source: "arrays", target: "two-pointers" },
  { source: "arrays", target: "sliding-window" },
  { source: "arrays", target: "hashing" },
  { source: "arrays", target: "sorting" },
  { source: "sorting", target: "binary-search" },
  { source: "linked-lists", target: "stacks" },
  { source: "linked-lists", target: "queues" },
  { source: "stacks", target: "recursion" },
  { source: "recursion", target: "trees" },
  { source: "recursion", target: "backtracking" },
  { source: "recursion", target: "dp" },
  { source: "trees", target: "bst" },
  { source: "trees", target: "heaps" },
  { source: "trees", target: "graphs" },
  { source: "graphs", target: "dp" },
  { source: "greedy", target: "dp" },
  { source: "two-pointers", target: "sliding-window" },
  { source: "binary-search", target: "dp" },
  { source: "bit-manipulation", target: "hashing" },
  { source: "complexity", target: "sorting" },
];

interface SimNode {
  slug: string;
  name: string;
  category: string;
  mastery: number | null;
  attempts: number;
  x: number;
  y: number;
}

function masteryColor(m: number | null): string {
  if (m === null) return "oklch(0.38 0.01 60 / 0.6)";
  if (m < 0.3) return "oklch(0.48 0.02 65)";
  if (m < 0.7) return "oklch(0.7 0.16 35)";
  return "oklch(0.68 0.13 150)";
}

function masteryBg(m: number | null): string {
  if (m === null) return "oklch(0.38 0.01 60 / 0.15)";
  if (m < 0.3) return "oklch(0.48 0.02 65 / 0.15)";
  if (m < 0.7) return "oklch(0.7 0.16 35 / 0.18)";
  return "oklch(0.68 0.13 150 / 0.18)";
}

export function KnowledgeGraph({ topics, progress }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 640, h: 440 });
  const [simNodes, setSimNodes] = useState<SimNode[]>([]);
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      setDims({ w, h: Math.max(380, w * 0.65) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const progressMap = useMemo(() => {
    const m = new Map<string, ProgressRow>();
    progress.forEach((p) => m.set(p.topic_slug, p));
    return m;
  }, [progress]);

  const nodes = useMemo(() => {
    return topics.map((t) => {
      const p = progressMap.get(t.slug);
      return {
        slug: t.slug,
        name: t.name,
        category: t.category,
        mastery: p?.mastery ?? null,
        attempts: p?.attempts ?? 0,
      };
    });
  }, [topics, progressMap]);

  const links = useMemo(() => {
    const slugs = new Set(topics.map((t) => t.slug));
    return PREREQUISITE_EDGES.filter((e) => slugs.has(e.source) && slugs.has(e.target));
  }, [topics]);

  useEffect(() => {
    if (nodes.length === 0) return;

    const simNodesCopy = nodes.map((n) => ({ ...n })) as any[];
    const simLinksCopy = links.map((l) => ({ ...l }));

    const sim = d3
      .forceSimulation<any>(simNodesCopy)
      .force(
        "link",
        d3
          .forceLink<any, any>(simLinksCopy)
          .id((d: any) => d.slug)
          .distance(100),
      )
      .force("charge", d3.forceManyBody().strength(-350))
      .force("center", d3.forceCenter(dims.w / 2, dims.h / 2))
      .force("collide", d3.forceCollide(55))
      .alphaDecay(0.015)
      .stop();

    let raf = 0;
    sim.on("tick", () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        setSimNodes([...simNodesCopy] as SimNode[]);
        raf = 0;
      });
    });

    sim.alpha(1).restart();

    return () => {
      sim.stop();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [nodes, links, dims]);

  const hasProgress = progress.length > 0;

  return (
    <div ref={containerRef} className="w-full select-none">
      {simNodes.length > 0 ? (
        <svg
          width={dims.w}
          height={dims.h}
          className="overflow-visible"
          style={{ background: "oklch(0.16 0.012 60)" }}
        >
          <defs>
            <marker
              id="arrowhead"
              viewBox="0 0 10 7"
              refX={10}
              refY={3.5}
              markerWidth={6}
              markerHeight={5}
              orient="auto-start-reverse"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="oklch(0.3 0.012 60)" />
            </marker>
          </defs>

          {links.map((link, i) => {
            const src = simNodes.find((n) => n.slug === link.source);
            const tgt = simNodes.find((n) => n.slug === link.target);
            if (!src || !tgt) return null;
            const highlight =
              hoveredSlug === link.source || hoveredSlug === link.target;
            return (
              <line
                key={`e-${i}`}
                x1={src.x}
                y1={src.y}
                x2={tgt.x}
                y2={tgt.y}
                stroke={highlight ? "oklch(0.5 0.012 60)" : "oklch(0.28 0.012 60)"}
                strokeWidth={highlight ? 1.5 : 0.8}
                markerEnd="url(#arrowhead)"
              />
            );
          })}

          {simNodes.map((node) => {
            const h = hoveredSlug === node.slug;
            const r = 14 + (node.mastery ?? 0) * 10;
            const labelLines = node.name.length > 14
              ? [node.name.slice(0, Math.floor(node.name.length / 2)), node.name.slice(Math.floor(node.name.length / 2))]
              : [node.name];

            return (
              <g
                key={node.slug}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredSlug(node.slug)}
                onMouseLeave={() => setHoveredSlug(null)}
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={h ? r + 2 : r}
                  fill={h ? masteryBg(node.mastery) : "oklch(0.18 0.012 60)"}
                  stroke={masteryColor(node.mastery)}
                  strokeWidth={h ? 2.5 : 1.5}
                  opacity={h ? 1 : hoveredSlug ? 0.4 : 1}
                  style={{ transition: "opacity 150ms, stroke-width 150ms" }}
                />
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={r}
                  fill="none"
                  stroke={masteryColor(node.mastery)}
                  strokeWidth={1.5}
                  strokeDasharray={`${(node.mastery ?? 0) * 2 * Math.PI * r} ${2 * Math.PI * r}`}
                  strokeLinecap="round"
                  opacity={node.mastery !== null ? 0.4 : 0}
                  style={{ transform: "rotate(-90deg)", transformOrigin: `${node.x}px ${node.y}px`, transition: "opacity 150ms" }}
                />
                {labelLines.map((line, li) => (
                  <text
                    key={li}
                    x={node.x}
                    y={node.y + r + 14 + li * 11}
                    textAnchor="middle"
                    className="text-[10px] font-mono"
                    fill={h ? "oklch(0.94 0.018 75)" : "oklch(0.55 0.018 70)"}
                    opacity={h ? 1 : hoveredSlug ? 0.35 : 0.9}
                    style={{ transition: "opacity 150ms" }}
                  >
                    {line}
                  </text>
                ))}
              </g>
            );
          })}

          {hoveredSlug && (() => {
            const hn = simNodes.find((n) => n.slug === hoveredSlug);
            if (!hn) return null;
            const labelWidth = Math.max(hn.name.length * 7, 100);
            const tx = Math.min(Math.max(hn.x, labelWidth / 2 + 8), dims.w - labelWidth / 2 - 8);
            const ty = hn.y - 50;
            const lines = [
              hn.name,
              hn.mastery !== null
                ? `Mastery ${Math.round(hn.mastery * 100)}% · ${hn.attempts} attempts`
                : "Not yet reviewed",
            ];
            const boxH = lines.length * 14 + 20;
            return (
              <g>
                <rect
                  x={tx - labelWidth / 2 - 10}
                  y={ty - boxH + 10}
                  width={labelWidth + 20}
                  height={boxH}
                  rx={6}
                  fill="oklch(0.22 0.012 60)"
                  stroke="oklch(0.35 0.012 60)"
                  strokeWidth={1}
                />
                {lines.map((l, i) => (
                  <text
                    key={i}
                    x={tx}
                    y={ty - boxH + 24 + i * 14}
                    textAnchor="middle"
                    className={i === 0 ? "text-xs font-medium" : "text-[10px] font-mono"}
                    fill={i === 0 ? "oklch(0.94 0.018 75)" : "oklch(0.68 0.018 70)"}
                  >
                    {l}
                  </text>
                ))}
              </g>
            );
          })()}
        </svg>
      ) : (
        <div className="flex items-center justify-center text-sm text-muted-foreground" style={{ height: dims.h }}>
          Loading graph…
        </div>
      )}

      {hasProgress && (
        <div className="flex items-center justify-center gap-4 mt-3 pb-1">
          <LegendItem color="oklch(0.48 0.02 65)" label="Starting" />
          <LegendItem color="oklch(0.7 0.16 35)" label="Growing" />
          <LegendItem color="oklch(0.68 0.13 150)" label="Mastered" />
          <LegendItem color="oklch(0.38 0.01 60 / 0.6)" label="Untouched" />
        </div>
      )}
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="inline-block size-2.5 rounded-full"
        style={{ background: color }}
      />
      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
    </div>
  );
}
