import {
  PracticeHarnessTestCaseListSchema,
  type PracticeHarnessTestCase,
} from "@/lib/practice-test-harness";
import type {
  PracticeProblemLanguage,
  PracticeProblemTestValue,
} from "@/lib/practice-problem-contract";

export interface BuildPracticeTestWrapperInput {
  language: PracticeProblemLanguage;
  functionName: string;
  userCode: string;
  testCases: PracticeHarnessTestCase[];
}

export interface PracticeTestWrapper {
  language: PracticeProblemLanguage;
  filename: string;
  code: string;
  testCount: number;
}

type Builder = (input: Required<BuildPracticeTestWrapperInput>) => PracticeTestWrapper;

const LANGUAGE_FILENAMES: Record<PracticeProblemLanguage, string> = {
  python: "main.py",
  javascript: "main.js",
  java: "Main.java",
  cpp: "main.cpp",
  go: "main.go",
};

function assertValidFunctionName(functionName: string): string {
  const trimmed = functionName.trim();
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(trimmed)) {
    throw new Error("Function name must be a valid identifier.");
  }

  return trimmed;
}

function encodeJson(value: unknown): string {
  return JSON.stringify(value);
}

function sanitizeJavaScriptUserCode(userCode: string): string {
  return userCode.replace(/^\s*export\s+/gm, "");
}

function stringLiteral(value: string): string {
  return JSON.stringify(value);
}

function numberLiteral(value: number): string {
  if (!Number.isFinite(value)) {
    throw new Error("Test values must use finite numbers.");
  }

  return String(value);
}

function javaLiteral(value: PracticeProblemTestValue): string {
  if (value === null) return "null";
  if (typeof value === "number") return numberLiteral(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string") return stringLiteral(value);
  if (Array.isArray(value)) {
    if (value.length === 0 || value.every((item) => typeof item === "number")) {
      return `new int[]{${value.map((item) => numberLiteral(item as number)).join(", ")}}`;
    }
    if (value.every((item) => typeof item === "string")) {
      return `new String[]{${value.map((item) => stringLiteral(item as string)).join(", ")}}`;
    }
    if (value.every((item) => typeof item === "boolean")) {
      return `new boolean[]{${value.map((item) => ((item as boolean) ? "true" : "false")).join(", ")}}`;
    }
  }

  throw new Error("Java wrapper supports primitive values and flat primitive arrays.");
}

function cppLiteral(value: PracticeProblemTestValue): string {
  if (value === null) return "nullptr";
  if (typeof value === "number") return numberLiteral(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string") return stringLiteral(value);
  if (Array.isArray(value)) {
    if (value.length === 0 || value.every((item) => typeof item === "number")) {
      return `vector<int>{${value.map((item) => numberLiteral(item as number)).join(", ")}}`;
    }
    if (value.every((item) => typeof item === "string")) {
      return `vector<string>{${value.map((item) => stringLiteral(item as string)).join(", ")}}`;
    }
    if (value.every((item) => typeof item === "boolean")) {
      return `vector<bool>{${value.map((item) => ((item as boolean) ? "true" : "false")).join(", ")}}`;
    }
  }

  throw new Error("C++ wrapper supports primitive values and flat primitive arrays.");
}

function goLiteral(value: PracticeProblemTestValue): string {
  if (value === null) return "nil";
  if (typeof value === "number") return numberLiteral(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string") return stringLiteral(value);
  if (Array.isArray(value)) {
    if (value.length === 0 || value.every((item) => typeof item === "number")) {
      return `[]int{${value.map((item) => numberLiteral(item as number)).join(", ")}}`;
    }
    if (value.every((item) => typeof item === "string")) {
      return `[]string{${value.map((item) => stringLiteral(item as string)).join(", ")}}`;
    }
    if (value.every((item) => typeof item === "boolean")) {
      return `[]bool{${value.map((item) => ((item as boolean) ? "true" : "false")).join(", ")}}`;
    }
  }

  throw new Error("Go wrapper supports primitive values and flat primitive arrays.");
}

function argsFor(
  args: PracticeProblemTestValue[],
  literalBuilder: (value: PracticeProblemTestValue) => string,
): string {
  return args.map((arg) => literalBuilder(arg)).join(", ");
}

const buildPythonWrapper: Builder = ({ functionName, userCode, testCases }) => {
  const testsJson = encodeJson(
    testCases.map((testCase) => ({
      id: testCase.id,
      name: testCase.name,
      arguments: testCase.input.arguments,
      expected: testCase.expectedOutput,
      comparator: testCase.comparator,
      timeoutMs: testCase.timeoutMs,
      visibility: testCase.visibility,
    })),
  );

  return {
    language: "python",
    filename: LANGUAGE_FILENAMES.python,
    testCount: testCases.length,
    code: `import json
import math
import traceback

${userCode}

__codewise_tests = ${testsJson}

def __codewise_compare(actual, expected, comparator):
    if comparator == "numberTolerance":
        return isinstance(actual, (int, float)) and isinstance(expected, (int, float)) and math.isclose(actual, expected, rel_tol=1e-9, abs_tol=1e-9)
    return actual == expected

__codewise_results = []
for __case in __codewise_tests:
    try:
        __actual = ${functionName}(*__case["arguments"])
        __codewise_results.append({
            "id": __case["id"],
            "name": __case["name"],
            "visibility": __case["visibility"],
            "passed": __codewise_compare(__actual, __case["expected"], __case["comparator"]),
            "actual": __actual,
            "expected": __case["expected"],
            "error": None,
        })
    except Exception:
        __codewise_results.append({
            "id": __case["id"],
            "name": __case["name"],
            "visibility": __case["visibility"],
            "passed": False,
            "actual": None,
            "expected": __case["expected"],
            "error": traceback.format_exc(limit=1),
        })

print(json.dumps({"codewiseTestResults": __codewise_results}, separators=(",", ":")))
`,
  };
};

const buildJavaScriptWrapper: Builder = ({ functionName, userCode, testCases }) => {
  const testsJson = encodeJson(
    testCases.map((testCase) => ({
      id: testCase.id,
      name: testCase.name,
      arguments: testCase.input.arguments,
      expected: testCase.expectedOutput,
      comparator: testCase.comparator,
      timeoutMs: testCase.timeoutMs,
      visibility: testCase.visibility,
    })),
  );

  return {
    language: "javascript",
    filename: LANGUAGE_FILENAMES.javascript,
    testCount: testCases.length,
    code: `${sanitizeJavaScriptUserCode(userCode)}

const __codewiseTests = ${testsJson};

function __codewiseCompare(actual, expected, comparator) {
  if (comparator === "numberTolerance") {
    return typeof actual === "number" && typeof expected === "number" && Math.abs(actual - expected) <= 1e-9;
  }
  return JSON.stringify(actual) === JSON.stringify(expected);
}

const __codewiseFunction = eval(${stringLiteral(functionName)});
const __codewiseResults = [];
for (const __case of __codewiseTests) {
  try {
    const actual = __codewiseFunction(...__case.arguments);
    __codewiseResults.push({
      id: __case.id,
      name: __case.name,
      visibility: __case.visibility,
      passed: __codewiseCompare(actual, __case.expected, __case.comparator),
      actual,
      expected: __case.expected,
      error: null,
    });
  } catch (error) {
    __codewiseResults.push({
      id: __case.id,
      name: __case.name,
      visibility: __case.visibility,
      passed: false,
      actual: null,
      expected: __case.expected,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

console.log(JSON.stringify({ codewiseTestResults: __codewiseResults }));
`,
  };
};

const buildJavaWrapper: Builder = ({ functionName, userCode, testCases }) => {
  const runBlocks = testCases
    .map((testCase) => {
      const args = argsFor(testCase.input.arguments, javaLiteral);
      const expected = javaLiteral(testCase.expectedOutput);
      return `    try {
      Object actual = ${functionName}(${args});
      Object expected = ${expected};
      results.add(__result(${stringLiteral(testCase.id)}, ${stringLiteral(testCase.name)}, ${stringLiteral(testCase.visibility)}, __compare(actual, expected, ${stringLiteral(testCase.comparator)}), actual, expected, null));
    } catch (Throwable error) {
      results.add(__result(${stringLiteral(testCase.id)}, ${stringLiteral(testCase.name)}, ${stringLiteral(testCase.visibility)}, false, null, ${expected}, error.getClass().getSimpleName() + ": " + error.getMessage()));
    }`;
    })
    .join("\n");

  return {
    language: "java",
    filename: LANGUAGE_FILENAMES.java,
    testCount: testCases.length,
    code: `import java.util.*;

public class Main {
${userCode}

  static boolean __compare(Object actual, Object expected, String comparator) {
    if ("numberTolerance".equals(comparator) && actual instanceof Number && expected instanceof Number) {
      return Math.abs(((Number) actual).doubleValue() - ((Number) expected).doubleValue()) <= 1e-9;
    }
    if (actual instanceof int[] && expected instanceof int[]) return Arrays.equals((int[]) actual, (int[]) expected);
    if (actual instanceof String[] && expected instanceof String[]) return Arrays.equals((String[]) actual, (String[]) expected);
    if (actual instanceof boolean[] && expected instanceof boolean[]) return Arrays.equals((boolean[]) actual, (boolean[]) expected);
    return Objects.deepEquals(actual, expected);
  }

  static String __escape(String value) {
    return value.replace("\\\\", "\\\\\\\\").replace("\\"", "\\\\\\"").replace("\\n", "\\\\n");
  }

  static String __json(Object value) {
    if (value == null) return "null";
    if (value instanceof String) return "\\"" + __escape((String) value) + "\\"";
    if (value instanceof Number || value instanceof Boolean) return String.valueOf(value);
    if (value instanceof int[]) return Arrays.toString((int[]) value);
    if (value instanceof boolean[]) return Arrays.toString((boolean[]) value);
    if (value instanceof String[]) return Arrays.toString((String[]) value);
    return "\\"" + __escape(String.valueOf(value)) + "\\"";
  }

  static String __result(String id, String name, String visibility, boolean passed, Object actual, Object expected, String error) {
    return "{\\"id\\":\\"" + __escape(id) + "\\",\\"name\\":\\"" + __escape(name) + "\\",\\"visibility\\":\\"" + __escape(visibility) + "\\",\\"passed\\":" + passed + ",\\"actual\\":" + __json(actual) + ",\\"expected\\":" + __json(expected) + ",\\"error\\":" + __json(error) + "}";
  }

  public static void main(String[] args) {
    List<String> results = new ArrayList<>();
${runBlocks}
    System.out.println("{\\"codewiseTestResults\\":[" + String.join(",", results) + "]}");
  }
}
`,
  };
};

const buildCppWrapper: Builder = ({ functionName, userCode, testCases }) => {
  const runBlocks = testCases
    .map((testCase) => {
      const args = argsFor(testCase.input.arguments, cppLiteral);
      const expected = cppLiteral(testCase.expectedOutput);
      return `  try {
    auto actual = ${functionName}(${args});
    auto expected = ${expected};
    results.push_back(__result(${stringLiteral(testCase.id)}, ${stringLiteral(testCase.name)}, ${stringLiteral(testCase.visibility)}, __compare(actual, expected, ${stringLiteral(testCase.comparator)}), __json(actual), __json(expected), "null"));
  } catch (const exception& error) {
    results.push_back(__result(${stringLiteral(testCase.id)}, ${stringLiteral(testCase.name)}, ${stringLiteral(testCase.visibility)}, false, "null", __json(${expected}), __json(string(error.what()))));
  }`;
    })
    .join("\n");

  return {
    language: "cpp",
    filename: LANGUAGE_FILENAMES.cpp,
    testCount: testCases.length,
    code: `#include <bits/stdc++.h>
using namespace std;

${userCode}

string __escape(const string& value) {
  string out;
  for (char c : value) {
    if (c == '\\\\') out += "\\\\\\\\";
    else if (c == '"') { out += '\\\\'; out += '"'; }
    else if (c == '\\n') out += "\\\\n";
    else out += c;
  }
  return out;
}

string __json(const string& value) { return "\\"" + __escape(value) + "\\""; }
string __json(const char* value) { return __json(string(value)); }
string __json(bool value) { return value ? "true" : "false"; }
string __json(nullptr_t) { return "null"; }
template <typename T, typename enable_if<is_arithmetic<T>::value && !is_same<T, bool>::value, int>::type = 0>
string __json(T value) { return to_string(value); }
template <typename T>
string __json(const vector<T>& values) {
  string out = "[";
  for (size_t i = 0; i < values.size(); ++i) {
    if (i > 0) out += ",";
    out += __json(values[i]);
  }
  return out + "]";
}

template <typename T, typename U>
typename enable_if<is_arithmetic<T>::value && is_arithmetic<U>::value, bool>::type __compare(const T& actual, const U& expected, const string& comparator) {
  if (comparator == "numberTolerance") {
    return fabs((double) actual - (double) expected) <= 1e-9;
  }
  return actual == expected;
}
template <typename T, typename U>
typename enable_if<!(is_arithmetic<T>::value && is_arithmetic<U>::value), bool>::type __compare(const T& actual, const U& expected, const string& comparator) {
  return actual == expected;
}

string __result(const string& id, const string& name, const string& visibility, bool passed, const string& actual, const string& expected, const string& error) {
  return "{\\"id\\":\\"" + __escape(id) + "\\",\\"name\\":\\"" + __escape(name) + "\\",\\"visibility\\":\\"" + __escape(visibility) + "\\",\\"passed\\":" + __json(passed) + ",\\"actual\\":" + actual + ",\\"expected\\":" + expected + ",\\"error\\":" + error + "}";
}

int main() {
  vector<string> results;
${runBlocks}
  cout << "{\\"codewiseTestResults\\":[" << [&](){ string out; for (size_t i = 0; i < results.size(); ++i) { if (i > 0) out += ","; out += results[i]; } return out; }() << "]}" << endl;
  return 0;
}
`,
  };
};

const buildGoWrapper: Builder = ({ functionName, userCode, testCases }) => {
  const runBlocks = testCases
    .map((testCase) => {
      const args = argsFor(testCase.input.arguments, goLiteral);
      const expected = goLiteral(testCase.expectedOutput);
      return `  func() {
    expected := ${expected}
    defer func() {
      if err := recover(); err != nil {
        results = append(results, __codewiseResult{ID: ${stringLiteral(testCase.id)}, Name: ${stringLiteral(testCase.name)}, Visibility: ${stringLiteral(testCase.visibility)}, Passed: false, Actual: nil, Expected: expected, Error: fmt.Sprint(err)})
      }
    }()
    actual := ${functionName}(${args})
    results = append(results, __codewiseResult{ID: ${stringLiteral(testCase.id)}, Name: ${stringLiteral(testCase.name)}, Visibility: ${stringLiteral(testCase.visibility)}, Passed: __codewiseCompare(actual, expected, ${stringLiteral(testCase.comparator)}), Actual: actual, Expected: expected, Error: nil})
  }()`;
    })
    .join("\n");

  return {
    language: "go",
    filename: LANGUAGE_FILENAMES.go,
    testCount: testCases.length,
    code: `package main

import (
  "encoding/json"
  "fmt"
  "math"
  "reflect"
)

${userCode}

type __codewiseResult struct {
  ID string \`json:"id"\`
  Name string \`json:"name"\`
  Visibility string \`json:"visibility"\`
  Passed bool \`json:"passed"\`
  Actual any \`json:"actual"\`
  Expected any \`json:"expected"\`
  Error any \`json:"error"\`
}

func __codewiseFloat(value any) (float64, bool) {
  switch typed := value.(type) {
  case int:
    return float64(typed), true
  case int64:
    return float64(typed), true
  case float64:
    return typed, true
  default:
    return 0, false
  }
}

func __codewiseCompare(actual any, expected any, comparator string) bool {
  if comparator == "numberTolerance" {
    actualNumber, actualOk := __codewiseFloat(actual)
    expectedNumber, expectedOk := __codewiseFloat(expected)
    return actualOk && expectedOk && math.Abs(actualNumber-expectedNumber) <= 1e-9
  }
  return reflect.DeepEqual(actual, expected)
}

func main() {
  results := []__codewiseResult{}
${runBlocks}
  payload, _ := json.Marshal(map[string]any{"codewiseTestResults": results})
  fmt.Println(string(payload))
}
`,
  };
};

const WRAPPER_BUILDERS: Record<PracticeProblemLanguage, Builder> = {
  python: buildPythonWrapper,
  javascript: buildJavaScriptWrapper,
  java: buildJavaWrapper,
  cpp: buildCppWrapper,
  go: buildGoWrapper,
};

export function buildPracticeTestWrapper(
  input: BuildPracticeTestWrapperInput,
): PracticeTestWrapper {
  const functionName = assertValidFunctionName(input.functionName);
  const testCases = PracticeHarnessTestCaseListSchema.parse(input.testCases);

  return WRAPPER_BUILDERS[input.language]({
    language: input.language,
    functionName,
    userCode: input.userCode,
    testCases,
  });
}
