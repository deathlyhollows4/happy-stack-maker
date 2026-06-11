/**
 * CodeWise Eval Harness
 *
 * Reads a labelled CSV corpus of buggy CS1/CS2 code snippets, sends each
 * through the Lovable AI Gateway with the same system prompt used by the
 * production reviewCode server fn, and tallies concept-detection metrics.
 *
 * Usage:
 *   npx tsx scripts/eval.ts [--corpus <path>] [--limit N] [--delay-ms N]
 *
 * CSV columns:
 *   code, language, expected_concepts
 *
 *   - code:              the student code snippet (quoted, may contain newlines)
 *   - language:          python | javascript | java | cpp
 *   - expected_concepts: comma-separated topic slugs (e.g. "arrays,hashing")
 *
 * Output (stdout): JSON object with per-concept precision/recall/F1, a
 * confusion matrix label→label, and per-sample detail array.
 *
 * Requires LOVABLE_API_KEY in environment (or .env via dotenv).
 */

import { z } from "zod";
import * as fs from "node:fs";
import * as path from "node:path";
import { extractJson } from "../src/lib/codewise.functions";
import {
  LANGS,
  ReviewIssueSchema,
  ReviewResponseSchema,
  VALID_TOPIC_SLUGS,
  SYSTEM_PROMPT,
} from "../src/lib/review.constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CsvRow {
  code: string;
  language: string;
  expected_concepts: string[];
  index: number;
}

interface EvalResult {
  index: number;
  expected: string[];
  predicted: string[];
  matched: string[];
  missed: string[];
  extra: string[];
  ok: boolean;
  error?: string;
  summary?: string;
}

interface PerConceptMetrics {
  tp: number;
  fp: number;
  fn: number;
  precision: number;
  recall: number;
  f1: number;
}

interface EvalReport {
  total_samples: number;
  successful: number;
  failed: number;
  micro_precision: number;
  micro_recall: number;
  micro_f1: number;
  per_concept: Record<string, PerConceptMetrics>;
  confusion: Record<string, Record<string, number>>;
  samples: EvalResult[];
}

// ---------------------------------------------------------------------------
// CSV parser (RFC 4180 simple)
// ---------------------------------------------------------------------------

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"') {
        if (next === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(field);
        field = "";
      } else if (ch === "\n" || (ch === "\r" && next === "\n")) {
        row.push(field);
        field = "";
        if (row.length > 0 && row.some((c) => c.trim() !== "")) {
          rows.push(row);
        }
        row = [];
        if (ch === "\r") i++;
      } else if (ch === "\r") {
        row.push(field);
        field = "";
        if (row.length > 0 && row.some((c) => c.trim() !== "")) {
          rows.push(row);
        }
        row = [];
      } else {
        field += ch;
      }
    }
  }
  if (field || row.length > 0) {
    row.push(field);
    if (row.some((c) => c.trim() !== "")) rows.push(row);
  }
  return rows;
}

function loadCorpus(filePath: string): CsvRow[] {
  const raw = fs.readFileSync(filePath, "utf-8");
  const rows = parseCsv(raw);
  if (rows.length < 2) {
    console.error("CSV must have a header row and at least one data row.");
    process.exit(1);
  }

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const codeIdx = header.indexOf("code");
  const langIdx = header.indexOf("language");
  const conceptsIdx = header.indexOf("expected_concepts");

  if (codeIdx === -1 || langIdx === -1 || conceptsIdx === -1) {
    console.error("CSV must have columns: code, language, expected_concepts");
    process.exit(1);
  }

  const data: CsvRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i];
    const lang = (cols[langIdx] ?? "").trim().toLowerCase();
    if (!LANGS.includes(lang as (typeof LANGS)[number])) {
      console.warn(`Row ${i}: unknown language "${lang}", skipping`);
      continue;
    }
    const rawConcepts = (cols[conceptsIdx] ?? "").trim();
    const concepts = rawConcepts
      ? rawConcepts.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    data.push({
      code: cols[codeIdx] ?? "",
      language: lang,
      expected_concepts: concepts,
      index: i - 1,
    });
  }
  return data;
}

// ---------------------------------------------------------------------------
// AI Gateway call
// ---------------------------------------------------------------------------

async function callAI(code: string, language: string): Promise<z.infer<typeof ReviewResponseSchema>> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not set");

  const userPrompt = `Language: ${language}\n\nStudent code:\n\`\`\`${language}\n${code}\n\`\`\`\n\nReview it.`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-5-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI gateway ${res.status}: ${text.slice(0, 200)}`);
  }

  const json = await res.json();
  const content: string = json?.choices?.[0]?.message?.content ?? "{}";
  return ReviewResponseSchema.parse(JSON.parse(extractJson(content)));
}

// ---------------------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------------------

function computeMetrics(results: EvalResult[]): EvalReport {
  const conceptSet = new Set<string>();
  for (const r of results) {
    for (const c of r.expected) conceptSet.add(c);
    for (const c of r.predicted) conceptSet.add(c);
  }

  const tp: Record<string, number> = {};
  const fp: Record<string, number> = {};
  const fn: Record<string, number> = {};
  const confusion: Record<string, Record<string, number>> = {};

  for (const c of conceptSet) {
    tp[c] = 0;
    fp[c] = 0;
    fn[c] = 0;
    confusion[c] = {};
    for (const d of conceptSet) confusion[c][d] = 0;
  }

  let totalTP = 0;
  let totalFP = 0;
  let totalFN = 0;

  for (const r of results) {
    if (!r.ok) continue;
    const expSet = new Set(r.expected);
    const predSet = new Set(r.predicted);

    for (const c of predSet) {
      if (expSet.has(c)) {
        tp[c] = (tp[c] ?? 0) + 1;
        totalTP++;
        confusion[c]![c] = (confusion[c]![c] ?? 0) + 1;
      } else {
        fp[c] = (fp[c] ?? 0) + 1;
        totalFP++;
      }
    }
    for (const c of expSet) {
      if (!predSet.has(c)) {
        fn[c] = (fn[c] ?? 0) + 1;
        totalFN++;
      }
    }
  }

  const perConcept: Record<string, PerConceptMetrics> = {};
  for (const c of conceptSet) {
    const _tp = tp[c] ?? 0;
    const _fp = fp[c] ?? 0;
    const _fn = fn[c] ?? 0;
    const precision = _tp + _fp > 0 ? _tp / (_tp + _fp) : 0;
    const recall = _tp + _fn > 0 ? _tp / (_tp + _fn) : 0;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
    perConcept[c] = { tp: _tp, fp: _fp, fn: _fn, precision, recall, f1 };
  }

  const microPrecision = totalTP + totalFP > 0 ? totalTP / (totalTP + totalFP) : 0;
  const microRecall = totalTP + totalFN > 0 ? totalTP / (totalTP + totalFN) : 0;
  const microF1 =
    microPrecision + microRecall > 0
      ? (2 * microPrecision * microRecall) / (microPrecision + microRecall)
      : 0;

  return {
    total_samples: results.length,
    successful: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    micro_precision: microPrecision,
    micro_recall: microRecall,
    micro_f1: microF1,
    per_concept: perConcept,
    confusion,
    samples: results,
  };
}

// ---------------------------------------------------------------------------
// Per-language breakdown
// ---------------------------------------------------------------------------

function languageBreakdown(results: EvalResult[]): Record<string, { total: number; ok: number }> {
  const langMap: Record<string, { total: number; ok: number }> = {};
  for (const r of results) {
    const lang = r.error ? "unknown" : "python"; // fallback — lang tracked per-sample
  }
  return langMap;
}

function countByLang(rows: CsvRow[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const r of rows) {
    map[r.language] = (map[r.language] ?? 0) + 1;
  }
  return map;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  let corpusPath = path.resolve("scripts/corpus/labelled-errors.csv");
  let limit = 0;
  let delayMs = 500;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--corpus" && args[i + 1]) {
      corpusPath = path.resolve(args[++i]!);
    } else if (args[i] === "--limit" && args[i + 1]) {
      limit = parseInt(args[++i]!, 10);
    } else if (args[i] === "--delay-ms" && args[i + 1]) {
      delayMs = parseInt(args[++i]!, 10);
    }
  }

  if (!fs.existsSync(corpusPath)) {
    console.error(`Corpus not found: ${corpusPath}`);
    console.error("Place a CSV file at scripts/corpus/labelled-errors.csv");
    console.error("Columns: code, language, expected_concepts");
    process.exit(1);
  }

  const rows = loadCorpus(corpusPath);
  const samples = limit > 0 ? rows.slice(0, limit) : rows;

  if (limit === 0) {
    console.error(`Corpus: ${rows.length} rows. Dry run — CSV parsed OK, not calling AI.\n`);
    process.stdout.write(JSON.stringify({ dry_run: true, rows_parsed: rows.length, per_language: countByLang(rows) }, null, 2) + "\n");
    return;
  }

  console.error(`Corpus: ${rows.length} rows, running ${samples.length} samples…\n`);

  const results: EvalResult[] = [];
  const startedAt = Date.now();

  for (const row of samples) {
    console.error(`[${row.index + 1}/${rows.length}] ${row.language} — expected: [${row.expected_concepts.join(", ")}]`);
    try {
      const parsed = await callAI(row.code, row.language);
      const predicted = parsed.concepts.filter((c) => VALID_TOPIC_SLUGS.has(c));
      const expSet = new Set(row.expected_concepts);
      const predSet = new Set(predicted);

      const matched = predicted.filter((c) => expSet.has(c));
      const missed = row.expected_concepts.filter((c) => !predSet.has(c));
      const extra = predicted.filter((c) => !expSet.has(c));

      results.push({
        index: row.index,
        expected: row.expected_concepts,
        predicted,
        matched,
        missed,
        extra,
        ok: true,
        summary: parsed.summary,
      });

      console.error(`  → predicted: [${predicted.join(", ")}]`);
      console.error(`  → matched:   [${matched.join(", ")}]  missed: [${missed.join(", ")}]  extra: [${extra.join(", ")}]\n`);
    } catch (err: any) {
      console.error(`  ✗ ERROR: ${err.message}\n`);
      results.push({
        index: row.index,
        expected: row.expected_concepts,
        predicted: [],
        matched: [],
        missed: row.expected_concepts,
        extra: [],
        ok: false,
        error: err.message,
      });
    }

    if (delayMs > 0 && samples.indexOf(row) < samples.length - 1) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  const report = computeMetrics(results);

  // Per-language breakdown
  const byLang: Record<string, { total: number; ok: number; precision: number; recall: number; f1: number }> = {};
  for (const lang of LANGS) {
    const subset = results.filter((r) => {
      const row = rows.find((x) => x.index === r.index);
      return row?.language === lang;
    });
    if (subset.length === 0) continue;
    const m = computeMetrics(subset);
    byLang[lang] = {
      total: subset.length,
      ok: m.successful,
      precision: m.micro_precision,
      recall: m.micro_recall,
      f1: m.micro_f1,
    };
  }

  const output = {
    elapsed_seconds: parseFloat(elapsed),
    ...report,
    per_language: byLang,
    // Strip heavy detail from console output
    samples: report.samples.map((s) => ({
      index: s.index,
      expected: s.expected,
      predicted: s.predicted,
      matched: s.matched,
      missed: s.missed,
      extra: s.extra,
      ok: s.ok,
      ...(s.error ? { error: s.error } : {}),
    })),
  };

  process.stdout.write(JSON.stringify(output, null, 2) + "\n");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
