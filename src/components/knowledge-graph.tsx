import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3-force";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

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

interface Transform {
  x: number;
  y: number;
  k: number;
}

const VB_W = 800;
const VB_H = 550;
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 3.0;
const ZOOM_STEP = 0.2;

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
  const [simNodes, setSimNodes] = useState<SimNode[]>([]);
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, k: 1 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isLight =
    theme === "light" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: light)").matches);

  const colors = useMemo(
    () =>
      isLight
        ? {
            bg: "oklch(0.97 0.008 80)",
            circleFill: "oklch(0.93 0.008 75)",
            edgeDefault: "oklch(0.7 0.008 75)",
            edgeHovered: "oklch(0.55 0.16 35)",
            edgeConnected: "oklch(0.55 0.008 70)",
            arrowhead: "oklch(0.7 0.008 75)",
            tooltipBg: "oklch(0.99 0.005 80)",
            tooltipBorder: "oklch(0.85 0.008 75)",
            tooltipTitle: "oklch(0.2 0.012 60)",
            tooltipSub: "oklch(0.45 0.018 70)",
            labelDim: "oklch(0.5 0.01 70)",
            labelHover: "oklch(0.2 0.012 60)",
            labelLinked: "oklch(0.25 0.012 60)",
            labelDefault: "oklch(0.45 0.01 70)",
            legendText: "oklch(0.45 0.018 70)",
          }
        : {
            bg: "oklch(0.16 0.012 60)",
            circleFill: "oklch(0.18 0.012 60)",
            edgeDefault: "oklch(0.28 0.012 60)",
            edgeHovered: "oklch(0.82 0.18 40)",
            edgeConnected: "oklch(0.5 0.012 60)",
            arrowhead: "oklch(0.3 0.012 60)",
            tooltipBg: "oklch(0.22 0.012 60)",
            tooltipBorder: "oklch(0.35 0.012 60)",
            tooltipTitle: "oklch(0.94 0.018 75)",
            tooltipSub: "oklch(0.68 0.018 70)",
            labelDim: "oklch(0.55 0.018 70)",
            labelHover: "oklch(0.94 0.018 75)",
            labelLinked: "oklch(0.82 0.018 75)",
            labelDefault: "oklch(0.55 0.018 70)",
            legendText: "oklch(0.68 0.018 70)",
          },
    [isLight],
  );

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

  const connectedSlugs = useMemo(() => {
    if (!hoveredSlug) return new Set<string>();
    const s = new Set<string>([hoveredSlug]);
    links.forEach((l) => {
      if (l.source === hoveredSlug) s.add(l.target);
      if (l.target === hoveredSlug) s.add(l.source);
    });
    return s;
  }, [hoveredSlug, links]);

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
          .distance(95),
      )
      .force("charge", d3.forceManyBody().strength(-350))
      .force("center", d3.forceCenter(VB_W / 2, VB_H / 2))
      .force("collide", d3.forceCollide(55))
      .alphaDecay(0.015)
      .stop();

    const margin = 70;
    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

    let raf = 0;
    sim.on("tick", () => {
      for (const n of simNodesCopy) {
        n.x = clamp(n.x, margin, VB_W - margin);
        n.y = clamp(n.y, margin, VB_H - margin);
      }
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
  }, [nodes, links]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const getSvgPoint = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const svgPt = pt.matrixTransform(ctm.inverse());
    return { x: svgPt.x, y: svgPt.y };
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent<SVGSVGElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const { x: mx, y: my } = getSvgPoint(e.clientX, e.clientY);
      const dy = -e.deltaY;
      const factor = dy > 0 ? 1 + ZOOM_STEP : 1 / (1 + ZOOM_STEP);

      setTransform((prev) => {
        const newK = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev.k * factor));
        const kRatio = newK / prev.k;
        return {
          x: mx - (mx - prev.x) * kRatio,
          y: my - (my - prev.y) * kRatio,
          k: newK,
        };
      });
    },
    [getSvgPoint],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (e.button !== 0) return;
      setDragging(true);
      setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    },
    [transform.x, transform.y],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!dragging) return;
      setTransform((prev) => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      }));
    },
    [dragging, dragStart],
  );

  const handleMouseUp = useCallback(() => {
    setDragging(false);
  }, []);

  const zoomIn = useCallback(() => {
    setTransform((prev) => ({ ...prev, k: Math.min(MAX_ZOOM, prev.k + ZOOM_STEP) }));
  }, []);

  const zoomOut = useCallback(() => {
    setTransform((prev) => ({ ...prev, k: Math.max(MIN_ZOOM, prev.k - ZOOM_STEP) }));
  }, []);

  const resetView = useCallback(() => {
    setTransform({ x: 0, y: 0, k: 1 });
  }, []);

  const hasProgress = progress.length > 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-lg"
      style={{ background: colors.bg, aspectRatio: `${VB_W}/${VB_H}` }}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: dragging ? "grabbing" : "grab" }}
      >
        <defs>
          <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="edge-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <marker
            id="arrowhead"
            viewBox="0 0 10 7"
            refX={10}
            refY={3.5}
            markerWidth={6}
            markerHeight={5}
            orient="auto-start-reverse"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill={colors.arrowhead} />
          </marker>
        </defs>

        <g transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}>
          {links.map((link, i) => {
            const src = simNodes.find((n) => n.slug === link.source);
            const tgt = simNodes.find((n) => n.slug === link.target);
            if (!src || !tgt) return null;

            const isHovered = hoveredSlug === link.source || hoveredSlug === link.target;
            const isConnected =
              hoveredSlug && connectedSlugs.has(link.source) && connectedSlugs.has(link.target);

            let edgeOpacity: number;
            let edgeStroke: string;
            let edgeWidth: number;
            let edgeFilter: string | undefined;

            if (!hoveredSlug) {
              edgeOpacity = 0.5;
              edgeStroke = colors.edgeDefault;
              edgeWidth = 0.8;
              edgeFilter = undefined;
            } else if (isHovered) {
              edgeOpacity = 1;
              edgeStroke = colors.edgeHovered;
              edgeWidth = 2.5;
              edgeFilter = "url(#edge-glow)";
            } else if (isConnected) {
              edgeOpacity = 0.7;
              edgeStroke = colors.edgeConnected;
              edgeWidth = 1.2;
              edgeFilter = undefined;
            } else {
              edgeOpacity = 0.08;
              edgeStroke = colors.edgeDefault;
              edgeWidth = 0.6;
              edgeFilter = undefined;
            }

            return (
              <line
                key={`e-${i}`}
                x1={src.x}
                y1={src.y}
                x2={tgt.x}
                y2={tgt.y}
                stroke={edgeStroke}
                strokeWidth={edgeWidth}
                opacity={edgeOpacity}
                filter={edgeFilter}
                markerEnd={isHovered ? "url(#arrowhead)" : undefined}
                style={{ transition: "opacity 200ms, stroke-width 200ms" }}
              />
            );
          })}

          {simNodes.map((node) => {
            const isHovered = hoveredSlug === node.slug;
            const isLinked = hoveredSlug && !isHovered && connectedSlugs.has(node.slug);
            const isDimmed = hoveredSlug && !isHovered && !isLinked;

            const r = 14 + (node.mastery ?? 0) * 10;
            const nodeOpacity = isDimmed ? 0.2 : 1;
            const strokeW = isHovered ? 2.5 : isLinked ? 2 : 1.5;

            const labelLines =
              node.name.length > 14
                ? [
                    node.name.slice(0, Math.floor(node.name.length / 2)),
                    node.name.slice(Math.floor(node.name.length / 2)),
                  ]
                : [node.name];

            const labelOpacity = isDimmed ? 0.15 : isHovered ? 1 : isLinked ? 0.9 : 0.85;

            return (
              <g
                key={node.slug}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredSlug(node.slug)}
                onMouseLeave={() => setHoveredSlug(null)}
                opacity={nodeOpacity}
                style={{ transition: "opacity 200ms" }}
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isHovered ? r + 4 : isLinked ? r + 2 : r}
                  fill={
                    isHovered
                      ? masteryBg(node.mastery)
                      : isLinked
                        ? masteryBg(node.mastery)
                        : colors.circleFill
                  }
                  stroke={masteryColor(node.mastery)}
                  strokeWidth={strokeW}
                  filter={isHovered ? "url(#neon-glow)" : undefined}
                  style={{ transition: "r 200ms, stroke-width 200ms" }}
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
                  style={{
                    transform: "rotate(-90deg)",
                    transformOrigin: `${node.x}px ${node.y}px`,
                    transition: "opacity 200ms",
                  }}
                />
                {labelLines.map((line, li) => (
                  <text
                    key={li}
                    x={node.x}
                    y={node.y + r + 14 + li * 11}
                    textAnchor="middle"
                    className="text-[10px] font-mono"
                    fill={
                      isHovered
                        ? colors.labelHover
                        : isLinked
                          ? colors.labelLinked
                          : colors.labelDefault
                    }
                    opacity={labelOpacity}
                    style={{ transition: "opacity 200ms" }}
                  >
                    {line}
                  </text>
                ))}
              </g>
            );
          })}

          {hoveredSlug &&
            (() => {
              const hn = simNodes.find((n) => n.slug === hoveredSlug);
              if (!hn) return null;
              const labelWidth = Math.max(hn.name.length * 7, 100);
              const tx = Math.min(Math.max(hn.x, labelWidth / 2 + 8), VB_W - labelWidth / 2 - 8);
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
                    fill={colors.tooltipBg}
                    stroke={colors.tooltipBorder}
                    strokeWidth={1}
                  />
                  {lines.map((l, i) => (
                    <text
                      key={i}
                      x={tx}
                      y={ty - boxH + 24 + i * 14}
                      textAnchor="middle"
                      className={i === 0 ? "text-xs font-medium" : "text-[10px] font-mono"}
                      fill={i === 0 ? colors.tooltipTitle : colors.tooltipSub}
                    >
                      {l}
                    </text>
                  ))}
                </g>
              );
            })()}
        </g>
      </svg>

      <div className="absolute top-3 right-3 flex gap-1 z-10">
        <button
          type="button"
          onClick={zoomIn}
          className="inline-flex items-center justify-center size-7 rounded-md bg-card/70 backdrop-blur-sm border border-border text-muted-foreground hover:text-foreground hover:bg-card/90 transition"
          title="Zoom in"
        >
          <ZoomIn className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={zoomOut}
          className="inline-flex items-center justify-center size-7 rounded-md bg-card/70 backdrop-blur-sm border border-border text-muted-foreground hover:text-foreground hover:bg-card/90 transition"
          title="Zoom out"
        >
          <ZoomOut className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={resetView}
          className="inline-flex items-center justify-center size-7 rounded-md bg-card/70 backdrop-blur-sm border border-border text-muted-foreground hover:text-foreground hover:bg-card/90 transition"
          title="Reset view"
        >
          <Maximize2 className="size-3.5" />
        </button>
      </div>

      {!dragging && simNodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
          Loading graph…
        </div>
      )}

      {hasProgress && (
        <div className="absolute bottom-3 left-3 flex items-center gap-3 bg-card/70 backdrop-blur-sm border border-border rounded-md px-3 py-1.5 z-10">
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
      <span className="inline-block size-2 rounded-full" style={{ background: color }} />
      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
    </div>
  );
}
