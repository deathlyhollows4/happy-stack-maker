import { describe, expect, it } from "vitest";
import {
  buildPracticeRunOutputState,
  formatPracticeExecutionStatus,
  formatPracticeTestValue,
  getPracticeRunRawOutput,
  stripPracticeHarnessPayload,
  type PracticeRunOutput,
} from "@/lib/practice-run-output-view";

const harnessPayload = JSON.stringify({
  codewiseTestResults: [
    {
      id: "visible-1",
      name: "mixed values",
      visibility: "visible",
      passed: false,
      actual: 1,
      expected: 2,
      error: null,
    },
  ],
});

describe("practice run output view", () => {
  it("formats visible-test values and execution statuses", () => {
    expect(formatPracticeTestValue(["a", 2])).toBe('["a",2]');
    expect(formatPracticeTestValue(undefined)).toBe("undefined");
    expect(formatPracticeExecutionStatus("wrong_answer")).toBe("Wrong answer");
    expect(formatPracticeExecutionStatus("unsupported_signature")).toBe("Unsupported signature");
  });

  it("strips harness JSON from visible-test stdout", () => {
    expect(stripPracticeHarnessPayload(harnessPayload)).toBe("");
    expect(stripPracticeHarnessPayload(`debug line\n${harnessPayload}`)).toBe("debug line");
  });

  it("builds an idle visible-test runner state", () => {
    const state = buildPracticeRunOutputState({
      output: null,
      running: false,
      visibleTestCount: 2,
      canRunVisibleTests: true,
    });

    expect(state.mode).toBe("idle");
    expect(state.title).toBe("Visible test runner");
    expect(state.statusLabel).toBe("Not run yet");
    expect(state.emptyMessage).toBe("Run tests to see per-test pass/fail results.");
  });

  it("builds a visible-test result state with per-test rows", () => {
    const output: PracticeRunOutput = {
      stdout: `debug line\n${harnessPayload}`,
      stderr: "",
      exit: 0,
      testResults: [
        {
          id: "visible-1",
          name: "mixed values",
          visibility: "visible",
          passed: false,
          actual: 1,
          expected: 2,
          error: null,
        },
      ],
      testSummary: {
        total: 1,
        passed: 0,
        failed: 1,
        status: "wrong_answer",
      },
    };

    const state = buildPracticeRunOutputState({
      output,
      running: false,
      visibleTestCount: 1,
      canRunVisibleTests: true,
    });

    expect(state.mode).toBe("visible-tests");
    expect(state.statusLabel).toBe("Wrong answer");
    expect(state.statusDetail).toBe("0/1 visible test passed");
    expect(state.testResults[0]?.actual).toBe(1);
    expect(state.rawOutput).toBe("debug line");
  });

  it("keeps unsupported-signature errors visible when no test rows exist", () => {
    const output: PracticeRunOutput = {
      stdout: "",
      stderr: "This function signature is not supported by the test runner yet.",
      exit: 1,
      testSummary: {
        total: 2,
        passed: 0,
        failed: 2,
        status: "unsupported_signature",
      },
    };

    const state = buildPracticeRunOutputState({
      output,
      running: false,
      visibleTestCount: 2,
      canRunVisibleTests: true,
    });

    expect(state.statusLabel).toBe("Unsupported signature");
    expect(state.emptyMessage).toBeNull();
    expect(state.rawOutput).toContain("not supported");
  });

  it("builds a stdin run state when visible tests are unavailable", () => {
    const output: PracticeRunOutput = {
      stdout: "hello",
      stderr: "",
      exit: 0,
    };

    const state = buildPracticeRunOutputState({
      output,
      running: false,
      visibleTestCount: 0,
      canRunVisibleTests: false,
    });

    expect(state.mode).toBe("stdin");
    expect(state.statusLabel).toBe("Completed");
    expect(getPracticeRunRawOutput(output)).toBe("hello");
  });
});
