import { createFileRoute } from "@tanstack/react-router";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;
function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }
  return _supabase;
}

const CARD_W = 1200;
const CARD_H = 630;

function escapeXml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
  const avgCharW = fontSize * 0.55;
  const maxCharsPerLine = Math.floor(maxWidth / avgCharW);
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (test.length > maxCharsPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 5);
}

function svgCard(sub: {
  language: string;
  summary: string | null;
  concepts: string[];
  created_at: string;
}): string {
  const langLabel =
    sub.language === "python"
      ? "Python"
      : sub.language === "javascript"
        ? "JavaScript"
        : sub.language === "java"
          ? "Java"
          : sub.language === "cpp"
            ? "C++"
            : sub.language;
  const summaryLines = sub.summary ? wrapText(sub.summary, CARD_W - 120, 22) : [];
  const date = new Date(sub.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const conceptTags = sub.concepts.slice(0, 6);
  const conceptsXml = conceptTags
    .map(
      (c, i) =>
        `<rect x="${80 + i * 110}" y="${CARD_H - 140}" width="${100}" height="28" rx="4" fill="oklch(0.7 0.16 35 / 0.15)"/><text x="${80 + i * 110 + 50}" y="${CARD_H - 121}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="13" fill="oklch(0.78 0.16 35)">${escapeXml(c)}</text>`,
    )
    .join("");

  const summaryY = 260;
  const summaryXml = summaryLines
    .map(
      (line, i) =>
        `<text x="80" y="${summaryY + i * 30}" font-family="Inter, sans-serif" font-size="22" fill="oklch(0.75 0.018 70)">${escapeXml(line)}</text>`,
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_W}" height="${CARD_H}" viewBox="0 0 ${CARD_W} ${CARD_H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="${CARD_W}" y2="${CARD_H}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="oklch(0.14 0.012 60)"/>
      <stop offset="100%" stop-color="oklch(0.18 0.012 60)"/>
    </linearGradient>
    <linearGradient id="accent-line" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="oklch(0.7 0.16 35)"/>
      <stop offset="100%" stop-color="oklch(0.7 0.16 35 / 0)"/>
    </linearGradient>
  </defs>

  <rect width="${CARD_W}" height="${CARD_H}" fill="url(#bg)"/>

  <rect x="0" y="0" width="${CARD_W}" height="4" fill="oklch(0.7 0.16 35)"/>

  <text x="80" y="100" font-family="Fraunces, Georgia, serif" font-size="52" font-weight="700" fill="oklch(0.94 0.018 75)" letter-spacing="-0.02em">CodeWise Review</text>

  <rect x="80" y="130" width="72" height="28" rx="14" fill="oklch(0.7 0.16 35 / 0.15)"/>
  <text x="116" y="149" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="13" fill="oklch(0.7 0.16 35)">${escapeXml(langLabel)}</text>

  <text x="${CARD_W - 80}" y="149" text-anchor="end" font-family="JetBrains Mono, monospace" font-size="14" fill="oklch(0.5 0.018 70)">${escapeXml(date)}</text>

  ${summaryXml}

  ${summaryLines.length === 0 ? `<text x="80" y="260" font-family="Inter, sans-serif" font-size="22" fill="oklch(0.45 0.018 70)" font-style="italic">No summary available.</text>` : ""}

  ${conceptsXml}

  <line x1="80" y1="${CARD_H - 70}" x2="${CARD_W - 80}" y2="${CARD_H - 70}" stroke="oklch(0.28 0.012 60)" stroke-width="1"/>

  <text x="80" y="${CARD_H - 40}" font-family="Inter, sans-serif" font-size="14" fill="oklch(0.45 0.018 70)">Shared from CodeWise, AI code reviewer for CS students</text>
  <text x="${CARD_W - 80}" y="${CARD_H - 40}" text-anchor="end" font-family="Fraunces, Georgia, serif" font-size="14" fill="oklch(0.5 0.018 70)">codewise.app</text>

  <rect x="${CARD_W - 170}" y="20" width="90" height="24" rx="4" fill="oklch(0.7 0.16 35 / 0.12)"/>
  <text x="${CARD_W - 125}" y="36" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" fill="oklch(0.7 0.16 35)" letter-spacing="0.1em">BETA</text>
</svg>`;
}

export const Route = createFileRoute("/api/public/og/$submissionId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { submissionId } = params;
        try {
          const supabase = getSupabase();
          const { data: sub, error } = await supabase
            .from("submissions")
            .select("*")
            .eq("id", submissionId)
            .maybeSingle();

          if (error || !sub) {
            return new Response(buildFallbackSvg(), {
              headers: {
                "content-type": "image/svg+xml",
                "cache-control": "public, max-age=300",
              },
            });
          }

          const svg = svgCard(sub);
          return new Response(svg, {
            headers: {
              "content-type": "image/svg+xml",
              "cache-control": "public, max-age=86400, s-maxage=86400",
            },
          });
        } catch (e) {
          console.error("OG image error:", e);
          return new Response(buildFallbackSvg(), {
            headers: {
              "content-type": "image/svg+xml",
              "cache-control": "public, max-age=300",
            },
          });
        }
      },
    },
  },
});

function buildFallbackSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_W}" height="${CARD_H}" viewBox="0 0 ${CARD_W} ${CARD_H}">
  <rect width="${CARD_W}" height="${CARD_H}" fill="oklch(0.16 0.012 60)"/>
  <rect x="0" y="0" width="${CARD_W}" height="4" fill="oklch(0.7 0.16 35)"/>
  <text x="${CARD_W / 2}" y="${CARD_H / 2 - 20}" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="48" font-weight="700" fill="oklch(0.94 0.018 75)">CodeWise</text>
  <text x="${CARD_W / 2}" y="${CARD_H / 2 + 30}" text-anchor="middle" font-family="Inter, sans-serif" font-size="20" fill="oklch(0.6 0.018 70)">AI code reviewer for CS students</text>
  <rect x="${CARD_W / 2 - 45}" y="${CARD_H - 80}" width="90" height="24" rx="4" fill="oklch(0.7 0.16 35 / 0.12)"/>
  <text x="${CARD_W / 2}" y="${CARD_H - 63}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" fill="oklch(0.7 0.16 35)" letter-spacing="0.1em">BETA</text>
</svg>`;
}
