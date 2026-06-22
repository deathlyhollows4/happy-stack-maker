import { z } from "zod";
import {
  normalizePracticeProblemTestCases,
  type PracticeHarnessTestCase,
} from "@/lib/practice-test-harness";
import {
  PracticeProblemLanguageSchema,
  PracticeProblemTestCaseSchema,
  type PracticeProblemLanguage,
} from "@/lib/practice-problem-contract";
import { buildPracticeTestWrapper, type PracticeTestWrapper } from "@/lib/practice-test-wrappers";

export const PracticeVisibleTestRunInputSchema = z
  .object({
    functionName: z
      .string()
      .trim()
      .min(1)
      .max(80)
      .regex(/^[A-Za-z_][A-Za-z0-9_]*$/, "Function name must be a valid identifier."),
    visibleTests: z
      .array(PracticeProblemTestCaseSchema.extend({ visibility: z.literal("visible") }))
      .min(1)
      .max(6),
  })
  .strict();

export const PracticeTestRunResultSchema = z
  .object({
    id: z.string().trim().min(1),
    name: z.string().trim().min(1),
    visibility: z.enum(["visible", "hidden"]),
    passed: z.boolean(),
    actual: z.unknown().optional(),
    expected: z.unknown().optional(),
    error: z.union([z.string(), z.null()]).optional(),
  })
  .strict();

export const PracticeTestRunPayloadSchema = z
  .object({
    codewiseTestResults: z.array(PracticeTestRunResultSchema),
  })
  .strict();

export const PracticeExecutionStatusSchema = z.enum([
  "passed",
  "failed",
  "wrong_answer",
  "compile_error",
  "runtime_error",
  "timeout",
  "unsupported_signature",
  "no_tests",
]);

export type PracticeVisibleTestRunInput = z.infer<typeof PracticeVisibleTestRunInputSchema>;
export type PracticeTestRunResult = z.infer<typeof PracticeTestRunResultSchema>;
export type PracticeExecutionStatus = z.infer<typeof PracticeExecutionStatusSchema>;

export interface BuildPracticeVisibleTestWrapperInput extends PracticeVisibleTestRunInput {
  language: PracticeProblemLanguage;
  userCode: string;
}

export interface PracticeExecutionSummary {
  total: number;
  passed: number;
  failed: number;
  status: PracticeExecutionStatus;
}

export interface NormalizePracticeExecutionInput {
  stdout: string;
  stderr: string;
  compileStderr: string;
  exitCode: number;
  runSignal?: string | null;
}

export interface NormalizedPracticeExecution {
  testResults?: PracticeTestRunResult[];
  testSummary: PracticeExecutionSummary;
  error?: string;
}

function normalizeResult(result: PracticeTestRunResult): PracticeTestRunResult {
  return {
    id: result.id,
    name: result.name,
    visibility: result.visibility,
    passed: result.passed,
    actual: Object.prototype.hasOwnProperty.call(result, "actual") ? result.actual : null,
    expected: Object.prototype.hasOwnProperty.call(result, "expected") ? result.expected : null,
    error: result.error ?? null,
  };
}

function parseJsonPayload(candidate: string): PracticeTestRunResult[] | null {
  try {
    const parsed = PracticeTestRunPayloadSchema.parse(JSON.parse(candidate));
    return parsed.codewiseTestResults.map(normalizeResult);
  } catch {
    return null;
  }
}

function hasTimeoutEvidence(input: NormalizePracticeExecutionInput): boolean {
  const joined = [input.stderr, input.compileStderr, input.runSignal ?? ""].join("\n");
  return /\b(timed?\s*out|timeout|time limit|sigkill|sigterm)\b/i.test(joined);
}

function getResultStatus(input: {
  failed: number;
  exitCode: number;
  stderr: string;
  testResults: PracticeTestRunResult[];
}): PracticeExecutionStatus {
  if (input.failed === 0 && input.exitCode === 0) return "passed";
  if (input.testResults.some((result) => typeof result.error === "string" && result.error.trim())) {
    return "runtime_error";
  }
  if (input.exitCode !== 0 || input.stderr.trim()) return "runtime_error";
  return "wrong_answer";
}

export function buildPracticeExecutionFailure(input: {
  status: Exclude<PracticeExecutionStatus, "passed" | "wrong_answer">;
  total?: number;
  error?: string;
}): NormalizedPracticeExecution {
  const total = Math.max(input.total ?? 0, 0);
  const execution: NormalizedPracticeExecution = {
    testSummary: {
      total,
      passed: 0,
      failed: total,
      status: input.status,
    },
  };

  if (input.error) execution.error = input.error;
  return execution;
}

export function buildPracticeVisibleTestWrapper(
  input: BuildPracticeVisibleTestWrapperInput,
): PracticeTestWrapper {
  const parsed = PracticeVisibleTestRunInputSchema.parse({
    functionName: input.functionName,
    visibleTests: input.visibleTests,
  });
  const language = PracticeProblemLanguageSchema.parse(input.language);
  const testCases: PracticeHarnessTestCase[] = normalizePracticeProblemTestCases(
    parsed.visibleTests,
  );

  return buildPracticeTestWrapper({
    language,
    functionName: parsed.functionName,
    userCode: input.userCode,
    testCases,
  });
}

export function parsePracticeTestRunOutput(stdout: string): PracticeTestRunResult[] | null {
  const trimmed = stdout.trim();
  if (!trimmed) return null;

  const fullPayload = parseJsonPayload(trimmed);
  if (fullPayload) return fullPayload;

  const lines = trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .reverse();

  for (const line of lines) {
    const parsed = parseJsonPayload(line);
    if (parsed) return parsed;
  }

  return null;
}

export function normalizePracticeExecutionResult(
  input: NormalizePracticeExecutionInput,
): NormalizedPracticeExecution {
  const testResults = parsePracticeTestRunOutput(input.stdout);
  if (testResults) {
    const passed = testResults.filter((result) => result.passed).length;
    const failed = testResults.length - passed;
    return {
      testResults,
      testSummary: {
        total: testResults.length,
        passed,
        failed,
        status: hasTimeoutEvidence(input)
          ? "timeout"
          : getResultStatus({
              failed,
              exitCode: input.exitCode,
              stderr: input.stderr,
              testResults,
            }),
      },
    };
  }

  const hasCompileError = input.compileStderr.trim().length > 0;
  const hasRuntimeError = input.exitCode !== 0 || input.stderr.trim().length > 0;
  const status = hasTimeoutEvidence(input)
    ? "timeout"
    : hasCompileError
      ? "compile_error"
      : hasRuntimeError
        ? "runtime_error"
        : "no_tests";

  return buildPracticeExecutionFailure({ status });
}
