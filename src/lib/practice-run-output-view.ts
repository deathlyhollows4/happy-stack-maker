export interface PracticeTestRunResultView {
  id: string;
  name: string;
  visibility: "visible" | "hidden";
  passed: boolean;
  actual?: unknown;
  expected?: unknown;
  error?: string | null;
}

export type PracticeExecutionStatusView =
  | "passed"
  | "failed"
  | "wrong_answer"
  | "compile_error"
  | "runtime_error"
  | "timeout"
  | "unsupported_signature"
  | "no_tests";

export interface PracticeRunOutput {
  stdout: string;
  stderr: string;
  exit: number;
  testResults?: PracticeTestRunResultView[];
  testSummary?: {
    total: number;
    passed: number;
    failed: number;
    status: PracticeExecutionStatusView;
  };
}

export type PracticeRunOutputMode = "idle" | "running" | "visible-tests" | "stdin";
export type PracticeRunOutputTone = "muted" | "success" | "destructive";

export interface PracticeRunOutputState {
  mode: PracticeRunOutputMode;
  title: string;
  statusLabel: string;
  statusDetail: string;
  tone: PracticeRunOutputTone;
  testResults: PracticeTestRunResultView[];
  rawOutput: string;
  emptyMessage: string | null;
  exitCode: number | null;
}

export function formatPracticeTestValue(value: unknown) {
  if (typeof value === "undefined") return "undefined";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function formatPracticeExecutionStatus(status: PracticeExecutionStatusView) {
  switch (status) {
    case "passed":
      return "Passed";
    case "wrong_answer":
    case "failed":
      return "Wrong answer";
    case "compile_error":
      return "Compile error";
    case "runtime_error":
      return "Runtime error";
    case "timeout":
      return "Time limit exceeded";
    case "unsupported_signature":
      return "Unsupported signature";
    case "no_tests":
      return "No tests";
  }
}

function pluralizeVisibleTests(count: number) {
  return `${count} visible ${count === 1 ? "test" : "tests"}`;
}

function visibleTestNoun(count: number) {
  return count === 1 ? "visible test" : "visible tests";
}

function isHarnessPayload(text: string): boolean {
  try {
    const parsed = JSON.parse(text) as { codewiseTestResults?: unknown };
    return Array.isArray(parsed.codewiseTestResults);
  } catch {
    return false;
  }
}

export function stripPracticeHarnessPayload(stdout: string) {
  const trimmed = stdout.trim();
  if (!trimmed) return "";
  if (isHarnessPayload(trimmed)) return "";

  return stdout
    .split(/\r?\n/)
    .filter((line) => !isHarnessPayload(line.trim()))
    .join("\n")
    .trim();
}

export function getPracticeRunRawOutput(output: PracticeRunOutput) {
  const stdout = output.testSummary
    ? stripPracticeHarnessPayload(output.stdout)
    : output.stdout.trim();
  const stderr = output.stderr.trim();
  return [stdout, stderr].filter(Boolean).join("\n").trim();
}

export function buildPracticeRunOutputState(input: {
  output: PracticeRunOutput | null;
  running: boolean;
  visibleTestCount: number;
  canRunVisibleTests: boolean;
}): PracticeRunOutputState {
  const visibleTestLabel = pluralizeVisibleTests(input.visibleTestCount);

  if (input.running) {
    return {
      mode: "running",
      title: input.canRunVisibleTests ? "Visible test runner" : "Program run",
      statusLabel: input.canRunVisibleTests ? "Executing tests" : "Executing code",
      statusDetail: input.canRunVisibleTests ? visibleTestLabel : "Using stdin",
      tone: "muted",
      testResults: [],
      rawOutput: "",
      emptyMessage: input.canRunVisibleTests
        ? "Running visible tests against your function."
        : "Running your program with stdin.",
      exitCode: null,
    };
  }

  if (!input.output) {
    return {
      mode: "idle",
      title: input.canRunVisibleTests ? "Visible test runner" : "Program run",
      statusLabel: "Not run yet",
      statusDetail: input.canRunVisibleTests ? visibleTestLabel : "No visible-test run",
      tone: "muted",
      testResults: [],
      rawOutput: "",
      emptyMessage: input.canRunVisibleTests
        ? "Run tests to see per-test pass/fail results."
        : input.visibleTestCount > 0
          ? "Visible tests need a supported function signature for this language."
          : "Run your code to see stdout and stderr.",
      exitCode: null,
    };
  }

  if (input.output.testSummary) {
    const summary = input.output.testSummary;
    const rawOutput = getPracticeRunRawOutput(input.output);
    const testResults = input.output.testResults ?? [];
    return {
      mode: "visible-tests",
      title: "Visible test runner",
      statusLabel: formatPracticeExecutionStatus(summary.status),
      statusDetail: `${summary.passed}/${summary.total} ${visibleTestNoun(summary.total)} passed`,
      tone: summary.status === "passed" ? "success" : "destructive",
      testResults,
      rawOutput,
      emptyMessage: testResults.length || rawOutput ? null : "No per-test rows were returned.",
      exitCode: input.output.exit,
    };
  }

  const rawOutput = getPracticeRunRawOutput(input.output);
  return {
    mode: "stdin",
    title: "Program run",
    statusLabel: input.output.exit === 0 ? "Completed" : "Exited with errors",
    statusDetail: `exit ${input.output.exit}`,
    tone: input.output.exit === 0 ? "success" : "destructive",
    testResults: [],
    rawOutput,
    emptyMessage: rawOutput ? null : "No stdout or stderr.",
    exitCode: input.output.exit,
  };
}
